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

// ---------------------------------------------------------------------------
// Gates and PRs (D-14) — what waits on Jamie's review across the estate, read
// from GitHub by lib/gates.ts. Like the follow-ups, every word and link is
// decided on the server; unlike them, nothing here is cleared from the Inbox —
// the tick, the merge and the fix all happen on GitHub, and a row leaves when
// GitHub stops showing it waiting.

/** The six kinds, in the order the group lists them (spec gates-read §3). */
export type GateKind = "blocked" | "red" | "spec" | "merge" | "lane" | "scope"

/** A place to go: GitHub, a preview. Always a new tab. */
export type GateLink = { id: string; label: string; href: string }

/** One line of the pane's list: a check with its state, or a fact. */
export type GateFact = {
  label: string
  value: string
  tone: "ok" | "fail" | "muted" | "plain"
}

/** A launch the row offers — a Work-style session link. */
export type GateLaunch = {
  label: string
  /** The default target's link; null when it can't carry this launch. */
  href: string | null
  /** A new tab for a web target (`launchLinkProps`). */
  newTab: boolean
  /** "Opus · high" where the link can't carry the recommendation. */
  hint: string | null
  /** Why there is no link, when there isn't. */
  unavailable: string | null
}

export type GateRow = {
  /** Unique across the estate: repo plus PR number, scope or run. */
  key: string
  kind: GateKind
  title: string
  /** The repo's own name, mono on the row. */
  repo: string
  /** "#12", or "main" for a scope or a run with no PR. */
  ref: string
  /** "PR #12", or "main" — the pane's ref. */
  refLong: string
  /** "now", "12m", "3h", "2d", "today". */
  age: string
  ageSpoken: string
  /** Red CI and a blocked run — tag and age in the destructive colour. */
  late: boolean
  /** The pane's one line: what to do. */
  text: string
  facts: GateFact[]
  primary: GateLink
  secondary: GateLink | null
  rest: GateLink[]
  launch: GateLaunch | null
}

/** The group's read, as the browser gets it. Never an exception: an unset
 *  token and a failed read are both stated, and the rest of the Inbox stands. */
export type GatesRead =
  | { state: "unconfigured" }
  | { state: "failed"; message: string }
  | {
      state: "ok"
      rows: GateRow[]
      /** Repos that couldn't be read, or were read only in part. */
      notes: string[]
      /** When the read finished, ISO — the header's "as of". */
      readAt: string
    }
