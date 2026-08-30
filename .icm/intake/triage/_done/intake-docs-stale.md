# Stub: Intake docs still describe the retired JN-NNN scheme

- lane: chore
- found-by: lead-engine epic cut, 2026-08-30
- priority: P2
- size: S

## What this is

`.icm/intake/README.md` still documents the pre-2026-08-28 numbered ticket contract —
`JN-NNN-slug.md` filenames, H1 `# JN-NNN · Title`, `Priority`/`Status` rows — and
`AGENTS.md`'s routing table row for planning work says the same
(`tickets in .icm/intake/ (JN-NNN-slug.md)`). Both contradict `.icm/CONTEXT.md` and
`.claude/skills/ticket-craft/SKILL.md`, which this repo's actual tickets follow
(path identity, positional status, epics + stubs + triage). The README matters
doubly: AGENTS.md § "one of many" names it the deliberate self-contained micro-copy
of the contract for cloud sessions — right now it micro-copies a retired contract.

## What closing it takes

Rewrite `.icm/intake/README.md` as a faithful micro-copy of the current contract
(epics/breakdown/stubs/triage, `- feature-slug:`/`- sequence:`/`- depends-on:` and
`- lane:`/`- found-by:` dash-lines, positional status, `## Prompt` as the pick-up
contract), and fix the AGENTS.md routing row. Legacy `JN-*` files that still exist
stay untouched per ticket-craft. Ticket-only? No — AGENTS.md is not a ticket file,
so this goes through a `claude/` branch PR.
