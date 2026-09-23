# Stub: The Tickets board's terminal launch link opens nothing

- lane: bug
- found-by: launcher-dropdown Build smoke (operator) · 2026-09-23
- complexity: medium
- priority: P3
- size: S
- sources: `websites/admin-dashboard/lib/launchers/claude-terminal.ts` (parked in #145)

## Problem

On the Tickets board, the "Claude Code (terminal)" menu entry — a `claude-cli://open?repo=owner/name&q=…`
link — did nothing when Jamie tapped it: no terminal opened, no session started. The target is
parked (`parked: "Not working yet"` in its file), so it shows dimmed in every menu and emits no
link; the board copies the prompt by default instead.

Not known yet: whether the scheme handler is registered on the machine (it is registered by the
Claude Code CLI; `claude` must have run once), whether the browser or the PWA blocks a custom
scheme from a menu item (the link is an `<a>` without `target`, clicked inside a Radix menu),
or whether `repo=owner/name` needs a clone the CLI has seen.

## Prompt

In this repo, find out why the Tickets board's terminal launch link opens nothing and make it
work, or record why it can't. Read `websites/admin-dashboard/lib/launchers/claude-terminal.ts`
and the doc it cites (code.claude.com/docs/en/deep-links), and `components/launch-menu.tsx`
(how a menu entry renders its link). Produce one exact test URL for a repo on Jamie's machine and
ask him to try it three ways, and report each as one line — pasted into the browser address bar /
tapped from the board in a browser tab / tapped from the installed PWA: *opened a session /
asked permission / nothing*. Fix what the result points at (the handler registration, the way
the menu item navigates, or the link's shape). The fix's last step is deleting the `parked`
line in `claude-terminal.ts` and updating the "State" column of the target table in
`websites/admin-dashboard/README.md` § Tickets. If the scheme can't work from the PWA at all,
leave it parked with a reason that says so. Don't run build/lint/typecheck locally — CI is the
source of truth. Ship through the bug lane.
