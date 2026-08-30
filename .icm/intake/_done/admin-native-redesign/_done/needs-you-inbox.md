# Stub: Needs you — the inbox that becomes home

- feature-slug: needs-you-inbox
- sequence: 5 of 8
- depends-on: leads-list-native
- priority: P1
- size: L

## What this is

The IA change. Home stops being a list of everyone and becomes a triaged answer to the
only morning question: **what needs me right now?** Tabs become
**Needs you · Leads · Tickets · Money**; the leads list moves to `/leads` and the feed
takes `/`.

**The feed** merges, in one prioritised list of grouped sections:

- **Waiting on you** — open leads past the staleness threshold, longest first; row swipes
  mark touched, tap opens the profile.
- **Overdue** — todos past due (tick in place) and compliance dates past or near due
  (decision-support wording kept — every date still needs the contabilista).
- **Money** — invoices needing an action: drafts awaiting finalize-and-send, open
  invoices past due. Rows deep-link into Money; no outbound action fires from the feed
  (the standing rule holds — finalizing stays a deliberate click on Money).
- **Today's tickets** — the board's now-strip picks (today.md, runs in flight, blocked
  stubs), deep-linking into Tickets.

Rules of the feed: rows either **act in place** (touched, tick a todo) or **deep-link**
— nothing edits in the feed that has a proper home elsewhere. Sections render only when
non-empty. The empty feed is the point: a designed, calm **all clear** state — the app
opening on "nothing needs you" is a good day, not a broken screen.

**Consequences elsewhere:**

- The tab bar (and sidebar) gain the fourth tab; Needs you is first and is home.
- The leads list relocates to `/leads` (row links `/leads/<id>` keep working); redirects
  or rewrites keep old bookmarks alive.
- The **working-list strip dies**: `working-list.tsx` is removed from the Leads screen;
  `task-list` and `compliance-list` live on inside the feed (adding a todo moves to the
  feed's Overdue section header or the lead profile — pick the least ceremonious spot).
- Degradation: a missing `GITHUB_TOKEN` or Stripe key drops those sections with the
  house "not configured" note style — never breaks the feed.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/needs-you-inbox.md` (this stub) in the `jamienisbet`
repo. Sequences 1–4 must be merged; the feed is composed from the app tier's grouped
lists and the row patterns the earlier screens proved.

In `websites/admin-dashboard`, build the Needs you feed as specified: new home route at
`/`, the leads list relocated to `/leads` with old URLs redirected, the fourth tab added
to tab bar and sidebar with Needs you first, the four feed sections (Waiting on you /
Overdue / Money / Today's tickets) with act-in-place vs deep-link behaviour exactly as
the stub draws the line, the designed all-clear empty state, per-section degradation for
missing configuration, and the removal of the working-list strip with todo-adding
re-housed. Reads compose from the existing data layers (`@jamie-nisbet/services`,
`lib/finance.ts`, `lib/tickets.ts`) — no new tables, no writes beyond the actions that
already exist.

Follow the amended `design-dna` skill; keep the no-outbound-action rule absolute. Work on
a `claude/` branch, push, verify the feed on the Vercel preview in full, degraded, and
all-clear states, both colour modes, phone and desk. Update the routes and screens
sections of `websites/admin-dashboard/README.md` — this stub changes the app's map. When
done, `git mv` this stub to `.icm/intake/admin-native-redesign/_done/`.
