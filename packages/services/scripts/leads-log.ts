import {
  clientStatusLabel,
  isTouchChannel,
  isTouchDirection,
  isTouchOutcome,
  listTouchesForClient,
  logTouch,
  parkClient,
  setClientNextAction,
  suggestNextTouch,
  suppressClient,
  touchChannelLabel,
  touchChannels,
  touchDirections,
  touchOutcomeLabel,
  touchOutcomes,
  type CadenceSuggestion,
  type CadenceTouch,
  type Client,
  type TouchDirection,
} from "@jamie-nisbet/services"

import { date, parseArgs, required, UsageError } from "./lib/args"
import { requireDatabase } from "./lib/db"
import { bullet, day, done, dryRunBanner, fail, heading, line, table } from "./lib/out"
import { resolveClient, shortId } from "./lib/resolve"

// leads-log — a touch and what happens next, in one command.
//
// The two halves are one gesture and that is why they are one script: a call
// that was made and no decision about what follows it is exactly the row
// leads-crack will find next Monday. So logging a touch computes the next
// cadence step and accepts it by default, and dismissing it (--no-next) or
// overriding it (--next / --due) is a deliberate flag rather than the path of
// least effort.
//
// Nothing here decides anything the services layer doesn't already know how
// to: `logTouch` writes the row and stamps the relationship, `suggestNextTouch`
// reads the history and answers, `parkClient` and `setClientNextAction` apply
// the answer, and `suppressClient` is the whole opt-out gesture. The script is
// argument parsing and a report.

const HELP = `
leads-log — record a touch and set what happens next

  pnpm --filter @jamie-nisbet/services leads-log -- --client <who> \\
    --channel <channel> --outcome <outcome> [options]

Who
  --client <who>       A lead id, the first characters of one, a name, an
                       email or a phone number. An ambiguous match lists the
                       candidates and stops.

The touch
  --channel <c>        ${touchChannels.join(" | ")}
  --outcome <o>        ${touchOutcomes.join(" | ")}
  --direction <d>      ${touchDirections.join(" | ")} (default out)
  --note <text>        What was actually said
  --at <date>          When it happened, if not now: YYYY-MM-DD, "today",
                       "tomorrow" or "+N"

What happens next
  (default)            Accept what the cadence suggests — the next rung, a
                       reply owed, or a park onto nurture
  --next <text>        Set this instead
  --due <date>         When it is owed (default: the suggested date)
  --no-next            Leave nothing planned. leads-crack will say so

They asked to be left alone
  --suppress           Close every channel on the record permanently, move the
                       lead to not won, clear what was planned, and log the
                       reason. Not the same as an outcome of not_interested,
                       which is a no to this pitch rather than to being
                       contacted at all.
  --reason <text>      Kept with the opt-out, in your words

  --dry-run            Say what would happen; write nothing
  --help
`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    value: ["client", "channel", "outcome", "direction", "note", "at", "next", "due", "reason"],
    boolean: ["no-next", "suppress", "dry-run"],
  })
  if (args.flags.has("help")) return line(HELP.trim())

  const dryRun = args.flags.has("dry-run")
  if (dryRun) dryRunBanner()
  requireDatabase()

  const lead = await resolveClient(required(args, "client"))
  heading(`${lead.name}${lead.town ? ` · ${lead.town}` : ""}   [${shortId(lead.id)}]`)
  line(
    `  ${clientStatusLabel(lead.status)}${lead.fitTier ? ` · tier ${lead.fitTier}` : ""}` +
      ` · last worked ${day(lead.lastTouchedAt ?? lead.createdAt)}`
  )
  line(`  now: ${lead.nextAction ?? "nothing planned"}${lead.nextActionDue ? ` (due ${day(lead.nextActionDue)})` : ""}`)

  if (args.flags.has("suppress")) return suppress(lead, args.values.get("reason") ?? null, dryRun)

  // ---- The touch -------------------------------------------------------------
  const now = new Date()
  const channel = vocabulary("channel", required(args, "channel"), touchChannels, isTouchChannel)
  const outcome = vocabulary("outcome", required(args, "outcome"), touchOutcomes, isTouchOutcome)
  const direction = args.values.has("direction")
    ? vocabulary("direction", required(args, "direction"), touchDirections, isTouchDirection)
    : ("out" satisfies TouchDirection)
  const loggedAt = date(args, "at", now) ?? now
  const note = args.values.get("note")?.trim() || null

  const pending: CadenceTouch = { channel, direction, outcome, loggedAt }

  // The suggestion is computed from the history *with this touch in it*, which
  // is why it can be shown truthfully before anything is written: a dry run
  // and a real run reach the same answer by the same route.
  const history = await listTouchesForClient(lead.id, 50)
  const suggestion = suggestNextTouch(lead, [...history, pending], now)

  heading(`${dryRun ? "Would log" : "Logging"} a touch`)
  table(
    [
      ["channel", touchChannelLabel(channel)],
      ["direction", direction === "in" ? "they reached me" : "I reached them"],
      ["outcome", touchOutcomeLabel(outcome)],
      ["when", day(loggedAt)],
      ["note", note ?? "—"],
    ],
    { max: 70 }
  )

  // ---- What happens next -----------------------------------------------------
  const plan = decide(args, suggestion, now)
  heading(dryRun ? "Would then plan" : "Then planning")
  describe(plan, suggestion)

  if (dryRun) {
    return done("Dry run. Nothing was written.")
  }

  await logTouch({ clientId: lead.id, channel, direction, outcome, note, loggedAt })

  if (plan.kind === "park") {
    await parkClient(lead.id, plan.wakeAt)
  } else if (plan.kind === "clear") {
    await setClientNextAction(lead.id, null)
  } else {
    await setClientNextAction(lead.id, { action: plan.action, dueAt: plan.dueAt })
  }

  done(
    plan.kind === "park"
      ? `Logged. ${lead.name} is parked on nurture, waking ${day(plan.wakeAt)}.`
      : plan.kind === "clear"
        ? `Logged. Nothing is planned for ${lead.name} — leads-crack will say so.`
        : `Logged. Next: ${plan.action} (due ${day(plan.dueAt)}).`
  )
}

