import {
  bestChannel,
  clientStatusLabel,
  contactPointsOf,
  findSuppressions,
  listDueOutreach,
  type Client,
} from "@jamie-nisbet/services"

import { integer, parseArgs, UsageError } from "./lib/args"
import { requireDatabase } from "./lib/db"
import {
  bullet,
  day,
  done,
  fail,
  heading,
  line,
  plural,
  relativeDay,
  table,
} from "./lib/out"
import { shortId } from "./lib/resolve"

// leads-queue — what is owed today, from a terminal.
//
// The same read the Needs you feed opens on (`listDueOutreach`), printed with
// the things you need in your hand to actually do the touch: the number, the
// address, the handle, and the hook that says why they would care. Nothing
// here is a second implementation of the queue — the ordering, the cap and the
// definition of "due" all live in `queries/crack-finder.ts`, which is the
// whole reason the scripts sit on the services layer rather than beside it.
//
// Read-only. `--dry-run` is accepted and changes nothing, so the flag means
// the same thing on all five scripts.

const HELP = `
leads-queue — today's outreach, tier-sorted, with the details to do it

  pnpm --filter @jamie-nisbet/services leads-queue -- [options]

Options
  --limit <n>     How many to show (default 10 — the estate's daily cap)
  --all           No cap. The list nobody works, for when you want the total
  --detail        Print each lead as a block: every channel, the hook, the note
  --dry-run       Accepted and ignored; this script only reads
  --help

Ordering
  Overdue first, then fit tier (untiered last), then longest overdue —
  listDueOutreach in packages/services/src/queries/crack-finder.ts.
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["limit"],
    boolean: ["all", "detail", "dry-run"],
  })
  if (args.flags.has("help")) return line(HELP.trim())

  requireDatabase()
  const now = new Date()
  const limit = args.flags.has("all") ? undefined : integer(args, "limit", 10)
  const due = await listDueOutreach({ now, limit })

  if (due.length === 0) {
    return done("Nothing is due. Either it is all done or nothing is planned — leads-crack knows which.")
  }

  const closed = await closedChannels(due)

  heading(`Due today — ${plural(due.length, "lead")}${limit && due.length === limit ? " (capped)" : ""}`)

  if (args.flags.has("detail")) {
    for (const lead of due) detail(lead, closed, now)
  } else {
    table(
      due.map((lead) => [
        shortId(lead.id),
        lead.fitTier ?? "—",
        lead.name,
        lead.town ?? "—",
        relativeDay(lead.nextActionDue, now),
        lead.nextAction ?? "—",
        channelLine(lead, closed),
      ]),
      {
        head: ["id", "tier", "name", "town", "due", "next action", "reach on"],
        max: 30,
      }
    )
    bullet("--detail for the numbers, the addresses and each hook.")
  }

  done(`Log one with: leads-log -- --client <id> --channel <channel> --outcome <outcome>`)
}

/** Every closed contact point across the whole queue, in one round trip. A
 *  query per lead per channel would be forty round trips to draw one screen. */
async function closedChannels(leads: readonly Client[]): Promise<Set<string>> {
  const points = leads.flatMap((lead) => contactPointsOf(lead))
  const rows = await findSuppressions(points)
  return new Set(rows.map((row) => `${row.kind}:${row.value}`))
}

function isClosed(closed: Set<string>, kind: string, value: string | null): boolean {
  return value !== null && closed.has(`${kind}:${value}`)
}

/** The doors that are actually open, as a short string for the table — with a
 *  count of the ones that are closed, so an opted-out channel reads as
 *  *deliberately gone* rather than as a detail nobody filled in. A walk-in
 *  joins the list because a town is a door too, and it is the one nobody can
 *  opt out of. */
function channelLine(lead: Client, closed: Set<string>): string {
  const points = contactPointsOf(lead)
  const open = points.filter((point) => !closed.has(`${point.kind}:${point.value}`))
  const shut = points.length - open.length
  const doors = new Set<string>(open.map((point) => point.kind))
  if (lead.town) doors.add("walkin")
  const list = [...doors].join("/")
  return shut > 0 ? `${list || "—"} (${shut} closed)` : list || "—"
}

/** One lead, as a block you can work from without looking anywhere else. */
function detail(lead: Client, closed: Set<string>, now: Date): void {
  line("")
  line(
    `${lead.fitTier ?? "—"}  ${lead.name}${lead.town ? ` · ${lead.town}` : ""}` +
      `${lead.sector ? ` · ${lead.sector}` : ""}   [${shortId(lead.id)}]`
  )
  line(
    `   ${clientStatusLabel(lead.status)} · due ${day(lead.nextActionDue)} (${relativeDay(lead.nextActionDue, now)})` +
      `${lead.language ? ` · open in ${lead.language}` : ""}`
  )
  line(`   next: ${lead.nextAction ?? "— nothing planned"}`)

  const rows: string[][] = []
  for (const [label, kind, value] of [
    ["phone", "phone", lead.phone],
    ["whatsapp", "phone", lead.whatsapp ?? lead.phone],
    ["email", "email", lead.email],
    ["instagram", "instagram", lead.instagram],
  ] as const) {
    if (!value) continue
    rows.push([label, value, isClosed(closed, kind, normalized(kind, value)) ? "opted out" : ""])
  }
  if (lead.websiteUrl) rows.push(["website", lead.websiteUrl, lead.websiteGrade ?? ""])
  if (rows.length > 0) table(rows, { indent: "   ", max: 60 })

  const suggested = bestChannel(lead)
  if (suggested) line(`   best door: ${suggested}`)
  if (lead.hook) line(`   hook: ${lead.hook}`)
}

/** The stored form of a contact point, so the closed-set lookup compares like
 *  with like. `contactPointsOf` already normalizes; this is the same answer for
 *  a single column being printed. */
function normalized(kind: "phone" | "email" | "instagram", value: string): string | null {
  const points = contactPointsOf({
    email: kind === "email" ? value : null,
    phone: kind === "phone" ? value : null,
    whatsapp: null,
    instagram: kind === "instagram" ? value : null,
  })
  return points[0]?.value ?? null
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
