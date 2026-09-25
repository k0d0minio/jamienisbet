# Spec: The ticket reader and one-click launch

- slug: work-reader
- personas: operator
- touches: websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/launch-menu.tsx, websites/admin-dashboard/components/markdown.tsx, websites/admin-dashboard/components/work-desk.tsx, websites/admin-dashboard/components/work-model.ts, websites/admin-dashboard/components/use-board-keys.ts, websites/admin-dashboard/components/board-keys-sheet.tsx, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/lib/launchers/index.ts, websites/admin-dashboard/README.md
- complexity: complex

## Problem

Work is home and its desk has three panes (D-6, D-7), but the third pane is still the phone
board's detail view: the prompt is folded behind a disclosure, the epic and its breakdown are a
view switch away, and the one real action is a copy. Reading a ticket before launching it takes
clicks, and launching it takes a copy and a paste (D-8, D-10). The board also cannot tell that a
ticket is already under way: it reads `main`, where a run's folder never appears while its pull
request is open, so a ticket being built still reads as "next" (D-11). The
`admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time finding work,
more time launching it) settles the round-2 reader. This stub (5 of 11) builds it at the desk;
`work-phone` brings it under `lg`.

## Proposed change

The visual reference is the round-2 reader on the design canvas
(https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC, "Work, three panes", sample data), drawn in
the desk tier. Where this spec and the mockup differ, this spec wins.

**1. The reader replaces Work's third pane at the desk** (`lg` and up) when a ticket is
selected. It has a head, a body and a side column, all visible at once — no tabs, no disclosure.

- **Head.** The path `repo / epic / slug` in mono (`repo / triage / slug` for a triage stub), a
  GitHub ↗ link to the stub file, the title, and one summary line: status dot and word,
  priority, `n of m`, size, client (the house repo says "house"). Any part the ticket lacks is
  left out with its separator. A blocked ticket shows **Blocked:** and its reason on its own line
  under the summary, from the same rule the list uses.
- **Action row.** The primary button is **Launch in Claude Code** (the default target's label
  from the launcher registry) with a `⌘↵` hint. Beside it the recommendation — the model and
  effort, in the target's own words ("Opus · high") — then **Copy prompt** (secondary), then the
  menu of other registered targets as today. No target in the registry can carry model or effort
  in its link today (Claude Code's web link documents neither), so the recommendation is always
  shown beside the button; a target whose `supports` says it carries them gets it in its URL, as
  the registry already provides. The registry (`lib/launchers/`) stays the only place a link is
  built; no new target is added.
- **Body**, top to bottom:
  - **What this is** — the stub's own sections, rendered (Problem, Proposed change, Acceptance
    criteria, Out of scope, and any other section it carries), except Notes for Define and
    Prompt.
  - **Notes for Define** — that section, rendered, when the stub has one.
  - **Prompt · what the launch sends** — exactly the text Launch sends and Copy prompt copies
    (the `/pipeline` verb where the repo carries the router, else the prompt body with its
    recommendation line), in mono, never folded, with `owner/repo · mode code` above it. When
    the launch sends a verb, the stub's own `## Prompt` section is rendered after it under its
    own heading, so the manual pick-up is still readable.
- **Side column:**
  - **Stub** — the stub's dash-lines (depends-on, sequence, size, lane, found-by, …) as label /
    mono value rows; each `depends-on` slug that is on the board selects that ticket, as today.
  - **The epic** — its title, progress (`k of m done`), and its build order: every stub in
    sequence with its state (done dimmed, running marked, the selected stub marked current).
    Each row that has a ticket on the board selects it; a done row is plain text. Not shown for
    a triage stub.
  - **What I understood** — the epic breakdown's `## What I understood` section, rendered,
    then **Read the whole breakdown ↗** (the breakdown file on GitHub). Not shown for a triage
    stub or an epic without a breakdown.
- **Batch and repo selections** keep their own views in pane three (batch summary, meter,
  tickets, actions, breakdown; repo view), restyled to the desk tier. Their content does not
  change.

