# Decisions: desk-tier

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

- D-23 — No preview surface for the primitives; the first visual check is `shell-rail-palette`'s preview. (Define, operator's answer 2026-09-25.)
- D-24 — `packages/ui/src/lib/utils.ts` gains the desk names in tailwind-merge's config (text sizes, text colours, the float shadow, and the spacing / radius / tracking theme values). Without it `cn("text-desk-ui text-desk-fg")` drops the size, as the app tier once did. The file was not in `touches:` — a spec gap, additive only. (Build.)
- D-25 — Selection semantics follow ARIA validity rather than the spec's shorthand: `ListRow` speaks `aria-selected` only under a role that carries it (option, row, tab…) and `aria-current="true"` otherwise; a sortable column puts `aria-sort` on the column header (`<th>`), which contains the sort button. (Build.)
- D-26 — `DeskButton`'s `shortcut` renders the keys as quiet mono text inside the button, as the canvas draws "Launch ⌘↵" (a `Kbd` cap inside an ink button would read wrong); it is aria-hidden and the caller declares `aria-keyshortcuts` in its own spelling. (Build.)
- D-27 — The palette has no scrim (a transparent overlay still closes on an outside click): the tier is flat, and a dim colour for both themes has no semantic token to alias. (Build.)
- D-28 — `--desk-shadow-float` aliases the brand's `--shadow-xl`, which already carries its dark value — so `tokens/desk.css` holds no raw colour at all. (Build.)
- D-29 — `PaneBody` added beside `Pane` / `PaneHeader` / `PaneToolbar` (the scrolling region), and `DataGridBody` beside the grid's parts; both are one-liners the screens would otherwise repeat. (Build.)
