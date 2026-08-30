import { readFileSync } from "node:fs"
import { basename, extname } from "node:path"

import {
  contactPointsOf,
  dedupeKey,
  dedupeKeyOf,
  insertProspects,
  listProspectKeys,
  findSuppressions,
  normalizeProspect,
  type ProspectDraft,
  type ProspectInput,
} from "@jamie-nisbet/services"

import { integer, parseArgs, required, UsageError } from "./lib/args"
import { mapRow, TEMPLATE_HEADERS } from "./lib/columns"
import { parseCsvRecords } from "./lib/csv"
import { requireDatabase } from "./lib/db"
import {
  bullet,
  done,
  dryRunBanner,
  fail,
  heading,
  line,
  plural,
  table,
  warn,
} from "./lib/out"
import { shortId } from "./lib/resolve"

// leads-import — the door the cold pool walks in through.
//
// A compiled list of local businesses goes in; `prospect` rows come out,
// stamped with where they came from. Four things happen between those two
// facts, and each of them is a way the import can decline to write a row:
//
//   1. the cells are normalized into the columns' own types (../src/import.ts)
//   2. rows that name a business already in the table are reported, not merged
//   3. rows carrying a suppressed contact point are skipped outright
//   4. everything left is written in one batch as `prospect`, source `import`
//
// It never updates an existing row. "Report, don't overwrite" is the stub's
// wording and the right instinct: the row in the table has been worked, and a
// second list's guess at a phone number is not better evidence than the call
// that was already made.

