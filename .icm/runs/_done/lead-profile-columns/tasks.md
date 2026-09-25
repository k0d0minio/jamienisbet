# Tasks: lead-profile-columns

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] At the desk (≥1024px) `/leads/<id>` shows the head across the top, the record (next step, Contact, Facts, Deal, Deal folder, how they came in) on the left and the Activity / Draft / Forms / Notes tabs on the right, each column scrolling independently, with no Person / Work segments.
- [x] Every edit and action that exists on the profile today still works from the new layout: status change (incl. nurture wake date), next-step edit, contact / facts / deal edit sheets, agreement "use these", Enrich, repo and Stripe links, mark touched, work started, call / WhatsApp / email with opt-out disabling, touch log with its next-step pane, reply paste, draft panel, form send / share / delete / snapshot, notes, opt-out sheet, archive / restore, delete with redirect.
- [x] The next step is the first thing under the head on both layouts, shows its due (or wake) date in mono, and turns red with "N days late" once the due date has passed.
- [x] Archive, Opt out and Delete are reachable only through the action bar's menu; none of them is a button in the page body or the bottom half of the phone screen.
- [x] Log a touch opens the touch-log sheet; Write a draft switches to (or, on the phone, scrolls to) the Draft tab.
- [x] The open tab is kept in `?tab=` across a refresh; `?tab=person`, `?tab=work` and no `tab` open Activity.
- [x] The Activity tab lists the touches newest first, capped at 25 with the cap note, and ends with a "came in" row built from `created_at` and the source; no schema change.
- [x] Opened from the leads list, `j` / `k` open the next / previous lead in the order that list was showing (including a filter, the prospects or archived view, or a crack), the head shows `N of M`, and at either end the key does nothing.
- [x] Opened from anywhere else (a pasted URL, the palette, the Inbox, Work), j / k do nothing and no position is shown.
- [x] j / k / L / T do nothing while typing in a field, while a sheet or menu is open, or with a modifier held; ⌘K still opens the palette.
- [x] Below 1024px the page is one column: head, next step, the record sections, then the tabs; touch targets are at least 44px.
- [x] The answered-form line in the Forms card reads "Connect a repo to snapshot these answers into its deal folder."
- [x] The profile no longer imports the app tier's profile pieces (`AppProfileScreen`, `GroupedList` / `GroupedSection` / `GroupedRow`, `ActionCircle`, `LeadSegments`); loading and error states match the new layout.

## Queue

- [x] Order handover — `lib/lead-order.ts`, `components/lead-order.tsx`, mounted once on `leads/page.tsx`
- [x] Desk primitives in `packages/ui` — `RecordSection`/`RecordRow`/`RecordBlock`/`RecordDisclosure`, `DeskMenu`, `DeskTabs` (D-26)
- [x] Head and action bar — `lead-action-row.tsx`, `lead-status-menu.tsx`, `lead-links.tsx`, `mark-touched-button.tsx`, `work-started-button.tsx`, `client-actions.tsx` (hook), `lead-suppress.tsx` (sheet split)
- [x] Left column — `lead-next-action.tsx` (late block), contact / facts / enrich / deal / deal folder / intake / opt-outs on `Record*`
- [x] Right column — `lead-touches.tsx` + `touch-row.tsx` (timeline, came-in row), `lead-reply.tsx`, `lead-draft.tsx`, `form-links.tsx` + its controls, `lead-notes-card.tsx`; `lib/lead-tabs.ts` replaces `lib/lead-segments.ts`
- [x] Frame and keys — `components/lead-profile.tsx`; `page.tsx` composes it; `AppProfileScreen` removed
- [x] Copy, states, docs — Forms stale line, `loading.tsx`, `error.tsx`, admin README, `BRAND.md` / `SKILL.md` primitive lists
