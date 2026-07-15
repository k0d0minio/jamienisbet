# README-as-context, and the README / CONTEXT split

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** Define what `README.md` and `CONTEXT.md` each carry, so humans and agents always know where to look.

Every folder in this repo carries a `README.md`. It doubles as the folder's ICM context file:
human-readable narrative *and* the agent's router. There is exactly one separate Layer-0 file —
the root `CLAUDE.md`.

## The split (decided 2026-06)
At **stage** level we keep two files, because the audiences differ:

- **`README.md` — human narrative.** What this stage is for, how it connects upstream/downstream,
  notes. Prose. The thing a person reads to understand the stage. It ends with a pointer:
  `> Contract: see [CONTEXT.md](CONTEXT.md).`
- **`CONTEXT.md` — machine contract.** The strict, parseable stage contract an agent loads to
  execute: `Inputs / Process / Outputs / Integrations / Verify / Review gate`. Schema in
  [`stage-contracts.md`](stage-contracts.md).

At **non-stage** folders (workspace routers, hubs, `_config/`, `shared/`, `websites/`)
the `README.md` alone is the context file — these are routers and references, not
executable stages, so they need no separate contract.

## Why split at the stage level
The contract is the *control point* of the whole system (ICM §3.2): it dictates exactly what an
agent loads. Keeping it as a thin, uniform `CONTEXT.md` means an agent (or a script) can load only
the contract without wading through narrative, and the contract's shape is identical in every
stage. The README stays free to be as discursive as a human needs without bloating what the agent
ingests.

## Rules
- Contract fields (Inputs/Process/Outputs/…) live **only** in `CONTEXT.md` — it is the source of
  truth the agent obeys. Don't duplicate them into the README.
- If narrative changes agent behaviour, it belongs in `CONTEXT.md`, not the README.
- Exactly one `CONTEXT.md` per stage folder; none anywhere else.

Related: [`the-five-layers.md`](the-five-layers.md) · [`stage-contracts.md`](stage-contracts.md)
