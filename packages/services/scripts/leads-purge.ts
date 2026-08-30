import {
  anonymiseClient,
  clientStatusLabel,
  listPurgeable,
  REDACTED_NAME,
  RETENTION_MONTHS,
  type Client,
} from "@jamie-nisbet/services"

import { integer, parseArgs, UsageError } from "./lib/args"
import { requireDatabase } from "./lib/db"
import { bullet, day, done, dryRunBanner, fail, heading, line, plural, table } from "./lib/out"
import { shortId } from "./lib/resolve"

// leads-purge — the retention rule, run by hand.
//
// §5 of `.icm/docs/lia-cold-outreach.md`: a row on `prospect` or `not_won`
// that nobody has touched for twelve months is anonymised — the business is
// forgotten, the shape of it is kept. Prospect data earns its keep by being
// worked, and a cold row that sat for a year was a guess that did not pay off.
//
// Two safety belts, because this is the one script here whose work cannot be
// undone:
//
//   · `--dry-run` reports and writes nothing, like the other four.
//   · without `--dry-run` it *still* writes nothing unless `--yes` is given.
//     Every other script's worst case is a row you can edit; this one's is a
//     phone number that no longer exists anywhere.
//
// It does not delete rows and it does not touch suppressions. An opt-out
// outlives the record it was asked through — that is the whole reason the
// suppression table has no key back to `clients` — so purging a lead never
// un-stops anything.

const HELP = `
leads-purge — anonymise cold rows that have aged out (retention, LIA §5)

  pnpm --filter @jamie-nisbet/services leads-purge -- [--dry-run | --yes]

Options
  --months <n>   How old is too old (default ${RETENTION_MONTHS})
  --dry-run      Report and stop
  --yes          Actually write. Required — without it this reports and stops
  --help

What it clears
  name, company, email, phone, whatsapp, instagram, hook

What it keeps
  sector, town, tier, status and the dates — the fact that a business of that
  shape was once approached, which is what stops the same list being compiled
  and worked again next spring. Any opt-out stays standing (LIA §4).

Who it looks at
  Rows on prospect or not_won, archived ones included, whose last activity is
  older than --months. Nurture is excluded: a parked row is waiting on a wake
  date, which is being worked on the slowest possible schedule rather than not
  at all. Anything from "in discussion" up leaves the assessment entirely.
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["months"],
    boolean: ["dry-run", "yes"],
  })
  if (args.flags.has("help")) return line(HELP.trim())

  const dryRun = args.flags.has("dry-run")
  const confirmed = args.flags.has("yes")
  if (dryRun) dryRunBanner()
  requireDatabase()

  const now = new Date()
  const months = integer(args, "months", RETENTION_MONTHS)
  const cutoff = new Date(now.getTime())
  cutoff.setMonth(cutoff.getMonth() - months)
  line(`rule: prospect or not_won, no activity since ${day(cutoff)} (${months} months)`)

  const due = await listPurgeable({ now, months })
  if (due.length === 0) {
    return done("Nothing has aged out. Every cold row is younger than the rule.")
  }

  heading(`${dryRun || !confirmed ? "Would anonymise" : "Anonymising"} ${plural(due.length, "row")}`)
  table(
    due.map((row) => [
      shortId(row.id),
      row.name,
      row.town ?? "—",
      row.sector ?? "—",
      clientStatusLabel(row.status),
      day(row.lastTouchedAt ?? row.createdAt),
      contactSummary(row),
    ]),
    {
      head: ["id", "name", "town", "sector", "status", "last activity", "clearing"],
      max: 30,
    }
  )

  const withProse = due.filter((row) => row.notes || row.intakeMessage || row.websiteUrl)
  if (withProse.length > 0) {
    line("")
    bullet(
      `${plural(withProse.length, "row")} also carry notes, an intake message or a website URL. ` +
        "§5 names the contact fields only, so those are left as they are — read them if any could name a person."
    )
  }

  if (dryRun) return done("Dry run. Nothing was written.")
  if (!confirmed) {
    return done(
      `Nothing was written. This is permanent and there is no undo — ` +
        `re-run with --yes to anonymise ${plural(due.length, "row")}.`
    )
  }

  let written = 0
  for (const row of due) {
    const after = await anonymiseClient(row.id)
    if (after?.name === REDACTED_NAME) written++
    else line(`  ! ${shortId(row.id)} (${row.name}) was not updated — it may have just been deleted`)
  }

  done(
    `Anonymised ${plural(written, "row")}. Suppressions are untouched: an opt-out outlives the record it was asked through.`
  )
}

/** Which of the cleared columns this row actually has something in — so the
 *  report says what is being destroyed rather than what might be. */
function contactSummary(row: Client): string {
  const held: string[] = []
  if (row.email) held.push("email")
  if (row.phone) held.push("phone")
  if (row.whatsapp) held.push("whatsapp")
  if (row.instagram) held.push("instagram")
  if (row.hook) held.push("hook")
  return held.length > 0 ? `name + ${held.join(", ")}` : "name only"
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
