# Spec: Gates and PRs in the Inbox

- slug: gates-read
- personas: operator
- touches: websites/admin-dashboard/lib/gates.ts (new), websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/lib/inbox.ts, websites/admin-dashboard/lib/inbox-row.ts, websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/app/(app)/layout.tsx, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/components/inbox-list.tsx, websites/admin-dashboard/components/inbox-detail.tsx, websites/admin-dashboard/components/inbox-row.tsx, websites/admin-dashboard/README.md
- complexity: complex

## Problem

The dashboard reads no pull requests. What really waits on Jamie now is review — Spec approved
and Ready to merge ticks, green lane PRs to merge, red CI, blocked runs and scopes to read — and
he finds them by visiting GitHub repo by repo (D-14). Under the `admin-cockpit-redesign` scope
(initiative: operator cockpit; objective: less time finding work, more time launching it) the
Inbox is the fast queue of what needs him (D-13); `inbox-rebuild` shipped its frame and the
Follow-ups group, and this stub (8 of 11) adds the **Gates and PRs** group at its head, read
across every active repo, so review work is found in one place on the desk and on the phone
(D-21). The dashboard only surfaces the gate and links to where it is resolved; ticking and
merging stay on GitHub (D-9).

## Proposed change

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC — "Inbox" at the desk and
"Inbox on iPhone"; sample data) is the visual reference for the group's rows, the pane and the
phone. Everything below sits on the desk tier and the Inbox frame `inbox-rebuild` landed
(D-3, D-4).

**1. The repos read.** Every repo on the Work board's roster — the pinned house and client repos
plus every swept repo with an `.icm/intake/` — the same roster, from the same hourly-cached read,
so a repo is on the Inbox exactly when it is on Work.

**2. The pull-request read — one GraphQL query.** Open pull requests come from GitHub's GraphQL
API, one aliased query covering every roster repo (split into chunks of at most 10 repos when the
roster is larger), rather than a REST fan-out per repo. Per repo it asks for up to 30 open PRs,
most recently updated first, with: number, title, URL, draft flag, labels, body, head branch name
and head commit; on the head commit its check runs and commit statuses (name, state or
conclusion, URL, start and completion times) and its deployments with their latest status's
environment URL (the Vercel previews). The query goes through the board's GitHub queue with
`force-cache`, a 60-second revalidate and a cache tag of its own (also busted by the board's
refresh), so a warm Inbox costs no request and a cold one costs one per chunk — on GraphQL's
own rate budget, never the REST budget the board's tree and blob reads spend. A repo GraphQL
cannot resolve (no access, renamed) comes back as a per-repo error in the same answer; it is
named in the group's foot line and the other repos still show. A repo with more than 30 open PRs
says so in that foot line.

A second query reads each run's `status.md` from its PR's head commit (§3, Blocked run), keyed by
head commit id, so it is re-asked only when a PR is pushed.

**3. The six kinds.** Each PR yields at most one row, by the first rule that matches in this
order; a PR matching none (a draft in Build, CI still pending, Ready to merge ticked and waiting
on Release) yields no row.

