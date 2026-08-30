# Intake — the work backlog for this repo

> This folder follows the estate-wide ticket standard (canonical spec:
> `_system/contracts/TICKETS.md` in the `icm-board` repo — restated here so this repo
> stands alone in a cloud session). The working knowledge is the `ticket-craft` skill,
> [`.claude/skills/ticket-craft/SKILL.md`](../../.claude/skills/ticket-craft/SKILL.md);
> the folder map is [`../CONTEXT.md`](../CONTEXT.md). The admin dashboard's Tickets
> board reads this folder from `main`.

## The shape

One markdown **stub** per unit of work. Stubs never live alone:

```text
intake/
  <epic-slug>/           related work
    breakdown.md           what was understood, the decisions, and `## Build order`
    <feature-slug>.md      one stub per unit of work
    _done/                 this epic's finished stubs
  triage/                one-off bug / tweak / chore stubs, parked
    _done/
  _done/                 completed epics, archived whole
```

- **Related work is an epic** — `<epic-slug>/` with a `breakdown.md` (what was
  understood + a `## Build order`) and one stub per unit of work. A single-stub epic is
  fine.
- **One-off findings are triage stubs** — parked in `triage/` in a minute, so the PR in
  hand is never widened to absorb them.
- **Identity is the path** — a ticket is `<epic-slug>/<feature-slug>`. No ticket
  numbers and no prefixes: the filename is the slug, and a slug is never reused within
  an epic.

## What a stub carries

The H1 is `# Stub: <title>`. Under it, dash-lines. An epic stub carries:

- `- feature-slug:` — matches the filename
- `- sequence: <n> of <m>` — contiguous `1..m` across the epic
- `- depends-on:` — `none`, or in-epic slugs sequenced earlier

A triage stub carries instead:

- `- lane: bug | tweak | chore`
- `- found-by:` — what turned it up, and when

Optional on either: `- priority: P0|P1|P2` (P0 urgent · P1 next · P2 whenever),
`- size:`, `- blocked: <reason>` (external blockage — remove the line when it lifts),
`- sources:` (cite the evidence). There is no `Status` row — see below.

Then prose: `## What this is`, and — for work meant to be picked up — a `## Prompt`.

## The `## Prompt` is the pick-up contract

It has to stand alone pasted into a fresh Claude session at the repo root: the board's
"Copy prompt" sends *only* that section. So write it cold, name the files to read
(starting with the stub itself), and say how the work ships — `claude/` branch, PR, and
the `git mv` that closes the stub.

## Status is positional

- **Open** = the stub sits in a live epic or in `triage/`. **Next**, within an epic, is
  the lowest unmet `sequence`.
- **Done is a folder move, never a field** — `git mv` the stub into its epic's (or
  `triage/`'s) `_done/` in the PR that finishes the work.
- **Abandoned work moves there too**, with a `> Dropped: <reason, date>` line prepended.
  Nothing is ever deleted.
- **A completed epic archives whole** — once every stub sits in `_done/`,
  `git mv intake/<epic>/ intake/_done/<epic>/`.
- **Today is not here.** It lives in one file estate-wide — icm-board's `.icm/today.md`,
  written by `/day`, at most 10 entries. Ticket files carry no today flag.

## Standing rules

- Any plan, backlog or task list for this repo becomes stubs here — **never a loose
  `TODO.md` or `BACKLOG.md`**. Cutting what is left over is part of ending any session.
- The board reads `main` via the GitHub API — **an unpushed stub does not exist.**
  Ticket-only commits go straight to `main` (`Plan:` / `Wrap:`); everything else
  through a PR on a `claude/` branch.
- Legacy flat `JN-NNN` tickets (pre-2026-08-28) are left exactly as they are —
  migrating a repo is `/project`'s judgment work, not a side effect of another task.
