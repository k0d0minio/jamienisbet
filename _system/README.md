# `_system` — the estate control layer

**Start here.** Process, contracts and scripts for the `Apps/` estate. Lean rules, not a
factory — the ICM business factory was retired 2026-08-12 and should not be rebuilt.

```
_system/
  README.md      ← you are here: what's where, and the house rules
  AUDIT.md       ← what's currently broken or undecided across the estate
  contracts/     ← the specs the commands read
  scripts/       ← the four executables
  template/      ← what icm-check.sh --fix seeds a repo from
  hooks/         ← session hooks
  reference/     ← background reading
```

## Three commands

They live in `Apps/.claude/commands/`. **The commands are the process** — there is no
separate narrative describing what they do, deliberately: two sources for one process is
how the old `PROCESS.md` drifted out of date.

| Command | Scope | When |
|---|---|---|
| **`/project <repo>`** | one repo, deep | Adopting a repo · before a sprint · whenever direction may have moved. Idempotent — re-run it freely. |
| **`/day [wrap]`** | the estate, shallow | Evening: pick tomorrow's ≤3. End of a session: bank what shipped, cut what's left. |
| **`/icm-check`** | the estate, structural | Conformance — does every repo carry the `.icm`/`.claude` baseline. |

Two agents back them, in `Apps/.claude/agents/`: `project-lens` (one analysis lens per
invocation) and `ticket-scout` (work in flight that no ticket knows about).

## `contracts/` — what the commands read

| Doc | Owns |
|---|---|
| [contracts/TICKETS.md](contracts/TICKETS.md) | The ticket format, estate-wide, and exactly what the dashboard parses. |
| [contracts/PROJECT.md](contracts/PROJECT.md) | `.icm/project.md` — a project's intent, business logic, features, constraints, decisions. |
| [contracts/LENSES.md](contracts/LENSES.md) | The seven analysis lenses `/project` fans over a repo. |
| [contracts/CLIENTS.md](contracts/CLIENTS.md) | The client lifecycle — `new → talking → client` (+ `lost`), and the flags that are deliberately not statuses. |

## `scripts/` — the four executables

Each prints a single `RESULT:` line and takes config from the environment, never `.env`.

| Script | Does |
|---|---|
| [scripts/icm-check.sh](scripts/icm-check.sh) | Checks every repo against the baseline. `--fix` seeds gaps from [template/](template/) and **never overwrites**. |
| [scripts/tickets-board.sh](scripts/tickets-board.sh) | The estate board. `--today` powers the SessionStart hook. |
| [scripts/ticket-hygiene.sh](scripts/ticket-hygiene.sh) | Read-only drift report; `/day` applies the fixes with judgment. |
| [scripts/pull-all.sh](scripts/pull-all.sh) | Pull every repo. |

## The shape of a repo

What all of the above is aiming at. Every estate repo looks like this:

```
.icm/
  project.md         ← what this is for, and why      → contracts/PROJECT.md
  intake/            ← the work                       → contracts/TICKETS.md
    <PREFIX>-NNN-slug.md
    _done/           ← finished AND abandoned tickets; nothing is deleted
  docs/              ← ad hoc reports, client words, runbooks
  onboarding/        ← client questionnaires, when there's a client
CLAUDE.md            ← Layer 0: identity + routing only
```

## House doctrine

Converged conventions. Where these conflict with a repo's own contracts, **the repo wins**.

- **The folders are the orchestration.** Never build an orchestrator — no scripts or
  frameworks to "drive" a pipeline.
- **Tickets ARE the plan.** No sprint field, no plan file, never a loose `TODO.md` or
  `BACKLOG.md`. A week's plan is the `Priority` rows; a day's plan is `Status: today` on at
  most **3 tickets estate-wide**.
- **Done is a folder, not a field.** `git mv` to `_done/`. Abandoned work goes there too,
  with a `> Dropped:` line — nothing is deleted, no number is reused.
- **CI is the source of truth.** The agent never runs `build`/`lint`/`typecheck`/`test`
  locally; it pushes and reads the checks.
- **Gates are human checkboxes** — the agent reads them, never ticks them.
- **Adopt or stop.** Resolve an existing run, register or ticket set; never fabricate one.
- **Thin Layer-0 `CLAUDE.md`** that routes rather than teaches.
- **Redirect files, not copies**, for cross-layer references — except where a repo must
  stand alone in a cloud session, which is why `.icm/intake/README.md` is a deliberate
  micro-copy.
- **Ticket-only commits go straight to `main`** (planning is data); code goes through a PR
  on a `claude/` branch.
- **No outbound action without review.** No secrets in git, ever — env vars only; flag any
  plaintext credential found.
- **`settings.local.json` is the accretion layer**; `settings.json` stays clean policy.
- **Sustentus is exempt** from all of this — its `.icm/` carries its own pipeline
  semantics.
