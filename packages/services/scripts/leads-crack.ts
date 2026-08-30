import {
  clientStatusLabel,
  findCracks,
  IDLE_AFTER_DAYS,
  type Client,
} from "@jamie-nisbet/services"

import { integer, parseArgs, UsageError } from "./lib/args"
import { requireDatabase } from "./lib/db"
import { day, done, fail, heading, line, plural, relativeDay, table } from "./lib/out"
import { shortId } from "./lib/resolve"

// leads-crack — the weekly reconcile.
//
// Four questions, asked of the table, that between them say whether the
// invariant is holding: *no lead being worked without a next action and a
// date*. Nothing enforces it — a save is never refused for a missing next
// action (Jamie's decision 7) — so this is where the gap shows up instead, and
// running it once a week is the whole enforcement mechanism.
//
// It is `findCracks` and a printer. The queries live in
// `queries/crack-finder.ts` and the Needs you feed reads the same four, which
// is what keeps the terminal and the dashboard from disagreeing about what is
// wrong.
//
// Read-only. `--dry-run` is accepted and changes nothing.

const HELP = `
leads-crack — what fell through: no next action, overdue, woken, gone cold

  pnpm --filter @jamie-nisbet/services leads-crack -- [options]

Options
  --limit <n>     Rows per section (default 10)
  --all           No cap — the full reconcile
  --days <n>      How quiet a live conversation must be to count as cold
                  (default ${IDLE_AFTER_DAYS})
  --dry-run       Accepted and ignored; this script only reads
  --help

The four questions
  due        On a cadence rung and owed today or earlier
  unplanned  Being worked, with no next action or no date on it
  woken      Parked on nurture, and the wake date has passed
  idle       In discussion, and nothing has happened for --days
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["limit", "days"],
    boolean: ["all", "dry-run"],
  })
  if (args.flags.has("help")) return line(HELP.trim())

  requireDatabase()
  const now = new Date()
  const limit = args.flags.has("all") ? undefined : integer(args, "limit", 10)
  const days = integer(args, "days", IDLE_AFTER_DAYS)

  const cracks = await findCracks({ now, days, limit })

  section(
    `Owed today or earlier — ${plural(cracks.due.length, "lead")}`,
    cracks.due,
    (lead) => [relativeDay(lead.nextActionDue, now), lead.nextAction ?? "—"],
    ["due", "next action"],
    "Nothing is overdue."
  )

  section(
    `Nothing planned — ${plural(cracks.unplanned.length, "lead")}`,
    cracks.unplanned,
    (lead) => [
      day(lead.lastTouchedAt ?? lead.createdAt),
      lead.nextAction ? "has an action, no date" : "no next action",
    ],
    ["last worked", "gap"],
    "Every lead being worked has a next action and a date."
  )

  section(
    `Woken from nurture — ${plural(cracks.woken.length, "lead")}`,
    cracks.woken,
    (lead) => [day(lead.wakeAt), relativeDay(lead.wakeAt, now)],
    ["wake date", ""],
    "Nobody has woken up."
  )

  section(
    `Gone quiet in discussion — ${plural(cracks.idle.length, "lead")}`,
    cracks.idle,
    (lead) => [day(lead.lastTouchedAt ?? lead.createdAt), relativeDay(lead.lastTouchedAt ?? lead.createdAt, now)],
    ["last worked", ""],
    `No live conversation has been quiet for ${days} days.`
  )

  const total =
    cracks.due.length + cracks.unplanned.length + cracks.woken.length + cracks.idle.length
  done(
    total === 0
      ? "Nothing is cracked. That is the whole report."
      : `${plural(total, "row")} across four questions. Set a next action with:\n` +
          `  leads-log -- --client <id> --channel <channel> --outcome <outcome>`
  )
}

/** One question, its rows, and what to say when there are none. The "none"
 *  line matters as much as the rows: a section that vanishes when it is clean
 *  makes a clean week look like a broken script. */
function section(
  title: string,
  rows: readonly Client[],
  extra: (lead: Client) => string[],
  columns: readonly string[],
  empty: string
): void {
  heading(title)
  if (rows.length === 0) {
    line(`  ${empty}`)
    return
  }
  table(
    rows.map((lead) => [
      shortId(lead.id),
      lead.fitTier ?? "—",
      lead.name,
      lead.town ?? "—",
      clientStatusLabel(lead.status),
      ...extra(lead),
    ]),
    { head: ["id", "tier", "name", "town", "status", ...columns], max: 34 }
  )
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