**2. Launch.** Pressing Launch opens the default target's link in a new tab. `⌘↵` (`Ctrl+↵` off
macOS) triggers the reader's primary button for the selected ticket from any pane at the desk,
except while a text field, the command palette or a sheet has focus. When the prompt is past the
target's length cap, Launch is not offered: **Copy prompt** becomes the primary button, the
reader says "Too long for a link — copy it into a new session" (the registry's existing line),
and `⌘↵` copies. A ticket with nothing to send (a legacy ticket with no prompt) offers neither
and says so; `⌘↵` does nothing. The keyboard sheet (`?`) lists `⌘↵ launch`. Nothing is stored
when Launch is pressed (D-11).

**3. Running, as GitHub says it (D-11).** Each active repo's read gains one request: its open
pull requests (`GET /repos/{owner}/{repo}/pulls?state=open`, one page of 100), under the board's
existing cache rules (`force-cache`, the 60-second revalidate, the 8-requests-in-flight cap). A
pull request is matched to a stub like this:

- **A spine PR** (body carries the `PIPELINE RUN` marker and a Spec table `Slug` row) matches
  the epic stub whose file name is that slug, in the same repo; failing a body match, a head
  branch `claude/<slug>` matches the same way.
- **A lane PR** (labelled `type:bug`, `type:tweak`, `type:chore` or `type:hotfix`) carries the
  lane's own slug, not the triage stub's name. It is matched by one more request, its file list
  (`GET /repos/{owner}/{repo}/pulls/{n}/files`): a file renamed from
  `.icm/intake/triage/<name>.md` to `.icm/intake/triage/_done/<name>.md` marks triage stub
  `<name>` as running. The file list is cached for an hour (the stub's move is in the lane's
  first commit and does not change). A lane PR that renames no triage stub matches nothing.
- A PR that matches no stub is left alone here (the Inbox lists pull requests from
  `gates-read`).

A matched stub's status becomes **running** everywhere the board shows status (list dot, Running
view, epic build order, a dependant's "waiting on … — running"). Its reader keeps the whole stub
body and side column, and in place of Launch the action row shows what is running: a running
dot, `draft PR #n` or `PR #n` (linked), the stage (`Define`, `Build` or `Release` from the PR's
`stage:*` label; `lane` for a lane PR), and how long ago it was opened. Copy prompt stays
available as the secondary button; Launch and `⌘↵` are not offered. A run folder on `main` (the
existing `runs/<slug>` ticket) also shows its PR when one matches its slug.

**4. A scope run is not a running ticket.** A folder under `.icm/runs/` on `main` holding only
`01_scope/` (and its `run.md`) is a scope waiting for review, not a run in flight: it no longer
produces a `runs/<slug>` ticket, and it does not count in the Running view.

**5. Degrading.** No `GITHUB_TOKEN` behaves as today. If a repo's pull-request read (or a lane
PR's file read) fails, that repo's tickets still show with running detection from run folders
only, and the view says in one line that pull requests couldn't be read for that repo — the
board's existing partial-read pattern. The board never blocks on it.

**6. Desk tier only.** The reader and its styles use the desk tier's tokens and primitives
(Hanken Grotesk for text, Plex Mono for paths, slugs, figures and dates; hairlines; state as a
small dot; 32px rows) — no app-tier classes (D-3, D-4). The ticket body's `.prose` styles are
moved to the desk tier for the reader. The phone board's ticket detail under `lg` is unchanged
by this run, apart from sharing the running status and the launch data (`work-phone` rebuilds
it).

**7. README.** `websites/admin-dashboard/README.md` § Tickets / Work describes the reader, the
launch key, the pull-request read and its request budget, and the lane-PR match rule.

## Acceptance criteria

- [ ] At the desk, selecting a ticket shows its head, its stub sections, Notes for Define and the full prompt together, with no extra click.
- [ ] The reader's head shows `repo / epic / slug` in mono, the title, and a summary line with status, priority, `n of m`, size and client; a blocked ticket shows its reason.
- [ ] Launch in Claude Code is the primary button and opens the default target's link in a new tab; the model and effort recommendation shows beside it.
- [ ] `⌘↵` launches the selected ticket at the desk, and does nothing while a text field, the palette or a sheet has focus; `?` lists it.
- [ ] Copy prompt copies exactly the text the prompt block shows, which is exactly what Launch sends.
- [ ] A prompt past the link's length cap offers no Launch: Copy prompt is primary, the too-long line shows, and `⌘↵` copies.
- [ ] The side column lists the stub's dash-lines, the epic's build order with the current stub marked and each open or running row selectable, and the breakdown's "What I understood" with a link to the whole breakdown; a triage stub shows only its dash-lines.
- [ ] An epic stub with an open spine PR (by Slug row or `claude/<slug>` head) reads as running everywhere on the board, shows `PR #n` linked with its stage and age, and offers no Launch.
- [ ] A triage stub whose move to `triage/_done/` is in an open lane PR's file list reads as running in the same way.
- [ ] A folder under `.icm/runs/` holding only `01_scope/` produces no running ticket.
- [ ] A failed pull-request read leaves the repo's tickets on screen, says so in one line, and falls back to run-folder detection.
- [ ] Batch and repo selections keep their views in pane three, drawn in the desk tier.
- [ ] No reader file uses an app-tier class or token.
- [ ] README § Tickets describes the reader, `⌘↵`, the pull-request read and its request budget.

## Out of scope

- Storing a "launched" mark when Launch is pressed (D-11). A ticket reads as running only once its PR exists.
- New launch targets, and putting model or effort into a link no target documents.
- Launching several tickets at once.
- The phone layout of the reader (`work-phone`).
- Listing pull requests that match no stub, gates, red CI and stuck runs (`gates-read`, which reuses this run's pull-request read).
- A `- stub:` line in lane PR bodies so the file-list request can go — that is a pipeline template change, not this repo's.
- Editing tickets from the dashboard (D-9).

## Open questions

- none
