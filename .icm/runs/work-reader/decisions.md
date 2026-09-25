# Decisions: work-reader

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

- <D-n (the next free id) — the decision, why, which stage made it. A decision Build had to
  make is a spec gap: say so in `notes.md` → Notes for Release>

## Build — 2026-09-25

- **Work keeps its own REST pull-request read; it does not reuse `gates-read`'s.** `gates-read`
  merged to `main` during this Build with a GraphQL PR read of its own (`lib/gates.ts`), the
  reverse of the spec's note that it would reuse this run's. Work's read stays REST and separate:
  the lane-stub match needs each lane PR's file list, which the gates query does not carry, and
  Work's board must not wait on the Inbox's bounded read. Cost: one REST call per repo per minute
  on Work, beside the Inbox's GraphQL budget. Unifying the two is left as a triage stub.
