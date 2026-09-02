import { generateText } from "ai"

import {
  buildEnrichmentPrompt,
  deriveFitTier,
  ENRICH_MAX_OUTPUT_TOKENS,
  ENRICH_MODEL,
  ENRICH_STALE_DAYS,
  enrichmentChanges,
  enrichmentPatch,
  fetchWebsitePage,
  isGatewayConfigured,
  listEnrichable,
  listTierable,
  parseEnrichment,
  saveEnrichment,
  setFitTier,
  type Client,
  type EnrichmentChange,
} from "@jamie-nisbet/services"

import { integer, parseArgs, UsageError } from "./lib/args"
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
import { resolveClient, shortId } from "./lib/resolve"

// leads-enrich — read their websites, fill the blanks, re-derive the tiers.
//
// The pool arrives with a hand-researched hook each and goes stale from the day
// it lands. This is what keeps it alive: one page fetched per lead, a cheap
// model asked what is on it, and the answer written into the columns that were
// empty.
//
// **It only ever fills blanks.** A proposal that would replace something
// already on the record is printed and left alone — every time, with no flag to
// override it. That is not caution for its own sake: the hook is usually a
// sentence Jamie wrote after looking at the business himself, and eighty-five
// of them quietly bettered by a nano model overnight is precisely the failure
// this whole sequence was specified to avoid. Conflicts belong on the lead's
// own page, where the Enrich sheet shows both sentences and takes one tap.
//
// **The tier is arithmetic.** `deriveFitTier` decides it from the facts — the
// script proposes nothing about it. It is written where a row has no tier yet;
// where a row already has one and the facts have moved, that is reported like
// any other conflict, and `--retier` is the deliberate re-run that takes them
// all. That run reads no pages and spends nothing at the Gateway.
//
// It owns no SQL and no prompt. `listEnrichable`, `fetchWebsitePage`,
// `buildEnrichmentPrompt`, `parseEnrichment`, `enrichmentChanges`,
// `enrichmentPatch` and `deriveFitTier` are all from the barrel — the same
// functions the dashboard's Enrich sheet calls — which is what stops a pool
// graded from a terminal disagreeing with one graded from a phone. What this
// file owns is the loop, the pacing and the report.

