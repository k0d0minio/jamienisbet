// One row of the Inbox queue, as the server hands it to the browser — every
// word and link already decided, so nothing in the client reads the clock or
// the services barrel. Client-safe on purpose: lib/inbox.ts, which builds
// these, is server-only.

/** The three kinds of follow-up (D-15), in the order the group lists them. */
export type InboxKind = "outreach" | "waiting" | "wake"

/** A door to knock on — a plain link into somebody else's app. Nothing on the
 *  Inbox sends anything (D-33); a thumb still presses send. */
export type ReachLink = {
  channel: "whatsapp" | "email" | "phone"
  /** The verb on the button: "WhatsApp", "Email", "Call". */
  label: string
  href: string
  /** Leaves the app in a new tab rather than replacing the Inbox. */
  external: boolean
}

export type InboxFact = { label: string; value: string }

export type InboxRow = {
  /** Kind and lead together: a woken lead comes back as an outreach row on
   *  the next read, and the two must never be mistaken for one another. */
  key: string
  kind: InboxKind
  id: string
  name: string
  /** Who or where — the status and segment line. */
  who: string | null
  /** The figure the row is scanned on: "today", "3d late", "9d". */
  age: string
  /** The same, spoken in full. */
  ageSpoken: string
  /** Past due, or waited past the threshold — set in the destructive colour. */
  late: boolean
  /** The pane's one line of prose: the step, the silence, the parking. */
  text: string
  facts: InboxFact[]
  /** Every door they can be reached on, the cadence's best one first. */
  reach: ReachLink[]
  /** The channel a logged touch starts on. */
  logChannel: string
  /** A step was decided — false only for a dated outreach row with no step,
   *  which has nothing for Tomorrow to move (D-35). */
  hasStep: boolean
}

/** How many of each kind are waiting beyond what the queue shows. */
export type InboxMore = Record<InboxKind, number>
