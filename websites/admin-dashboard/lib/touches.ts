// The touch log's three vocabularies, mirrored for the browser.
//
// `touchChannels`, `touchDirections` and `touchOutcomes` — and their labels —
// live in @jamie-nisbet/services, which is the authority: the server action
// re-validates everything this file names and refuses anything it doesn't
// recognise. They are copied here for the same reason `lib/lead-facts.ts` and
// `components/client-status-select.tsx` copy theirs: the log sheet is a client
// component, and importing the services barrel would pull the Drizzle client
// and the Neon driver into the browser bundle to read a dozen labels.
//
// Keep in step with packages/services/src/queries/touches.ts.

export const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "walkin", label: "Walk-in" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other" },
] as const

export type ChannelValue = (typeof CHANNELS)[number]["value"]

export const OUTCOMES = [
  { value: "sent", label: "Sent" },
  { value: "no_answer", label: "No answer" },
  { value: "callback", label: "Call back" },
  { value: "answered", label: "Answered" },
  { value: "replied", label: "Replied" },
  { value: "met", label: "Met" },
  { value: "not_interested", label: "Not interested" },
] as const

export type OutcomeValue = (typeof OUTCOMES)[number]["value"]

/**
 * Which outcomes a channel can actually produce.
 *
 * All seven live in the model and any of them can be stored; this is only
 * about what the sheet offers under your thumb, and offering "Met" after an
 * email or "Call back" after a DM would cost a scan of seven buttons to find
 * the two that ever happen. The subsets are the honest ones: a phone call
 * rings out or it doesn't, an email goes and either comes back or doesn't, and
 * a door either opens or is shut. `other` is where anything can happen, so it
 * offers everything.
 */
const OUTCOMES_BY_CHANNEL: Record<ChannelValue, readonly OutcomeValue[]> = {
  whatsapp: ["sent", "replied", "answered", "not_interested"],
  phone: ["no_answer", "answered", "callback", "not_interested"],
  email: ["sent", "replied", "not_interested"],
  walkin: ["met", "answered", "no_answer", "not_interested"],
  instagram: ["sent", "replied", "not_interested"],
  other: OUTCOMES.map((o) => o.value),
}

export function outcomesFor(
  channel: string
): readonly { value: OutcomeValue; label: string }[] {
  const wanted =
    OUTCOMES_BY_CHANNEL[channel as ChannelValue] ?? OUTCOMES_BY_CHANNEL.other
  return OUTCOMES.filter((o) => wanted.includes(o.value))
}

/** A stored value's readable word. An unrecognised one falls through to
 *  itself, so a row written before this list changed still names itself
 *  rather than disappearing. */
function labelFor(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value
}

export function channelLabel(value: string): string {
  return labelFor(CHANNELS, value)
}

export function outcomeLabel(value: string): string {
  return labelFor(OUTCOMES, value)
}
