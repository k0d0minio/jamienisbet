# Spec: The lead profile in two columns

- slug: lead-profile-columns
- personas: operator
- touches: websites/admin-dashboard/app/(app)/leads/[id]/page.tsx, websites/admin-dashboard/app/(app)/leads/[id]/loading.tsx, websites/admin-dashboard/app/(app)/leads/[id]/error.tsx, websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/components/lead-action-row.tsx, websites/admin-dashboard/components/lead-next-action.tsx, websites/admin-dashboard/components/lead-status-row.tsx, websites/admin-dashboard/components/lead-links.tsx, websites/admin-dashboard/components/lead-contact-card.tsx, websites/admin-dashboard/components/lead-facts-card.tsx, websites/admin-dashboard/components/lead-deal-card.tsx, websites/admin-dashboard/components/lead-deal-folder.tsx, websites/admin-dashboard/components/lead-intake.tsx, websites/admin-dashboard/components/lead-suppress.tsx, websites/admin-dashboard/components/lead-touches.tsx, websites/admin-dashboard/components/lead-reply.tsx, websites/admin-dashboard/components/lead-draft.tsx, websites/admin-dashboard/components/lead-notes-card.tsx, websites/admin-dashboard/components/lead-segments.tsx, websites/admin-dashboard/components/touch-row.tsx, websites/admin-dashboard/components/client-actions.tsx, websites/admin-dashboard/components/form-links.tsx, websites/admin-dashboard/components/next-step-pane.tsx, websites/admin-dashboard/components/mark-touched-button.tsx, websites/admin-dashboard/components/work-started-button.tsx, websites/admin-dashboard/components/app-screen.tsx, websites/admin-dashboard/lib/lead-segments.ts, websites/admin-dashboard/README.md
- complexity: standard

## Problem

