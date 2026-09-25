# Scope: admin-cockpit-redesign

- story: 01_scope/\_source/story.md — the source as received, never edited
- author/source: Jamie Nisbet, in a Claude Code cloud session (five rounds of questions, two rounds of mockups)
- personas: operator
- agreed: 2026-09-25
- complexity: high
- recommended-model: opus
- stubs: 11 (.icm/intake/admin-cockpit-redesign/)
- canonical: this file, until Define writes spec.md

---

## The story

<!-- Source: Jamie Nisbet (the author), 2026-09-25, via chat (a Claude Code cloud session).
     Recorded as received. Never edited — what was settled on top of it lives in scope.md. -->

# Story

## 2026-09-25

I want a complete redesign of the dashboard. The sidebar takes up too much room on desktop, the ticket navigation and manipulation both on desktop and iphone is very poor. The needs you inbox I rarely consult it due to its lack of ease of use. The leads page is okay but lacking a bit of good quality design. I want you to do some research and analysis and come up with a new design system for the dashboard app. Your job is to brainstorm this with me, provide me with artefact mockups to review and give feedback on, your ultimate job is to cut an intake batch that will do the required work. Interrogate me thoroughly in order to understand what I'm looking for

---

## Assumptions

- The mockups on the design canvas (claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC, "Cockpit redesign — round 1", option A and the round-2 reader) are the visual reference for every stub. They use sample data.
- The brand does not change: paper and ink, one tint, warm greys, hairlines, sentence case, no emoji. Only the admin's own tier changes. [D-3]
- The marketing sites (portfolio, sellers site) are untouched. Nothing in the new tier loads there. [D-22]
- "Today" on Work means the estate's today list in icm-board, as the board reads it now.
- An iPad in landscape and any laptop get the desk layout; a phone gets the compressed one. The exact breakpoint is Define's call.
- Keyboard navigation already on the Tickets board (j/k, enter, `?`) carries over to Work and extends to the Inbox.
- Today's tickets leave the Inbox, because Work is home and already shows them.

## Decisions