const HELP = `
leads-enrich — read their websites, fill the blanks, re-derive the tiers

  DATABASE_URL=… AI_GATEWAY_API_KEY=… \\
    pnpm --filter @jamie-nisbet/services leads-enrich -- [options]

Options
  --dry-run       Read and report; write nothing
  --limit <n>     How many leads to read (default 25)
  --all           No limit, and no staleness skip — read every one in scope
  --days <n>      How old an enrichment must be to be read again
                  (default ${ENRICH_STALE_DAYS})
  --client <who>  One lead — an id, a name, a fragment, an email or a phone.
                  Read whenever it was last looked at
  --delay <ms>    Pause between leads (default 1000)
  --retier        Re-derive every tier from the facts on file and stop.
                  Reads no pages, calls no model
  --help

What it writes
  Only columns that are empty. A proposal that differs from what is already
  stored is reported under "Left alone" and never written — take those on the
  lead's own page, where both values sit side by side.

  A lead with no tier gets the one its facts derive. A lead that has one keeps
  it; use --retier to move them all at once.
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["limit", "days", "client", "delay"],
    boolean: ["dry-run", "all", "retier"],
  })
  if (args.flags.has("help")) return line(HELP.trim())

  const dryRun = args.flags.has("dry-run")
  requireDatabase()
  if (dryRun) dryRunBanner()

  if (args.flags.has("retier")) return retier(dryRun)

  // The Gateway is checked before a single row is read, for the same reason
  // `requireDatabase` is: a run that fetches twenty-five pages and then
  // discovers it has nothing to read them with has spent twenty-five requests
  // on somebody else's servers for nothing.
  if (!isGatewayConfigured()) {
    fail(
      "AI_GATEWAY_API_KEY is not set. This script reads pages through the\n" +
        "Vercel AI Gateway:\n" +
        "  DATABASE_URL=… AI_GATEWAY_API_KEY=… pnpm --filter @jamie-nisbet/services leads-enrich -- --dry-run"
    )
  }
  line(`model: ${ENRICH_MODEL}`)

  const who = args.values.get("client")?.trim()
  const leads = who
    ? [await resolveClient(who)]
    : await listEnrichable({
        all: args.flags.has("all"),
        staleDays: integer(args, "days", ENRICH_STALE_DAYS, 0),
        limit: args.flags.has("all") ? undefined : integer(args, "limit", 25),
      })

  if (leads.length === 0) {
    return done(
      "Nothing to read. Every lead with a website has been looked at recently — " +
        "`--days 0` or `--all` reads them anyway."
    )
  }

  const delay = integer(args, "delay", 1000, 0)
  heading(
    `Reading ${plural(leads.length, "site")}${delay > 0 ? `, ${delay}ms apart` : ""}`
  )

  const filled: { lead: Client; changes: EnrichmentChange[]; tier: string | null }[] = []
  const conflicts: Conflict[] = []
  const unread: { lead: Client; reason: string }[] = []
  let read = 0

  for (const [at, lead] of leads.entries()) {
    // Between leads, not before the first and not after the last. The pause is
    // for the Gateway's sake rather than for the websites', which are eighty
    // different hosts being asked for one page each.
    if (at > 0 && delay > 0) await sleep(delay)

    const outcome = await enrichOne(lead)
    if (!outcome.ok) {
      unread.push({ lead, reason: outcome.reason })
      warn(`${label(lead)} — ${outcome.reason}`)
      continue
    }
    read++

    const { changes } = outcome
    const blanks = changes.filter((change) => !change.conflict)
    const clashes = changes.filter((change) => change.conflict)
    for (const change of clashes) {
      conflicts.push({
        lead,
        label: change.label,
        current: change.current,
        proposed: change.proposed,
      })
    }

    // The tier is written only into a blank, like everything else. A row that
    // already carries a letter keeps it — the facts having moved is reported
    // below, and `--retier` is the gesture that acts on it.
    const { patch, tier } = enrichmentPatch({
      lead,
      changes: blanks,
      accepted: new Set(blanks.map((change) => change.field)),
      retier: lead.fitTier === null,
    })
    // The facts having moved past a letter somebody already set is a conflict
    // like any other, reported the same way — and `--retier` is what acts on
    // a page of them at once.
    if (lead.fitTier !== null && tier.tier !== lead.fitTier) {
      conflicts.push({
        lead,
        label: "Fit tier",
        current: lead.fitTier,
        proposed: tier.tier ?? "untiered",
      })
    }

    if (!dryRun) await saveEnrichment(lead.id, patch)
    filled.push({ lead, changes: blanks, tier: patch.fitTier ?? null })

    bullet(
      `${label(lead)} — ${blanks.length === 0 ? "nothing new" : `${plural(blanks.length, "blank")} filled`}` +
        `${clashes.length > 0 ? `, ${plural(clashes.length, "conflict")}` : ""}` +
        `${patch.fitTier ? `, tier ${patch.fitTier}` : ""}`
    )
  }

  report({ filled, conflicts, unread, read, dryRun })
}

// ---- One lead ---------------------------------------------------------------

/** A proposal the batch refused to take, and what it would have replaced. The
 *  tier's own drift rides in here too — it is the same kind of news. */
type Conflict = {
  lead: Client
  label: string
  current: string | null
  proposed: string
}

type EnrichOutcome =
  | { ok: true; changes: EnrichmentChange[] }
  | { ok: false; reason: string }

/**
 * Fetch, ask, read the answer. Never throws: one dead site must not end a run
 * of eighty, so every failure comes back as a reason the report can print.
 *
 * Note what does *not* happen when the fetch fails: nothing is graded. A site
 * that times out might be down for an hour, and writing `website_grade: none`
 * from a failed request would be the script inventing a finding — the one
 * thing this whole feature is built not to do.
 */
async function enrichOne(lead: Client): Promise<EnrichOutcome> {
  if (!lead.websiteUrl?.trim()) return { ok: false, reason: "no website on file" }

  const fetched = await fetchWebsitePage(lead.websiteUrl)
  if (!fetched.ok) return { ok: false, reason: fetched.reason.toLowerCase() }

  const { system, prompt } = buildEnrichmentPrompt({ lead, page: fetched.page })

  try {
    const { text, finishReason } = await generateText({
      // A bare "provider/model" string is a Vercel AI Gateway model — see
      // src/ai.ts, which is the one place either id is written down.
      model: ENRICH_MODEL,
      system,
      prompt,
      maxOutputTokens: ENRICH_MAX_OUTPUT_TOKENS,
      maxRetries: 1,
    })
    const proposal = parseEnrichment(text)
    if (!proposal) {
      // Two different failures wore the same sentence until this run. A
      // reasoning model that exhausts its budget mid-thought returns an empty
      // string with `finishReason: "length"` — nothing was refused and nothing
      // was malformed, the ceiling was simply too low — and reporting that as
      // "didn't return facts" sends the reader to the prompt when the fix is
      // ENRICH_MAX_OUTPUT_TOKENS. Say which one it was.
      return {
        ok: false,
        reason:
          finishReason === "length"
            ? "the model ran out of output tokens before it answered"
            : "the model didn't return facts",
      }
    }
    return { ok: true, changes: enrichmentChanges(lead, proposal) }
  } catch (error) {
    return { ok: false, reason: `the gateway failed — ${(error as Error).message}` }
  }
}

// ---- The re-tier ------------------------------------------------------------

/**
 * Every tier, re-derived from the facts already on file.
 *
 * The whole reason `fit_tier` is a derived column: when the weights change, or
 * when a batch of facts lands, the pool is re-graded by running this rather
 * than by writing a migration. It reads no pages, calls no model and costs one
 * query plus one update per row that actually moves.
 *
 * It **does** overwrite a hand-set tier, and that is the point of it being its
 * own flag: you are asking for the letters to be what the facts say. The
 * ordinary run never touches a tier that already exists.
 */
async function retier(dryRun: boolean): Promise<void> {
  const leads = await listTierable()
  heading(`Re-deriving ${plural(leads.length, "tier")} from the facts on file`)

  const moved: string[][] = []
  for (const lead of leads) {
    const verdict = deriveFitTier(lead)
    if (verdict.tier === lead.fitTier) continue
    if (!dryRun) await setFitTier(lead.id, verdict.tier)
    moved.push([
      shortId(lead.id),
      lead.name,
      lead.fitTier ?? "—",
      verdict.tier ?? "—",
      `${verdict.score}/8`,
      verdict.signals.map((signal) => signal.reason).join(", "),
    ])
  }

  if (moved.length === 0) {
    return done("Every tier already matches its facts. Nothing moved.")
  }
  table(moved, {
    head: ["id", "name", "was", "now", "score", "why"],
    max: 44,
  })
  done(
    dryRun
      ? `${plural(moved.length, "tier")} would move. Run again without --dry-run.`
      : `${plural(moved.length, "tier")} moved.`
  )
}

// ---- The report -------------------------------------------------------------

function report(args: {
  filled: { lead: Client; changes: EnrichmentChange[]; tier: string | null }[]
  conflicts: Conflict[]
  unread: { lead: Client; reason: string }[]
  read: number
  dryRun: boolean
}): void {
  const written = args.filled.filter((row) => row.changes.length > 0)

  heading(`Filled — ${plural(written.length, "lead")}`)
  if (written.length === 0) {
    line("  Nothing was empty that the sites could fill.")
  } else {
    table(
      written.flatMap((row) =>
        row.changes.map((change, at) => [
          at === 0 ? shortId(row.lead.id) : "",
          at === 0 ? row.lead.name : "",
          change.label,
          change.proposed,
        ])
      ),
      { head: ["id", "name", "field", "value"], max: 44 }
    )
  }

  heading(`Left alone — ${plural(args.conflicts.length, "conflict")}`)
  if (args.conflicts.length === 0) {
    line("  Nothing the sites said contradicted what is on file.")
  } else {
    table(
      args.conflicts.map(({ lead, label: field, current, proposed }) => [
        shortId(lead.id),
        lead.name,
        field,
        current ?? "—",
        proposed,
      ]),
      { head: ["id", "name", "field", "on file", "the site says"], max: 34 }
    )
    line("")
    line("  Nothing above was written. Open the lead and use Read their website")
    line("  to take any of them — both values sit side by side there.")
  }

  if (args.unread.length > 0) {
    heading(`Couldn't read — ${plural(args.unread.length, "site")}`)
    table(
      args.unread.map(({ lead, reason }) => [
        shortId(lead.id),
        lead.name,
        lead.websiteUrl ?? "—",
        reason,
      ]),
      { head: ["id", "name", "site", "why"], max: 40 }
    )
    line("")
    line("  None of these was graded. A site that doesn't answer is not a")
    line("  finding — grade those by hand.")
  }

  const facts = args.filled.reduce((total, row) => total + row.changes.length, 0)
  const tiers = args.filled.filter((row) => row.tier !== null).length
  done(
    args.dryRun
      ? `${plural(args.read, "site")} read. ${plural(facts, "blank")} and ` +
          `${plural(tiers, "tier")} would be written. Run again without --dry-run.`
      : `${plural(args.read, "site")} read. ${plural(facts, "blank")} and ` +
          `${plural(tiers, "tier")} written.`
  )
}

// ---- Bits -------------------------------------------------------------------

function label(lead: Client): string {
  return `${shortId(lead.id)}  ${lead.name}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
