// The two halves of a lead's profile, named once. The segment control is a
// client component and the page that reads `?tab=` off the URL is a server
// one — anything exported from a "use client" module arrives on the server as
// a reference rather than a function, so the vocabulary lives here where both
// sides can actually use it.

export const LEAD_SEGMENTS = [
  /** The record: status, contact, the deal, how they came in, the red rows. */
  { key: "person", label: "Person" },
  /** The surface you operate: notes, forms. */
  { key: "work", label: "Work" },
] as const

export type LeadSegmentKey = (typeof LEAD_SEGMENTS)[number]["key"]

/** Person is the default, so it is the one the URL never has to say. */
export const DEFAULT_LEAD_SEGMENT: LeadSegmentKey = "person"

export function isLeadSegmentKey(
  value: string | undefined
): value is LeadSegmentKey {
  return LEAD_SEGMENTS.some((segment) => segment.key === value)
}