The lead profile (`/leads/<id>`) is still on the retiring app tier: a Contacts-style masthead,
five tinted discs, and the record split across **Person** and **Work** segments. At the desk most
of the width is empty, the activity is a tab and a scroll away from the facts it is about, and the
archive / delete controls sit at the foot of the Person segment rather than behind anything. The
`admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time finding work,
more time launching it) makes the profile two columns at the desk — next step and facts on the
left, activity on the right (D-20) — on the flat, dense desk tier (D-1, D-3, D-4), with lead
follow-ups one of the phone's three jobs (D-21). This stub is 10 of 11; the desk tier
(`desk-tier`), the shell (`shell-rail-palette`) and the removal of todos (`drop-todos-compliance`,
D-16) are merged.

## Proposed change

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC — the "Lead profile"
artboard; sample data) is the visual reference. Its Todos block is not built: todos left the
product (D-16). Its "Status → In discussion" timeline row is not built either (see Out of scope).

**1. The profile moves to the desk tier.** `/leads/<id>` renders on the desk tier's tokens and
primitives (`packages/ui` desk components, Hanken Grotesk UI text, IBM Plex Mono for figures,
dates and metadata, hairlines, no glass, blur or spring motion — D-3, D-4). It stops using
`AppProfileScreen`, `GroupedList` / `GroupedSection` / `GroupedRow`, `ActionCircle` and the
`LeadSegments` switcher. Components it keeps (the sheets, the draft panel, the reply paste, the
touch log) are restyled only as far as they render on this page; their behaviour does not change.

**2. The head** — full width, above both columns, in this order:

- A back link to Leads and, when a list order is known (§5), the position `3 of 12` and a
  `j / k` hint in mono.
- The monogram, the name, and one line: company · status · deal stage · tier. **Status** is the
  existing status control (`LeadStatusRow`'s behaviour, including the nurture wake date and every
  side effect a status change has today), rendered as a compact menu on the status word.
  **Deal stage** is the deal folder's stage (`03 quote`) in mono, shown only when a folder is
  read; the D24 mismatch badge `LeadDealFolder` shows today moves beside it. **Tier** is the fit
  tier letter in mono, shown only when set. An **Archived** marker shows when the lead is
  archived.
- The deal figure (`dealFigure`) in mono at the trailing edge, captioned as today; the remaining
  `DealBadges` (minus the figure's kind) sit under it.
- The repo and Stripe lights (`LeadLinks`) keep their behaviour, in the head.
- "Last worked" (`today` / `12 days ago`) moves into the head's metadata line.
- **The action bar**, in this order: Call, WhatsApp, Email, a divider, **Log a touch**
  (primary), **Touched today**, **Write a draft**, **Start work** (shows "Started <date>" when set,
  as the disc does today), then, at the trailing edge, a **menu** holding **Archive** (Restore when
  archived), **Opt out…** and **Delete**. Call / WhatsApp / Email keep today's rules: disabled with
  the same titles when there is no number/address or the channel opted out; WhatsApp follows
  `whatsapp ?? phone`. **Log a touch** opens the existing touch-log sheet (with its next-step pane
  after saving). **Write a draft** switches the right column to the Draft tab (on the phone:
  opens the Draft tab and scrolls it into view). **Opt out…** opens the existing opt-out sheet
  (`LeadSuppress`) with every channel it lists today. **Delete** keeps its confirmation and its
  redirect to `/leads`.

**3. At the desk (from `lg`, 1024px), two columns** under the head, each scrolling on its own:

- **Left (fixed width, ~420px): the record.**
  1. **Next step** first: the action and its due date in mono, the whole block tinted red with
     "N days late" when the due date has passed; for a `nurture` lead it reads the wake date
     instead; when a next step is expected on this rung and none is set, it says so and offers to
     set one. Its edit sheet is today's (`LeadNextAction`). On rungs where nothing is expected it
     is not rendered.
  2. **Contact**, **Facts**, **Deal**, **Deal folder** — each a dense key–value list under a mono
     eyebrow with an **Edit** affordance opening today's sheet for that card. Every field, derived
     hint and control each card shows today stays: contact values with their opt-out markers;
     facts with the derived-tier hint and **Enrich** (and its configured/unconfigured state and
     "enriched on" date); the deal's composable components, billing type, support line and the
     agreement "use these" suggestion; the deal folder's engagement, stage, agreement and repo,
     rendered only when a folder is read, as today.
  3. **How they came in** (`LeadIntake`), folded by default, last.
- **Right (the rest of the width): four tabs** — **Activity**, **Draft**, **Forms** (with its
  count when non-zero), **Notes**.
  - **Activity**: the touch timeline, newest first, each row date (mono) · direction glyph
    (→ out, ← in) · channel and outcome · the note, with a draft's markdown and model shown as
    today (`TouchRow`); capped at 25 with the "showing the last 25" note as today. The reply paste
    (`LeadReply`) stays at the head of this tab. Its last row is a derived **came in** row — the
    lead's `created_at` date and its source (e.g. "Came in · portfolio contact form"), read from
    columns the row already has; nothing new is stored.
  - **Draft**: the existing draft panel (`LeadDraft`), unchanged in behaviour, opened on the same
    default kind and channel the cadence suggests today.
  - **Forms**: the existing questionnaire card (`FormLinks`) — send, share, delete, snapshot.
  - **Notes**: the existing notes editor (`LeadNotesCard`).
  - The open tab is kept in the URL as `?tab=activity|draft|forms|notes` (via `replaceState`, as
    the segments do today) so a refresh returns to it; no `tab` opens Activity. The retired values
    `?tab=person` and `?tab=work` open Activity.

**4. Below `lg` it stacks**, one column, in this order: the head (the action bar wraps; Call,
WhatsApp, Email, Log a touch and Touched today first; the destructive menu stays at the bar's
trailing end, never in the bottom thumb zone), **Next step**, the left column's sections, then the
four tabs. Rows are 44px under a thumb (D-3). No Person / Work segments anywhere.

**5. j / k between leads, in the list's current order.** The leads list (`/leads`, whatever
filter, view, crack or sort it is showing) records the ids of the rows it rendered, in order, in
the browser's session storage when it renders — one small client component mounted once on the
list page, so the parallel `leads-table-board` rebuild keeps it by mounting the same component.
On the profile, when the current id is in that stored order: `j` opens the next lead, `k` the
previous (client navigation to `/leads/<id>`, keeping `?tab=`), and the head shows `N of M`. At
the first or last lead the key does nothing. When the id is not in the stored order (opened from
a link, the palette, the Inbox or Work) or storage is unavailable, j / k do nothing and the
position and hint are hidden. The keys (and `L` = Log a touch, `T` = Touched today, shown on
those buttons at the desk as in the mockup) never fire while focus is in a text field or a sheet
or menu is open, or with a modifier held, so ⌘K and typing in the palette are unaffected.

**6. Stale copy.** The Forms card's answered-form line "Set a deal folder in the Deal card to
snapshot these answers into it." is wrong since the folder is named after the repo (D28): it
reads **"Connect a repo to snapshot these answers into its deal folder."**, and the code comment
beside it is corrected to match.

**7. Loading and error states** (`loading.tsx`, `error.tsx`) take the new layout's shape (head,
two columns at the desk) on the desk tier.

**8. The admin README's Lead row and profile description** say what the profile is now: two
columns at the desk, the tabs, j / k.

## Acceptance criteria

- [ ] At the desk (≥1024px) `/leads/<id>` shows the head across the top, the record (next step, Contact, Facts, Deal, Deal folder, how they came in) on the left and the Activity / Draft / Forms / Notes tabs on the right, each column scrolling independently, with no Person / Work segments.
- [ ] Every edit and action that exists on the profile today still works from the new layout: status change (incl. nurture wake date), next-step edit, contact / facts / deal edit sheets, agreement "use these", Enrich, repo and Stripe links, mark touched, work started, call / WhatsApp / email with opt-out disabling, touch log with its next-step pane, reply paste, draft panel, form send / share / delete / snapshot, notes, opt-out sheet, archive / restore, delete with redirect.
- [ ] The next step is the first thing under the head on both layouts, shows its due (or wake) date in mono, and turns red with "N days late" once the due date has passed.
- [ ] Archive, Opt out and Delete are reachable only through the action bar's menu; none of them is a button in the page body or the bottom half of the phone screen.
- [ ] Log a touch opens the touch-log sheet; Write a draft switches to (or, on the phone, scrolls to) the Draft tab.
- [ ] The open tab is kept in `?tab=` across a refresh; `?tab=person`, `?tab=work` and no `tab` open Activity.
- [ ] The Activity tab lists the touches newest first, capped at 25 with the cap note, and ends with a "came in" row built from `created_at` and the source; no schema change.
- [ ] Opened from the leads list, `j` / `k` open the next / previous lead in the order that list was showing (including a filter, the prospects or archived view, or a crack), the head shows `N of M`, and at either end the key does nothing.
- [ ] Opened from anywhere else (a pasted URL, the palette, the Inbox, Work), j / k do nothing and no position is shown.
- [ ] j / k / L / T do nothing while typing in a field, while a sheet or menu is open, or with a modifier held; ⌘K still opens the palette.
- [ ] Below 1024px the page is one column: head, next step, the record sections, then the tabs; touch targets are at least 44px.
- [ ] The answered-form line in the Forms card reads "Connect a repo to snapshot these answers into its deal folder."
- [ ] The profile no longer imports the app tier's profile pieces (`AppProfileScreen`, `GroupedList` / `GroupedSection` / `GroupedRow`, `ActionCircle`, `LeadSegments`); loading and error states match the new layout.

## Out of scope

- Status changes in the timeline: nothing records them today, and adding an event log is a schema change — a later stub if wanted (decided in Define, 2026-09-25).
- Carrying the list's view in the URL so j / k survive a reload or a shared link (decided in Define: session storage only).
- Todos (removed in `drop-todos-compliance`, D-16).
- Any change to drafting, reply triage, enrichment, opt-out or form behaviour — only where they sit and how they are styled.
- The leads list's table and board (`leads-table-board`); this run only mounts the order recorder on the list page.
- Deleting the app tier's components from `packages/ui` (`retire-app-tier`).
- New keyboard shortcuts beyond j, k, L and T.

## Open questions

- none — the desk breakpoint for the two columns (`lg`, 1024px, while the shell's rail starts at
  `md`) is a Define choice: an iPad in portrait gets the rail and the stacked profile, since two
  columns do not fit 712px of content width.