| Kind (row tag) | The rule |
| --- | --- |
| **Blocked run** | The PR's body names its run slug (the spine Spec table's `Slug` row, or a lane's `- slug:` line), and `.icm/runs/<slug>/status.md` on the PR's head reads `blocked: yes…`. Also a run folder on `main` (a scope run) whose `status.md` reads `blocked: yes…` — one row with no PR. |
| **Red CI** | The PR is not a draft and its head carries a failed signal, read with `ci-status.sh`'s arithmetic: check runs deduplicated by name with the newest attempt winning; a check run is failed when completed with any conclusion but success, neutral or skipped; a commit status is failed on `failure` or `error`; "Vercel Preview Comments" is noise; a Vercel status whose description says the build was skipped (Ignored Build Step, Skipped, Not affected) is neither pass nor fail. Advisory jobs (`… (advisory)`) count — a red advisory job is a finding. Any open non-draft PR on a roster repo, pipeline or not. |
| **Spec approved** | The body carries the `<!-- gate:spec-approved -->` anchor and the checklist line after it is `[ ]`. |
| **Ready to merge** | Not a draft; the body carries `<!-- gate:ready-to-merge -->` with `[ ]` after it (Spec approved already ticked, or the rule above would have matched); every signal on the head passed or was skipped and none is pending. |
| **Lane PR · merge** | Not a draft; a lane PR — a `type:bug`, `type:tweak`, `type:chore`, `type:hotfix` or `type:handover` label, or a `PIPELINE RUN (lane: …)` marker in the body; every signal passed or was skipped and none is pending. |
| **Scope to review** | Read from the board's tree of the repo's default branch, not from PRs: `.icm/runs/<x>/01_scope/output/scope.md` exists, `.icm/intake/<x>/` holds at least one open stub, and `.icm/intake/<x>/_done/` holds none — no stub has been taken into Define yet. The row leaves when `new` takes the first stub. (A scope's own `status.md` keeps reading `phase: scope` after its review, so it cannot be the signal.) |

Gate anchors are read as `.icm/_shared/github.md` reads them: find the anchor comment, the next
checklist line is the gate, `[x]` is ticked; a missing anchor means "not required".

**4. The group.** **Gates and PRs** sits above Follow-ups, with the same header row, chevron,
count and remembered fold as Follow-ups (its own fold key). Rows are ordered by kind as in the
table above — Blocked run, Red CI, Spec approved, Ready to merge, Lane PR · merge, Scope to
review — and oldest first within a kind. The group is not capped. A row reads, as in the mockup:
the **kind tag** in mono; the **title** (the PR's title; for a scope, its breakdown's title and
"— N stubs"; for a blocked run with no PR, its slug); the **repo** and **`#n`** in mono (`main`
for a scope or a PR-less run); and the **age** in mono. Red CI and Blocked run set their tag and
age in the destructive colour.

The age is how long the row has been waiting on Jamie, from the data the read already has:

- Spec approved — since the PR was opened.
- Ready to merge, Lane PR · merge — since the newest check on the head completed (when it went green).
- Red CI — since the failed check completed.
- Blocked run — since `status.md`'s `updated:` date.
- Scope to review — since `scope.md`'s `agreed:` date.

Shown as `now`, `Nm`, `Nh` or `Nd`, the day-granular dates as `today` or `Nd`.

**5. The badge.** The rail's and the tab bar's Inbox badge counts the Gates and PRs rows plus the
follow-up rows (the capped count `inbox-rebuild` defined), and the Inbox header's "N waiting on
you" is the same sum. When the gates read fails or GitHub is not configured, both count the
follow-ups alone.

**6. The detail pane (at the desk, from `lg`).** For the selected gate row: the tag and the ref
(`PR #n`, or `main`), the title, the repo and the age, one line saying what to do, then a list of
the head's signals — each check and preview by name with `passed`, `failed`, `running`,
`skipped` or `not run` (for a scope: `scope.md`, `breakdown.md` and the stub count; for a blocked
run: the `blocked:` reason as written) — then the actions and the foot line "The tick itself
happens on GitHub — the Inbox only tells you it is waiting and drops the row when it is done."
Every action is a link that opens GitHub or the preview in a new tab.

| Kind | What to do | Primary (↵) | Secondary | Also |
| --- | --- | --- | --- | --- |
| Blocked run | the `blocked:` reason | Read handoff.md | Open PR #n | Read status.md |
| Red CI | name the failed check(s) | Open failing check (the first failed signal's URL) | Open PR #n | every other failed check; **Launch a fix session** (⌘↵) |
| Spec approved | "Read the spec on the PR and tick Spec approved; Build starts only after that." | Open PR #n | Read spec.md | — |
| Ready to merge | "Smoke the preview, then tick Ready to merge; Release takes it from there." | Open preview | Open PR #n | each other preview |
| Lane PR · merge | "Lane PRs carry no checkbox: smoke the preview and squash-merge from GitHub." | Open preview | Open PR #n | each other preview |
| Scope to review | "Read the scope and the breakdown on main; when happy, run new to walk the batch into Define." | Read scope.md | Read breakdown.md | the intake folder; **Launch "new"** (⌘↵) |

- Files open on GitHub: a run's files at the PR's head branch, a scope's on the default branch;
  `Read spec.md` and the run-file links appear only when the body names the slug.
- Previews are the head's deployments' environment URLs, one per deployed project; where there is
  none, `Open PR #n` becomes the primary and there is no secondary.
- **Launch** uses Work's launch target and link shape (`lib/launchers`) in the row's repo:
  - Red CI on a spine PR (it carries the gate anchors) sends the run's verb —
    `/pipeline release <slug>` when Ready to merge is ticked, else `/pipeline build <slug>`.
  - Red CI on any other PR sends a short authored prompt: the repo, the PR number and URL, its
    head branch and the failed checks' names, asking to read the failing checks and push a fix to
    that branch without opening a new PR.
  - Scope to review sends `/pipeline new`.
  - Blocked run, Spec approved, Ready to merge and Lane PR · merge offer no launch.

**7. Keys (at the desk).** `j`/`k` and ↓/↑ move through both groups' visible rows, skipping
folded ones; `↵` runs the selected gate row's primary; ⌘↵ its Launch where it has one; `e` and
`s` do nothing on a gate row. The same guards as `inbox-rebuild` apply (not while typing, not
with the palette open, not with a modifier held — ⌘↵ excepted). The foot's key hints gain
`⌘↵ launch`.

**8. On the phone (below `lg`).** The group's rows at least 44px tall, two lines as in the phone
mockup: the tag, then the title, then the repo and `#n`, the age on the right. Tapping opens the
row in place (one open at a time): the what-to-do line, the primary and secondary as two
full-width 44px buttons, then a line of text buttons for the rest (Launch, the other links).
Gate rows carry no swipe. Everything reachable one-handed at 390px wide (D-21).

**9. Never making the Inbox wait.** The Follow-ups group renders from Neon exactly as today,
without waiting for GitHub. The Gates and PRs group streams in after it: a one-line loading row
in its place until the read lands, bounded at 10 seconds. Until the operator moves the selection,
it follows the queue's first row, so the first gate row is selected when the group lands. The
group is dropped for a single muted line in its place when:

- `GITHUB_TOKEN` is unset — "GitHub isn't configured here, so gates and PRs can't be read."
- the read fails or times out — "Couldn't read GitHub — <what GitHub said>", in the rate-limit
  wording the board already uses.

Neither line is a row, and neither is counted in the badge.

**10. Staying current.** The read is at most 60 seconds behind GitHub. The Inbox header shows
"as of HH:MM" for the gates read and a refresh control that busts the gates read and the board's
position read, so a tick or merge made on GitHub drops its row on the next read. No row is
removed optimistically — the Inbox never learns a gate was cleared except from GitHub.

**11. Docs.** `websites/admin-dashboard/README.md`'s Inbox section describes the Gates and PRs
group, the six rules, the badge sum and the request budget, and its environment note says the
token needs pull-request, checks, commit-status and deployment read (a classic token's `repo`
scope covers it).

## Acceptance criteria

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

## Out of scope

- Ticking a gate box, approving, merging or re-running a check from the dashboard (D-9).
- Notifications of any kind.
- A row for a spine PR whose Ready to merge is ticked and which waits on Release — Work shows that run as running (D-11).
- Launches on Blocked run, Spec approved, Ready to merge and Lane PR · merge rows; launching several at once.
- Repos outside the Work board's roster, and PRs past the 30 most recently updated per repo.
- Any change to the Follow-ups group's rules, caps or actions.
- Arrow-key or `e`/`s` handling on the phone; a keyboard help sheet (`?`) for the Inbox.
- The marketing tier (D-22).

## Open questions

- none
