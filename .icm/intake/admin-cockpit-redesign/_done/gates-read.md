# Stub: Gates and PRs in the Inbox

- feature-slug: gates-read
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: inbox-rebuild
- sequence: 8 of 11
- complexity: high
- recommended-model: opus

## Problem

The dashboard reads no pull requests. What really waits on Jamie now is review: spec approvals, merges, red CI and scopes to read. He finds them by visiting GitHub repo by repo.

## Proposed change

A new read across every active repo on the roster, and the **Gates and PRs** group at the head of the Inbox. It lists: pull requests whose body has an unticked **Spec approved** or **Ready to merge** box; green lane PRs waiting for a merge; open PRs with failing checks, and runs whose `status.md` says blocked; and scopes on `main` waiting for review. Each row: kind, title, repo, pull request number, age. The detail pane shows the checks, what to do, and links — the pull request, the preview, the failing check, the scope files. A red-CI row and a scope row also offer a launch (a fix session; `new`). The ticking and merging happen on GitHub; a row leaves when GitHub no longer shows it waiting.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] Each of the four kinds appears when it exists on any active repo and disappears once resolved on GitHub.
- [ ] A row links straight to the pull request or file that resolves it, and to the preview where one exists.
- [ ] The read respects the existing GitHub cache rules and never makes the Inbox wait: a failed or missing token drops the group with a one-line note.
- [ ] The Inbox badge counts gates and follow-ups together.
- [ ] The group reads well at the desk and on the phone.

## Out of scope (this feature)

- Ticking a box or merging from the dashboard.
- Notifications.

## Notes for Define

D-14, D-9. Open points from scope.md: how "a scope waiting for review" is detected; the request budget across every repo within the board's cache rules. The gate checkbox names are the pipeline's own (`.icm/_shared/github.md`).

touches: websites/admin-dashboard/lib/github.ts, lib/gates.ts (new), app/(app)/inbox/**, components/inbox-*.tsx

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/gates-read.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that inbox-rebuild is merged to `main` first.
Then run `/pipeline new gates-read` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
