# Decisions: leads-table-board

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- D-1 — The admin becomes a desk tool first, compressed for the phone.
- D-2 — Desk and iPhone are both real work surfaces.
- D-3 — The look is flat, dense and monochrome. Glass, blur and spring motion leave the admin. State is a small dot. Rows are 32px at the desk and 44px under a thumb.
- D-4 — UI text is Hanken Grotesk. IBM Plex Mono stays for figures, slugs, dates and metadata.
- D-5 — At the desk, a 56px icon rail with count badges replaces the 240px sidebar. A command palette (⌘K) reaches any repo, ticket, lead or action. The phone keeps a bottom tab bar, flat, with no floating glass.
- D-6 — Work (the tickets) is home, at `/`.
- D-7 — Work at the desk is three panes: views and repos, the ticket list, the reader (mockup option A).
- D-8 — The reader shows the stub and its prompt together, with no tab to switch. Its metadata, the epic's build order and the breakdown's "what I understood" sit in a side column.
- D-9 — Tickets stay read-only. The AI changes ticket state, creates tickets and plans. The dashboard surfaces them and launches work.
- D-10 — Launch is the primary act: one click, ⌘↵ at the desk. The recommended model and effort show beside it and go into the launch where the tool allows. Copy prompt is secondary.
- D-11 — A ticket shows as running only when GitHub says so: its run folder or its pull request exists. Nothing is stored when you press Launch.
- D-12 — Work answers three questions: what do I launch next (Up next, across every repo), where is client X at (repo and epic), and what does this ticket say (the reader).
- D-13 — The Inbox stays its own screen. It is rebuilt as a fast queue in two groups: Gates and PRs, then Follow-ups. It is keyboard-driven, with a detail pane at the desk.
- D-14 — Gates and PRs means: pull requests waiting on the Spec approved or Ready to merge tick, green lane PRs waiting for a merge, red CI and stuck runs, and scopes on `main` waiting for review.
- D-15 — Follow-ups means: outreach due, open leads untouched for 7+ days, and nurture wakes.
- D-16 — Todos and compliance dates are dropped completely, their tables included.
- D-17 — Money leaves the navigation and the Inbox. Its route and the Stripe code stay in place, dormant.
- D-18 — The "worth a look" counts (nothing planned next, gone quiet) leave the feed and stay as Leads filters.
- D-19 — Leads at the desk is a sortable table. A second view is a board with one column per deal stage, 01 to 08, plus a "no folder" column. The board can only be read.
- D-20 — The lead profile becomes two columns at the desk: next step and facts on the left, activity on the right.
- D-21 — The phone's jobs are: read and launch tickets, clear gates and check PRs, and lead follow-ups.
- D-22 — The marketing tier is untouched.

## Made in this run

- D-30 — At the desk a live row shows status as read-only text and carries only WhatsApp, Email and Mark touched; status change, archive and delete stay on the profile; the archived view's row actions are Restore and Delete. `client-status-select.tsx` is deleted. Jamie, in Define, 2026-09-25 (mockup as drawn).
- D-31 — The Board is offered in every view (Leads, prospects, archived, both cracks), showing the same rows as the table. Jamie, in Define, 2026-09-25.
- D-32 — The Leads table takes `j` / `k` / `Enter` / `t` (highlight, open, mark touched). Jamie, in Define, 2026-09-25.
- D-33 — The sort is kept in the URL (`sort`, `dir`) and applied on the server; the layout is `layout=board` (the existing `view` param stays the population). Jamie, in Define, 2026-09-25 (param names: Define).
- D-34 — The two crack filters get a visible entry on the Leads view's filter bar, after a divider, with counts, so they stay reachable once `inbox-rebuild` removes them from the feed (D-18). Define, 2026-09-25.
- D-35 — A lead whose stage cannot be read (no repo, no folder, no engagement, no `NN-` artefact, or GitHub unreadable) sits in the board's "No folder" column; an unreadable tree adds a one-line note. Define, 2026-09-25.
- D-36 — The desk Prospects button shows the cold pool's size only where the page's read holds it (the roster view); in the archive and a crack view it shows the word alone. Build, 2026-09-25 — a spec gap.
- D-37 — A not-won lead reads muted on the phone row as well as in the table (the phone used to mute only past clients and parked prospects). Build, 2026-09-25 — a spec gap (the spec's muting rule was stated for the table).