| ID  | Decision | Why / context | Changes |
| --- | -------- | ------------- | ------- |
| D-1 | The admin becomes a desk tool first, compressed for the phone. | The iOS-first design stretched to a laptop wastes width and hides the work. | Replaces the admin-native-redesign rule "one design that grows" (2026-08-29). |
| D-2 | Desk and iPhone are both real work surfaces. | Jamie uses both for real work. | no change |
| D-3 | The look is flat, dense and monochrome. Glass, blur and spring motion leave the admin. State is a small dot. Rows are 32px at the desk and 44px under a thumb. | Faster to scan; matches a work tool. | Retires the app tier's materials, elevation and springs in the admin. |
| D-4 | UI text is Hanken Grotesk. IBM Plex Mono stays for figures, slugs, dates and metadata. | Ties the cockpit back to the brand. | Replaces the system font stack in the admin. |
| D-5 | At the desk, a 56px icon rail with count badges replaces the 240px sidebar. A command palette (⌘K) reaches any repo, ticket, lead or action. The phone keeps a bottom tab bar, flat, with no floating glass. | "The sidebar takes up too much room on desktop." | Replaces the sidebar and the floating tab bar. |
| D-6 | Work (the tickets) is home, at `/`. | Engineering is the daily driver. | Replaces Needs you as home. |
| D-7 | Work at the desk is three panes: views and repos, the ticket list, the reader (mockup option A). | Chosen over the two-pane tree after trying both. | Replaces the drill-level list of tickets-master-detail. |
| D-8 | The reader shows the stub and its prompt together, with no tab to switch. Its metadata, the epic's build order and the breakdown's "what I understood" sit in a side column. | Everything needed before launching, at a glance. | Replaces the collapsed Prompt disclosure. |
| D-9 | Tickets stay read-only. The AI changes ticket state, creates tickets and plans. The dashboard surfaces them and launches work. | "The ai is what changes states, create tickets and plans/reorders." | no change |
| D-10 | Launch is the primary act: one click, ⌘↵ at the desk. The recommended model and effort show beside it and go into the launch where the tool allows. Copy prompt is secondary. | "Launch work faster." | Replaces copy-first. |
| D-11 | A ticket shows as running only when GitHub says so: its run folder or its pull request exists. Nothing is stored when you press Launch. | No new state to keep in sync. | no change |
| D-12 | Work answers three questions: what do I launch next (Up next, across every repo), where is client X at (repo and epic), and what does this ticket say (the reader). | Jamie's three jobs on the board. | no change |
| D-13 | The Inbox stays its own screen. It is rebuilt as a fast queue in two groups: Gates and PRs, then Follow-ups. It is keyboard-driven, with a detail pane at the desk. | "I rarely consult it due to its lack of ease of use." | Replaces the Needs you feed. |
| D-14 | Gates and PRs means: pull requests waiting on the Spec approved or Ready to merge tick, green lane PRs waiting for a merge, red CI and stuck runs, and scopes on `main` waiting for review. | This is Jamie's engineering role now: review and launch. | New GitHub read; the dashboard reads no PRs today. |
| D-15 | Follow-ups means: outreach due, open leads untouched for 7+ days, and nurture wakes. | Business attention Jamie still owes by hand. | Keeps three of the feed's current sections. |
| D-16 | Todos and compliance dates are dropped completely, their tables included. | Todos are handled in Google Tasks. | Removes the Overdue section, the add-todo sheet, lead todos, the compliance calendar and `biz.tasks` / `biz.compliance_dates`. |
| D-17 | Money leaves the navigation and the Inbox. Its route and the Stripe code stay in place, dormant. | "For the moment we can archive/drop money logic." | Rail is Work · Inbox · Leads. |
| D-18 | The "worth a look" counts (nothing planned next, gone quiet) leave the feed and stay as Leads filters. | They already exist as `?crack=` views. | no change to the filters |
| D-19 | Leads at the desk is a sortable table. A second view is a board with one column per deal stage, 01 to 08, plus a "no folder" column. The board can only be read. | "Real table on desktop"; "Pipeline / kanban view". Stages come from the icm-board deal folders. | Replaces the grown phone rows at the desk. |
| D-20 | The lead profile becomes two columns at the desk: next step and facts on the left, activity on the right. | "Profile too long." | Replaces the Person / Work tabs at the desk. |
| D-21 | The phone's jobs are: read and launch tickets, clear gates and check PRs, and lead follow-ups. | Sets what the compressed layouts must do well. | no change |
| D-22 | The marketing tier is untouched. | The change is scoped to the admin. | no change |

## Out of scope

- Money: no redesign, no removal of the Stripe code. It is only hidden. [D-17]
- Editing tickets from the dashboard: no status changes, no reordering, no creating stubs. [D-9]
- Dragging cards between deal stages. [D-19]
- Any Google Tasks integration. Todos simply leave the app. [D-16]
- Launching several tickets at once, or new launch targets beyond the ones in the registry.
- Push or email notifications for gates or follow-ups.
- The portfolio and the sellers site. [D-22]

## Open for Define

- Where the desk layout starts: an iPad in portrait could take either the desk or the phone layout. → `shell-rail-palette`
- How "a scope waiting for review" is detected on `main`: a run whose `status.md` reads `phase: scope` with its stubs still in intake is one candidate rule. → `gates-read`
- The GitHub request budget for reading pull requests across every active repo, inside the board's existing cache rules (force-cache, the 8-request cap). → `gates-read`
- How a running lane PR is matched to its triage stub when there is no run folder yet. → `work-reader`
- Whether the launch link can carry model and effort for any target. Today the Claude Code web link carries neither, so the recommendation is shown beside the button. → `work-reader`
- The dormant Money page uses the app tier. Either port it mechanically to the desk tier so the app tier can be deleted, or keep the app-tier pieces it imports. → `retire-app-tier`
- Whether the migration that drops `biz.tasks` and `biz.compliance_dates` first exports their rows somewhere (a one-off CSV), or drops them as they are. → `drop-todos-compliance`