const HELP = `
leads-import — seed biz.clients from a compiled prospect list

  pnpm --filter @jamie-nisbet/services leads-import -- --file <path> [options]

Options
  --file <path>            CSV or JSON list to import (required)
  --format csv|json        Override the format guessed from the extension
  --delimiter <char>       Force the CSV delimiter (sniffed between , and ; )
  --source-detail <text>   Provenance stamped on every row
                           (default: the file's name)
  --limit <n>              Only take the first n rows — for a trial import
  --dry-run                Report what would happen; write nothing
  --template               Print the canonical CSV header line and exit
  --help

Columns
  Headers are matched case- and accent-insensitively, with aliases:
  "Telemóvel" is phone, "Pain point" is hook, "Priority" is fit_tier.
  Run with --template for the canonical spelling of each.

Notes
  · A row whose business name + town already exists is reported and skipped.
  · A row carrying an opted-out email, phone or Instagram handle is skipped
    entirely — the whole business, not just that channel.
  · Rows land as \`prospect\` with last_touched_at empty: nothing has happened
    with them yet.
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["file", "format", "delimiter", "source-detail", "limit"],
    boolean: ["dry-run", "template"],
  })

  if (args.flags.has("help")) return line(HELP.trim())
  if (args.flags.has("template")) return line(TEMPLATE_HEADERS.join(","))

  const path = required(args, "file")
  const dryRun = args.flags.has("dry-run")
  const sourceDetail = args.values.get("source-detail")?.trim() || basename(path)
  const cap = args.values.has("limit") ? integer(args, "limit", 0) : null

  if (dryRun) dryRunBanner()
  requireDatabase()
  line(`file: ${path}`)
  line(`provenance: source=import · source_detail="${sourceDetail}"`)

  // ---- Read ------------------------------------------------------------------
  const format = (args.values.get("format") ?? extname(path).replace(".", "")).toLowerCase()
  const records = readRecords(path, format, args.values.get("delimiter"))
  // What "row 12" means in the report: a CSV's line number counts its header,
  // a JSON array's does not.
  const firstRow = format === "json" ? 1 : 2
  if (records.length === 0) fail(`${path} has no rows`)
  const taken = cap === null ? records : records.slice(0, cap)

  const unmapped = new Set<string>()
  const inputs: ProspectInput[] = []
  for (const record of taken) {
    const mapped = mapRow(record)
    for (const header of mapped.unmapped) unmapped.add(header)
    inputs.push(mapped.input)
  }

  heading(`Read ${plural(taken.length, "row")}${cap !== null && records.length > taken.length ? ` of ${records.length} (--limit)` : ""}`)
  if (unmapped.size > 0) {
    warn(`columns nothing was mapped from: ${[...unmapped].join(", ")}`)
  }

  // ---- Normalize -------------------------------------------------------------
  type Candidate = { row: number; draft: ProspectDraft }
  const candidates: Candidate[] = []
  const rejected: string[][] = []

  taken.forEach((_record, at) => {
    const { draft, problem, warnings } = normalizeProspect(inputs[at])
    const rowNumber = at + firstRow
    if (!draft) {
      rejected.push([`row ${rowNumber}`, "—", problem ?? "could not be read"])
      return
    }
    for (const message of warnings) warn(`row ${rowNumber} (${draft.name}): ${message}`)
    if (reachableOn(draft).length === 0) {
      warn(`row ${rowNumber} (${draft.name}): no phone, email, handle or town — nothing to reach them on`)
    }
    candidates.push({ row: rowNumber, draft })
  })

  // ---- Dedupe ----------------------------------------------------------------
  const existing = await listProspectKeys()
  const byKey = new Map<string, (typeof existing)[number]>()
  for (const row of existing) {
    const key = dedupeKeyOf(row)
    if (!byKey.has(key)) byKey.set(key, row)
  }

  const seenInFile = new Map<string, number>()
  const duplicates: string[][] = []
  const deduped: Candidate[] = []

  for (const candidate of candidates) {
    const key = dedupeKey(candidate.draft.name, candidate.draft.town)

    const already = byKey.get(key)
    if (already) {
      duplicates.push([
        `row ${candidate.row}`,
        candidate.draft.name,
        `already in the table as ${shortId(already.id)} (${already.status}${already.archivedAt ? ", archived" : ""})`,
      ])
      continue
    }

    const twin = seenInFile.get(key)
    if (twin !== undefined) {
      duplicates.push([`row ${candidate.row}`, candidate.draft.name, `same business as row ${twin}`])
      continue
    }

    seenInFile.set(key, candidate.row)
    deduped.push(candidate)
  }

  // ---- Suppressions ----------------------------------------------------------
  // One round trip for the whole batch, then a set lookup per row. The check is
  // the reason sequence 3 landed before this one: a business that asked to be
  // left alone must not be walked back in by the next list they appear on.
  const points = deduped.flatMap((candidate) => contactPointsOf(candidate.draft))
  const closed = new Set(
    (await findSuppressions(points)).map((row) => `${row.kind}:${row.value}`)
  )

  const suppressed: string[][] = []
  const importable: Candidate[] = []

  for (const candidate of deduped) {
    const hit = contactPointsOf(candidate.draft).find((point) =>
      closed.has(`${point.kind}:${point.value}`)
    )
    if (hit) {
      suppressed.push([`row ${candidate.row}`, candidate.draft.name, `${hit.kind} ${hit.value} has opted out`])
      continue
    }
    importable.push(candidate)
  }

  // ---- Report ----------------------------------------------------------------
  if (rejected.length > 0) {
    heading(`Not a lead — ${plural(rejected.length, "row")}`)
    table(rejected)
  }
  if (duplicates.length > 0) {
    heading(`Already known — ${plural(duplicates.length, "row")} skipped`)
    table(duplicates, { max: 60 })
  }
  if (suppressed.length > 0) {
    heading(`Opted out — ${plural(suppressed.length, "row")} skipped`)
    table(suppressed, { max: 60 })
    bullet("The whole business is skipped, not just that channel — see .icm/docs/lia-cold-outreach.md §4.")
  }

  heading(`${dryRun ? "Would import" : "Importing"} ${plural(importable.length, "prospect")}`)
  if (importable.length > 0) {
    table(
      importable.map(({ draft }) => [
        draft.fitTier ?? "—",
        draft.name,
        draft.town ?? "—",
        draft.sector ?? "—",
        reachableOn(draft).join("/") || "—",
        draft.hook ?? "—",
      ]),
      { head: ["tier", "name", "town", "sector", "reach", "hook"], max: 34 }
    )
  }

  if (dryRun) {
    return done(
      `Dry run. ${plural(importable.length, "row")} would land · ` +
        `${duplicates.length} already known · ${suppressed.length} opted out · ${rejected.length} unreadable.`
    )
  }
  if (importable.length === 0) {
    return done("Nothing to import.")
  }

  const written = await insertProspects(
    importable.map(({ draft }) => draft),
    { sourceDetail }
  )

  done(
    `Imported ${plural(written.length, "prospect")} as "${sourceDetail}". ` +
      `They have no next action yet — leads-crack will list them.`
  )
}

/** Which doors this draft has, in the words the queue uses. Mirrors
 *  `reachableChannels` in the cadence, which takes a lead rather than a
 *  draft. */
function reachableOn(draft: ProspectDraft): string[] {
  const doors: string[] = []
  if (draft.whatsapp || draft.phone) doors.push("whatsapp")
  if (draft.email) doors.push("email")
  if (draft.instagram) doors.push("instagram")
  if (draft.phone) doors.push("phone")
  if (draft.town) doors.push("walkin")
  return doors
}

function readRecords(
  path: string,
  kind: string,
  delimiter: string | undefined
): Record<string, unknown>[] {
  const text = readText(path)
  if (kind === "json") return readJson(text, path)
  if (kind === "csv" || kind === "tsv" || kind === "txt" || kind === "") {
    return parseCsvRecords(text, delimiter ?? (kind === "tsv" ? "\t" : undefined))
  }
  return fail(`unknown format "${kind}" — pass --format csv or --format json`)
}

function readText(path: string): string {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return fail(`cannot read ${path}`)
  }
}

function readJson(text: string, path: string): Record<string, unknown>[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return fail(`${path} is not valid JSON: ${(error as Error).message}`)
  }
  // Both shapes a hand-written list arrives in: a bare array, or an object
  // with the array under `rows`/`prospects`/`leads`.
  const rows = Array.isArray(parsed)
    ? parsed
    : ((parsed as Record<string, unknown>)?.rows ??
      (parsed as Record<string, unknown>)?.prospects ??
      (parsed as Record<string, unknown>)?.leads)
  if (!Array.isArray(rows)) {
    return fail(`${path} should be an array of rows, or an object with a "rows" array`)
  }
  return rows.filter(
    (row): row is Record<string, unknown> => typeof row === "object" && row !== null
  )
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
