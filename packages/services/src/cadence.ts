import {
  engagedOutcomes,
  type Touch,
  type TouchChannel,
  type TouchOutcome,
} from "./queries/touches"
import type { Client } from "./queries/clients"

// The cadence — what to do next, and when.
//
// A suggestion engine, not a scheduler. Nothing here writes, nothing here runs
// on a timer, and nothing it returns is binding: completing a touch computes
// the next step and the surface prefills it, and dismissing it is allowed
// (Jamie's decision 7 — enforcement is gentle, and the crack-finder is what
// notices a gap later). The whole module is pure, which is also what makes it
// the one place the shape of the outreach is written down.
//
// It lives beside `deal.ts` rather than in `queries/` for the same reason that
// one does: it answers a question about a record, it does not read or write
// the database. It leans on the touch vocabulary in `queries/touches.ts`
// because that is where the table's closed sets live, the same way the status
// ladder lives with the clients table.
//
// The shape comes from the research in `.icm/intake/lead-engine/breakdown.md`:
// ~5 touches over ~3 weeks, across channels rather than five emails, and
// silence at the end of it parks the lead instead of killing it.

/** One rung of the template. */
export type CadenceStep = {
  /** 1-based, and what a surface says out loud ("step 3 of 5"). */
  step: number
  /**
   * Days after the first touch this step is owed. Gaps rather than absolute
   * dates: the due date is computed from *now* plus the distance to the next
   * step, so a cadence worked three days late simply runs three days late
   * instead of arriving with two steps already overdue.
   */
  day: number
  /** Which channel to reach for — see `channelFor`. */
  prefer: "best" | "second" | "walkin"
  /** What the next action says. Short and imperative: it becomes the lead's
   *  `next_action`, which is a line on a row, not a note. */
  action: string
  /** Some steps only make sense for some leads. */
  onlyWhen?: "nearbyA"
}

/**
 * ~5 touches over ~3 weeks. Read the `day` column down the page and the whole
 * cadence is there: nothing for the first three days, a second door on day 3,
 * a follow-up in the first week, a visit in the second, and one last message
 * before they are parked.
 *
 * Step 4 is the local one and the reason a walk-in is a first-class channel at
 * all: turning up is the highest-conversion touch available in a town this
 * size, and the worst possible use of an afternoon for a C-tier lead an hour
 * away. "Nearby" is as much as this model can honestly know — a town on file,
 * and an A tier that says the trip is worth it — so the step is skipped
 * silently for everyone else and the breakup still lands on day 19.
 */
export const CADENCE_STEPS: readonly CadenceStep[] = [
  { step: 1, day: 0, prefer: "best", action: "First touch" },
  {
    step: 2,
    day: 3,
    prefer: "second",
    action: "Second channel — same hook, another door",
  },
  { step: 3, day: 7, prefer: "best", action: "Follow up" },
  {
    step: 4,
    day: 12,
    prefer: "walkin",
    action: "Walk in",
    onlyWhen: "nearbyA",
  },
  {
    step: 5,
    day: 19,
    prefer: "best",
    action: "Last message before parking them",
  },
]

/** How long a spent cadence sleeps. Ninety days is the breakdown's number: far
 *  enough that arriving again isn't the same conversation, near enough that a
 *  business whose website was dying in March is still worth asking in June. */
export const NURTURE_WAKE_DAYS = 90

/** How long a reply, a callback or a meeting has before it is owed something
 *  back. A day, because the whole value of a lead answering is that you are
 *  the one who answers quickly. */
const REPLY_DAYS: Record<string, number> = {
  callback: 1,
  replied: 1,
  met: 1,
  answered: 2,
}

/** What to do when a lead has actually said something. Not a cadence step —
 *  the cadence has stopped, and this is a conversation. */
const REPLY_ACTIONS: Record<string, string> = {
  callback: "Call them back",
  replied: "Reply",
  answered: "Follow up on what was said",
  met: "Send what you promised",
}

/**
 * What a suggestion needs to know about the lead. Structural, like
 * `DealTerms`: a whole `Client` row, a list projection and a script's own
 * object can all be asked the same question.
 */
export type CadenceLead = Pick<
  Client,
  "phone" | "whatsapp" | "email" | "instagram" | "fitTier" | "town"
>

/** What it needs to know about a touch — the four columns that decide what
 *  happens next. */
export type CadenceTouch = Pick<
  Touch,
  "channel" | "direction" | "outcome" | "loggedAt"
>

export type CadenceSuggestion = {
  /**
   * Which of the three things this is:
   *   touch — the next rung of the cadence
   *   reply — they said something; the cadence has stopped and this is owed
   *   park  — the cadence is spent; nurture them and come back
   */
  kind: "touch" | "reply" | "park"
  /** Which rung, and how many there are — "3 of 5". Null on a reply, which is
   *  not part of the template. */
  step: number | null
  steps: number
  /** The channel to reach for, or null when the step doesn't name one (a park)
   *  or the lead can't be reached on anything. */
  channel: TouchChannel | null
  /** Ready to prefill `next_action` — short, imperative, ≤200 characters. */
  action: string
  /** Ready to prefill `next_action_due`. */
  dueAt: Date
  /** Set only on a park: where to move them, and when they wake. */
  park: { status: "nurture"; wakeAt: Date } | null
}

