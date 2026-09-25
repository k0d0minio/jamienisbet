# Stub: The ticket reader and one-click launch

- feature-slug: work-reader
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: work-panes
- sequence: 5 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

Reading a ticket before launching means expanding the prompt and switching views, and launching is a copy step first. Jamie wants to see the stub, the prompt and the epic at a glance and launch in one move.

## Proposed change

Replace Work's third pane with the reader from the round-2 mockup. Head: the path `repo / epic / slug` in mono, the title, a line with status, priority, `n of m`, size and client. A blocked stub shows its reason. The action row leads with **Launch in Claude Code** (⌘↵), the recommended model and effort beside it, then Copy prompt and GitHub. Body: What this is, Notes for Define, and the prompt exactly as the launch sends it — all visible together, no tabs. A side column: the stub's dash-lines, the epic's progress and build order (each step selectable), and the breakdown's "what I understood" with a link to the whole breakdown. A running ticket shows what is running (run folder, pull request, stage) instead of the launch button. Batch and repo selections keep their own views, restyled to the desk tier.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] Selecting a ticket shows its stub body and its full prompt together without any extra click.
- [ ] Launch is the primary button; ⌘↵ launches the selected ticket at the desk; the model and effort recommendation shows beside it.
- [ ] Copy prompt copies exactly what Launch sends.
- [ ] The side column lists the dash-lines, the epic's build order with the current stub marked, and the breakdown excerpt.
- [ ] A ticket with a run folder or an open pull request reads as running, with a link to it, and offers no Launch.
- [ ] A prompt past the link's length cap falls back to Copy prompt, as today.

## Out of scope (this feature)

- Storing a "launched" mark (D-11).
- New launch targets.

## Notes for Define

D-8, D-10, D-11. Open points from scope.md: how a running lane PR is matched to its triage stub before any run folder exists; whether any launch target can carry model and effort (the Claude Code web link carries neither today). The launcher registry in `lib/launchers/` stays the only way to build a link.

touches: websites/admin-dashboard/components/ticket-detail.tsx, board-pane.tsx, board-views.tsx, launch-menu.tsx, markdown.tsx, app/globals.css (.prose), lib/launchers/**, lib/tickets.ts (running detection)

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/work-reader.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that work-panes is merged to `main` first.
Then run `/pipeline new work-reader` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
