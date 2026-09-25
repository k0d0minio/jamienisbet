# Tasks: lead-profile-columns

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

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

## Queue

- [ ] <task — small enough for one commit; name the file or area>