/**
 * What happens next with this lead.
 *
 * Returns null in exactly one case: they said they are not interested. There
 * is nothing to suggest after a no, and inventing one is how a cadence becomes
 * a nuisance. Every other history — including no history at all — has a next
 * step.
 *
 * `history` may arrive in any order (the profile reads it newest-first, a
 * script might not); it is sorted here rather than trusted.
 */
export function suggestNextTouch(
  lead: CadenceLead,
  history: readonly CadenceTouch[],
  now: Date = new Date()
): CadenceSuggestion | null {
  const steps = CADENCE_STEPS.length
  const ordered = [...history].sort(
    (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime()
  )
  const latest = ordered[ordered.length - 1]

  // Nobody has reached out yet: the first touch, today, on whichever door is
  // open. This is also what a freshly imported prospect gets.
  if (!latest) {
    const first = CADENCE_STEPS[0]
    return {
      kind: "touch",
      step: first.step,
      steps,
      channel: channelFor(first, lead, null),
      action: first.action,
      dueAt: addDays(now, 0),
      park: null,
    }
  }

  if (latest.outcome === ("not_interested" satisfies TouchOutcome)) return null

  // They said something. The cadence stops pushing and the conversation takes
  // over — on the channel they used, because answering somewhere else is a
  // small rudeness.
  if (isEngaged(latest.outcome) || latest.outcome === "callback") {
    return {
      kind: "reply",
      step: null,
      steps,
      channel: latest.channel as TouchChannel,
      action: REPLY_ACTIONS[latest.outcome] ?? "Follow up",
      dueAt: addDays(now, REPLY_DAYS[latest.outcome] ?? 1),
      park: null,
    }
  }

  // Still cold. Which rung comes next is how many times we have reached out —
  // an inbound touch is not a step of our own cadence.
  const done = ordered.filter((t) => t.direction === "out").length
  const previousDay =
    done === 0 ? 0 : CADENCE_STEPS[Math.min(done, steps) - 1].day

  for (let index = done; index < steps; index++) {
    const step = CADENCE_STEPS[index]
    if (!appliesTo(step, lead)) continue
    return {
      kind: "touch",
      step: step.step,
      steps,
      channel: channelFor(step, lead, latest.channel),
      action: step.action,
      // At least a day, always: two touches on the same afternoon is not a
      // cadence, and a step whose gap collapsed (a skipped rung, a late run)
      // should still land tomorrow rather than now.
      dueAt: addDays(now, Math.max(1, step.day - previousDay)),
      park: null,
    }
  }

  // The cadence is spent and they never answered. Park them: this is the
  // decision that keeps an 85-strong pool from becoming 85 dead rows — nothing
  // is deleted, nothing is marked lost, they simply come back in three months.
  const wakeAt = addDays(now, NURTURE_WAKE_DAYS)
  return {
    kind: "park",
    step: null,
    steps,
    channel: null,
    action: "Park on nurture — the cadence is spent",
    dueAt: wakeAt,
    park: { status: "nurture", wakeAt },
  }
}

/**
 * The channels this lead can actually be reached on, in the order worth
 * trying them. WhatsApp leads because it does here: almost every business in
 * the pool answers one, and most of their numbers are the same line as the
 * phone — which is why a phone number alone is enough to open a chat. A walk-in
 * needs nothing but a town.
 */
export function reachableChannels(lead: CadenceLead): TouchChannel[] {
  const channels: TouchChannel[] = []
  if (lead.whatsapp || lead.phone) channels.push("whatsapp")
  if (lead.email) channels.push("email")
  if (lead.instagram) channels.push("instagram")
  if (lead.phone) channels.push("phone")
  if (lead.town) channels.push("walkin")
  return channels
}

/** The best door that isn't `exclude`, or null when there is no door at all —
 *  a prospect with no number, no address and no handle, which the import
 *  should never produce but a hand-typed row can. */
export function bestChannel(
  lead: CadenceLead,
  exclude?: string | null
): TouchChannel | null {
  const channels = reachableChannels(lead)
  return channels.find((c) => c !== exclude) ?? channels[0] ?? null
}

function channelFor(
  step: CadenceStep,
  lead: CadenceLead,
  lastUsed: string | null
): TouchChannel | null {
  if (step.prefer === "walkin") return "walkin"
  // "Another door" only means anything when there is one; a lead reachable
  // solely by email gets the same channel twice rather than nothing.
  if (step.prefer === "second") return bestChannel(lead, lastUsed)
  return bestChannel(lead)
}

function appliesTo(step: CadenceStep, lead: CadenceLead): boolean {
  if (step.onlyWhen !== "nearbyA") return true
  return lead.fitTier === "A" && Boolean(lead.town)
}

function isEngaged(outcome: string): boolean {
  return (engagedOutcomes as readonly string[]).includes(outcome)
}

/** Whole days on, keeping the time of day — a step due "in three days" should
 *  land at the hour you are actually working, not at midnight. */
function addDays(from: Date, days: number): Date {
  const at = new Date(from.getTime())
  at.setDate(at.getDate() + days)
  return at
}
