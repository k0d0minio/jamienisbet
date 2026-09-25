// The four tabs of a lead's profile, named once. The tab strip is a client
// component and the page that reads `?tab=` off the URL is a server one —
// anything exported from a "use client" module arrives on the server as a
// reference rather than a function, so the vocabulary lives here where both
// sides can use it.

export const LEAD_TABS = [
  /** The touch timeline and the reply paste — what has happened. */
  { key: "activity", label: "Activity" },
  /** The draft panel — what to say next. */
  { key: "draft", label: "Draft" },
  /** The questionnaires sent and answered. */
  { key: "forms", label: "Forms" },
  /** Free notes. */
  { key: "notes", label: "Notes" },
] as const

export type LeadTabKey = (typeof LEAD_TABS)[number]["key"]

/** Activity is the default, so it is the one the URL never has to say. */
export const DEFAULT_LEAD_TAB: LeadTabKey = "activity"

/** The tab a `?tab=` value opens. Anything unknown — including the retired
 *  `person` and `work` segments, which old links still carry — is Activity. */
export function leadTabFrom(value: string | undefined): LeadTabKey {
  return LEAD_TABS.find((tab) => tab.key === value)?.key ?? DEFAULT_LEAD_TAB
}
