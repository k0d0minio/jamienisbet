# Tasks: gates-read

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] `/inbox` shows a "Gates and PRs" group above Follow-ups, with its count in the header row, a fold that survives a reload, and rows ordered Blocked run, Red CI, Spec approved, Ready to merge, Lane PR · merge, Scope to review, oldest first within each kind.
- [ ] An open PR on any roster repo whose body has an unticked Spec approved box appears as a Spec approved row; once the box is ticked on GitHub it leaves within 60 seconds, or at once after the Inbox's refresh control.
- [ ] A non-draft PR with Spec approved ticked, Ready to merge unticked and every signal passed or skipped appears as Ready to merge; it does not appear while any signal is pending.
- [ ] A non-draft lane PR (type label or lane marker) with every signal passed or skipped appears as Lane PR · merge, and leaves once merged or closed.
- [ ] A non-draft PR with a failed check run, commit status or advisory job on its newest attempt appears as Red CI, pipeline PR or not; a superseded cancelled attempt, a Vercel Preview Comments check or a skipped Vercel build does not make it red; a draft never appears as Red CI.
- [ ] A run whose `status.md` on its PR's head (or on `main`, for a run folder there) reads `blocked: yes…` appears as a Blocked run row with the reason in the pane, ahead of any other kind for the same PR.
- [ ] A scope whose `scope.md` is on the default branch with open stubs and nothing in its epic's `_done/` appears as Scope to review; it leaves once the first stub is taken into `_done/`.
- [ ] Each PR yields at most one row, by the kind precedence of the table.
- [ ] Each row shows the kind tag, title, repo, `#n` (or `main`) and age in the shapes of §4; Red CI and Blocked run set tag and age in the destructive colour.
- [ ] At 1024px and wider the pane shows the what-to-do line, the head's signals with their states, and the kind's actions; each action opens the PR, the preview, the failing check or the run/scope file on GitHub directly, and Open PR becomes the primary where no preview exists.
- [ ] Red CI on a spine PR launches `/pipeline build <slug>` (or `/pipeline release <slug>` once Ready to merge is ticked); Red CI on any other PR launches the authored fix prompt naming the repo, PR, branch and failed checks; Scope to review launches `/pipeline new`; no other kind offers a launch.
- [ ] `j`/`k`/↓/↑ move across both groups, `↵` opens a gate row's primary, ⌘↵ its launch; `e` and `s` do nothing on gate rows; the key-hint foot lists `⌘↵ launch`.
- [ ] Below 1024px a gate row is at least 44px, opens in place with its primary and secondary as two 44px buttons and the rest as text buttons, and every action is reachable one-handed at 390px with no horizontal scroll.
- [ ] The rail and tab-bar badge and the header's "N waiting on you" equal gate rows plus follow-up rows after the same reads; with the gates read failed or unconfigured they equal the follow-up rows.
- [ ] With `GITHUB_TOKEN` unset, or GitHub failing or taking longer than 10 seconds, the Follow-ups group renders without delay and the Gates group is replaced by one muted line saying why; a repo GraphQL could not resolve is named in the group's foot while the others still show.
- [ ] A warm Inbox render makes no GitHub request; a cold one makes one GraphQL request per chunk of up to 10 repos for PRs, at most one more for run `status.md` files, and reuses the board's cached roster and tree reads — no per-PR REST call.
- [ ] The Inbox header shows the gates read's "as of" time and a refresh control that re-reads GitHub.
- [ ] The group renders in the desk tier in light and dark, and the loading skeleton includes its one-line placeholder.
- [ ] `websites/admin-dashboard/README.md` describes the Gates and PRs group, its six rules, the badge sum, the request budget and the token's read scopes.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Queue

- [x] Share the board's plumbing — `lib/tickets.ts`: `githubGraphql`, `readRepoTree`, `readBlob`, `readRoster`, `GATES_CACHE_TAG`, `isBoardConfigured` (da4bc3f)
- [x] The read and the rules — `lib/gates.ts` (new), the gate row types in `lib/inbox-row.ts` (da4bc3f)
- [x] Badge and refresh — `countInbox` in `lib/inbox.ts`, the layout, `refreshGates` in `app/(app)/board-actions.ts` (da4bc3f)
- [x] The Inbox UI — page, loading, `inbox-list.tsx`, `inbox-row.tsx`, `inbox-detail.tsx` (da4bc3f)
- [x] Docs — `websites/admin-dashboard/README.md` (da4bc3f)