/** What this run will do about the next action, once the flags have had their
 *  say over the suggestion. */
type Plan =
  | { kind: "set"; action: string; dueAt: Date; from: "flag" | "cadence" }
  | { kind: "park"; wakeAt: Date }
  | { kind: "clear"; why: string }

function decide(
  args: ReturnType<typeof parseArgs>,
  suggestion: CadenceSuggestion | null,
  now: Date
): Plan {
  if (args.flags.has("no-next")) return { kind: "clear", why: "--no-next" }

  const typed = args.values.get("next")?.trim()
  if (typed) {
    // A date the operator gave, else the one the cadence would have used, else
    // tomorrow — never null. An action with no date never reaches the queue,
    // which makes it a decision that was made and then lost.
    const dueAt = date(args, "due", now) ?? suggestion?.dueAt ?? addDays(now, 1)
    return { kind: "set", action: typed.slice(0, 200), dueAt, from: "flag" }
  }

  if (!suggestion) {
    return { kind: "clear", why: "they said no — there is nothing to suggest after that" }
  }
  if (suggestion.park) {
    return { kind: "park", wakeAt: suggestion.park.wakeAt }
  }

  const dueAt = date(args, "due", now) ?? suggestion.dueAt
  return { kind: "set", action: suggestion.action.slice(0, 200), dueAt, from: "cadence" }
}

function describe(plan: Plan, suggestion: CadenceSuggestion | null): void {
  if (plan.kind === "clear") {
    line(`  Nothing planned (${plan.why}).`)
    bullet("leads-crack lists leads with no next action.")
    return
  }
  if (plan.kind === "park") {
    line(`  Park on nurture, waking ${day(plan.wakeAt)}.`)
    bullet("The cadence is spent. Nothing is deleted; they come back on that date.")
    return
  }

  const step =
    suggestion && suggestion.step !== null
      ? ` (cadence step ${suggestion.step} of ${suggestion.steps})`
      : suggestion?.kind === "reply"
        ? " (a reply is owed — the cadence has stopped)"
        : ""
  line(`  ${plan.action} — due ${day(plan.dueAt)}${plan.from === "flag" ? " (yours)" : step}`)
  if (suggestion?.channel && plan.from === "cadence") {
    bullet(`suggested door: ${touchChannelLabel(suggestion.channel)}`)
  }
}

/** The whole opt-out gesture, which is one call in the services layer on
 *  purpose — a script that closed the channels and forgot to clear the next
 *  action would leave somebody who asked to be left alone in tomorrow's queue. */
async function suppress(lead: Client, reason: string | null, dryRun: boolean): Promise<void> {
  heading(dryRun ? "Would suppress" : "Suppressing")
  line("  Every channel on this record, permanently. Nothing in this package undoes it.")
  if (reason) line(`  reason: ${reason}`)
  bullet("The lead moves to not won, whatever was planned is cleared, and the reason is logged as an inbound touch.")

  if (dryRun) return done("Dry run. Nothing was written.")

  const result = await suppressClient(lead.id, reason)
  if (!result) return done(`${lead.name} is no longer in the table — nothing was written.`)

  table(result.points.map((point) => [point.kind, point.value, "closed"]), { max: 60 })
  done(`${result.client.name} opted out. ${result.points.length} contact point(s) closed for good.`)
}

/** A closed set, checked against what was typed, with the whole vocabulary in
 *  the error — a script that says "invalid outcome" and stops is a script you
 *  run twice. */
function vocabulary<T extends string>(
  name: string,
  value: string,
  allowed: readonly T[],
  guard: (candidate: string) => candidate is T
): T {
  const candidate = value.trim().toLowerCase()
  if (guard(candidate)) return candidate
  throw new UsageError(`--${name} must be one of: ${allowed.join(", ")} (got "${value}")`)
}

function addDays(from: Date, days: number): Date {
  const at = new Date(from.getTime())
  at.setDate(at.getDate() + days)
  return at
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) fail(`${error.message}\n\n${HELP.trim()}`)
  fail((error as Error).message ?? String(error))
})
