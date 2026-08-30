import { instagramUrl, whatsappUrl } from "@/lib/format"

// The draft's vocabulary and its three doors, mirrored for the browser.
//
// `draftKinds`, `draftChannels` and their labels live in
// @jamie-nisbet/services (src/outreach.ts), which is the authority: the server
// action re-validates everything this file names and refuses anything it does
// not recognise. They are copied here for the same reason `lib/touches.ts` and
// `lib/suppression.ts` copy theirs — the draft panel is a client component, and
// importing the services barrel would pull the Drizzle client and the Neon
// driver into the browser bundle to read four labels.
//
// Keep in step with packages/services/src/outreach.ts.
//
// The rest of the file is the handoff itself, and it is deliberately small:
// three functions that turn a draft into a URL somebody else's app opens. None
// of them sends anything. `mailto:` opens a compose window, `wa.me?text=` opens
// a conversation with the message typed in, and Instagram has no prefill at all
// so the clipboard is the honest answer there.

export const DRAFT_KINDS = [
  { value: "first_touch", label: "First" },
  { value: "bump", label: "Bump" },
  { value: "follow_up", label: "Follow-up" },
  { value: "breakup", label: "Last one" },
] as const

export type DraftKindValue = (typeof DRAFT_KINDS)[number]["value"]

/** What each rung is, said once under the picker — the labels are short enough
 *  to sit side by side and too short to explain themselves. */
export const DRAFT_KIND_HINTS: Record<DraftKindValue, string> = {
  first_touch: "They have never heard from you.",
  bump: "Same hook, another door — a few days after the first.",
  follow_up: "Continues the history below. Something new, and shorter.",
  breakup: "The last message before they are parked. No urgency.",
}

/** The three channels a message is actually written for. Phone and walk-in are
 *  touches, not drafts — you do not rehearse a conversation in a text box. */
export const DRAFT_CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
] as const

export type DraftChannelValue = (typeof DRAFT_CHANNELS)[number]["value"]

export function isDraftChannelValue(value: string): value is DraftChannelValue {
  return DRAFT_CHANNELS.some((c) => c.value === value)
}

export function draftChannelLabel(value: string): string {
  return DRAFT_CHANNELS.find((c) => c.value === value)?.label ?? value
}

/**
 * An email draft's subject and body, pulled apart.
 *
 * The model is asked for one string with `Subject: …` on the first line,
 * because one string is what a touch stores: `touches.draft_md` holds the draft
 * exactly as it was handed over, subject line included, and a history row that
 * had dropped the subject would be missing the half of the message a reply
 * quotes.
 *
 * Tolerant on the way out. A draft with no subject line is a body, not an
 * error — WhatsApp and Instagram drafts never have one, and an email draft that
 * came back without one still deserves a `mailto:`.
 */
export function splitDraft(draft: string): {
  subject: string | null
  body: string
} {
  const text = draft.trim()
  const breakAt = text.indexOf("\n")
  // No second line at all means there is no body under it — whatever this is,
  // it is the message.
  if (breakAt === -1) return { subject: null, body: text }

  const match = /^subject:[ \t]*(.*)$/i.exec(text.slice(0, breakAt).trim())
  if (!match) return { subject: null, body: text }

  const subject = match[1].trim()
  const body = text.slice(breakAt + 1).trim()
  // A "Subject:" line with nothing after it is not a subject, and a draft that
  // was *only* a subject line is a body — either way, keep the text.
  if (subject === "" || body === "") return { subject: null, body: text }
  return { subject, body }
}

/** A compose window in whatever writes mail on this device, prefilled and
 *  unsent. The address is encoded like the rest of it: an address with a `+` in
 *  it is a real address, and an unencoded one loses the plus. */
export function draftMailtoHref(args: {
  email: string
  subject: string | null
  body: string
}): string {
  const query = [
    args.subject ? `subject=${encodeURIComponent(args.subject)}` : null,
    `body=${encodeURIComponent(args.body)}`,
  ]
    .filter(Boolean)
    .join("&")
  return `mailto:${encodeURIComponent(args.email)}?${query}`
}

/** The WhatsApp conversation, with the draft already in the box. */
export function draftWhatsappHref(number: string, body: string): string {
  return whatsappUrl(number, body)
}

/** Instagram has no click-to-chat prefill, so the handoff is the profile plus
 *  the clipboard — the draft goes with you rather than into the URL. */
export function draftInstagramHref(handle: string): string {
  return instagramUrl(handle)
}
