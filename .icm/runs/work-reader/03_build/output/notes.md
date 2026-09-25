# Build notes: work-reader

- commits: 299139c feat: work-reader — the ticket reader, one-click launch and running from PRs ·
  e0ecbb6 merge origin/main (gates-read) · 3931651 fix: doc order, park the PR-read overlap
- ci: see the full-gate verdict recorded in status.md after the ready flip

## What changed

- `websites/admin-dashboard/lib/tickets.ts`: each repo's read now also fetches its open pull
  requests (`pulls?state=open&per_page=100`, position clock, both tags, `force-cache`, the
  8-in-flight cap) and, for each open lane PR (`type:bug|tweak|chore|hotfix`), its file list
  (discovery clock). Spine PRs match an epic stub by the Spec-table `Slug` row (or a
  `claude/<slug>` head); lane PRs match the triage stub whose file lands in `triage/_done/`.
  A matched stub gets `status: "running"` and a new `pr` field; running stubs are skipped as
  their epic's Up next candidate; a dependant waits on them "— running"; epic rows show them
  running; a run-folder ticket gets its PR by slug. A run folder holding only `01_scope/` is no
  longer a running ticket. A failed PR (or lane-files) read is a per-repo `prError`, surfaced as
  `BoardData.prErrors`; the repo's tickets still show.
- `lib/launchers/index.ts`: `primaryAction(launches, pickup)` — launch, copy (with the reason),
  or none — the one decision the reader's button and ⌘↵ both read.
- `components/ticket-reader.tsx` (new): the reader — head (mono path, GitHub ↗, title, summary,
  blocked reason, action row), body (What this is / Notes for Define / Prompt · what the launch
  sends / the stub's own prompt when a verb is sent), side column (stub lines, epic build order,
  What I understood). Desk primitives only.
- `components/work-views.tsx` (new): desk-tier batch, repo and estate-overview views for pane
  three — the phone board's content on `RecordSection` / `RecordRow` / `RecordBlock`, with the
  PR-read failure lines.
- `components/work-desk.tsx`: pane three renders the reader or the desk views; the list pane says
  which repos' PRs couldn't be read; the `launch` intent (⌘↵) presses the primary act.
- `components/use-board-keys.ts`: ⌘↵ / Ctrl+↵ is the one modified key the board takes; still
  never while typing or under an overlay. `board-keys-sheet.tsx` lists it; `tickets-board.tsx`
  ignores the new intent.
- `components/work-model.ts`: a running row's note reads its PR (`draft PR #176 · Build`).
- `app/globals.css`: `.desk-tier .prose` — the ticket prose on desk tokens.
- `README.md` § Work: the reader, ⌘↵, the PR read and its budget, the scope-run rule.

## Acceptance criteria status

- [x] At the desk, selecting a ticket shows its head, its stub sections, Notes for Define and the full prompt together, with no extra click. — `ReaderHead` + `ReaderBody`, no disclosure.
- [x] The reader's head shows `repo / epic / slug` in mono, the title, and a summary line with status, priority, `n of m`, size and client; a blocked ticket shows its reason. — `crumbs`, `ReaderSummary`, `blockedReason`.
- [x] Launch in Claude Code is the primary button and opens the default target's link in a new tab; the model and effort recommendation shows beside it. — `DeskButton` primary over the registry's link, `launchLinkProps`; the hint beside it.
- [x] `⌘↵` launches the selected ticket at the desk, and does nothing while a text field, the palette or a sheet has focus; `?` lists it. — `launch` intent, TEXT_FIELD / OVERLAY guards.
- [x] Copy prompt copies exactly the text the prompt block shows, which is exactly what Launch sends. — both render `ticket.pickup`, the same string `launchesForTicket` builds the link from.
- [x] A prompt past the link's length cap offers no Launch: Copy prompt is primary, the too-long line shows, and `⌘↵` copies. — `primaryAction` → `copy` with `PROMPT_TOO_LONG`.
- [x] The side column lists the stub's dash-lines, the epic's build order with the current stub marked and each open or running row selectable, and the breakdown's "What I understood" with a link to the whole breakdown; a triage stub shows only its dash-lines.
- [x] An epic stub with an open spine PR (by Slug row or `claude/<slug>` head) reads as running everywhere on the board, shows `PR #n` linked with its stage and age, and offers no Launch.
- [x] A triage stub whose move to `triage/_done/` is in an open lane PR's file list reads as running in the same way. — the rule checked against merged lane PRs #165 and #167, whose file lists show exactly that rename.
- [x] A folder under `.icm/runs/` holding only `01_scope/` produces no running ticket.
- [x] A failed pull-request read leaves the repo's tickets on screen, says so in one line, and falls back to run-folder detection.
- [x] Batch and repo selections keep their views in pane three, drawn in the desk tier.
- [x] No reader file uses an app-tier class or token. — grep of `ticket-reader.tsx`, `work-views.tsx`, `work-desk.tsx` for `app-*` / `Grouped*` / `AppMenu` is empty.
- [x] README § Tickets describes the reader, `⌘↵`, the pull-request read and its request budget.

## Notes for Release

- New files beyond `touches:`: `components/ticket-reader.tsx` and `components/work-views.tsx`
  (the reader and the desk views live beside, not inside, the phone board's `ticket-detail.tsx`
  and `board-views.tsx`, which `work-phone` still owns).
- The other-tools menu in the action row only renders when more than one target is registered —
  today there is one, so it would only repeat Launch.
- Up next now skips a running stub, so its successor becomes the epic's candidate and reads as
  blocked, "waiting on <stub> — running" — the spec's "running everywhere" read through the
  existing dependency rule.
- Typecheck and lint of the whole package are the advisory job's; `lint.sh` on the changed files
  was OK. Nothing was type-checked locally (the hook blocks it).
- `gates-read` merged to `main` mid-Build with its own GraphQL PR read (`lib/gates.ts`). The
  spec's Out-of-scope note that gates-read "reuses this run's pull-request read" is therefore
  stale: the two reads are separate (decisions.md → Build), and unifying them is parked as
  `.icm/intake/triage/work-and-gates-one-pr-read.md`. The merge itself was clean.
