# The project register — `.icm/project.md`

*The contract for the one file `/project` reads first and writes last. Companions:
[TICKETS.md](TICKETS.md) (what the work becomes) ·
[LENSES.md](LENSES.md) (how the repo is analysed).*

Every repo `/project` has ever run on carries **one** `.icm/project.md`. It holds what the
project is *for*, the business logic that governs it, the feature set and where each
feature stands, the constraints, and the decisions that got it here.

**It is the reason `/project` can run a hundred times.** Run 1 writes it from an
interrogation. Run 2 reads it, asks whether it is still true, and amends. Nothing else in
the repo has to be diffed to answer "has the direction changed" — this file *is* the
direction.

## What it is not

- **Not `CLAUDE.md`.** That is Layer 0: identity and routing — *where to go*. This is
  *what we are building and why*. A session reads `CLAUDE.md` to navigate and
  `project.md` to understand. Neither should restate the other; when they overlap,
  `CLAUDE.md` links here.
- **Not a backlog.** Anything actionable is a ticket in `.icm/intake/`. The Features table
  below *points at* tickets; it never replaces them.
- **Not a status report.** No progress percentages, no burn-down. Feature state is four
  words, and the tickets carry the detail.
- **Not business state.** Deal value, billing and client status live in Neon via the
  dashboard, never here.

## Structure

````markdown
# <Project> — project register

> Last `/project` run: 2026-08-14 · commit `1675b5e`
> Maintained by `/project`. Amend by re-running it, not by hand-editing during a session.

## What this is
One paragraph. What the thing is, who uses it, and the one job it has to do.

## Intent
- **For whom** — the actual users, named as concretely as the project allows.
- **The job** — the single thing it must do well. If there are two, say which wins.
- **Done looks like** — the sentence that decides whether v1 shipped.
- **Explicitly not** — what this project is deliberately not for.

## Business logic
The rules that govern behaviour, in the domain's own words — not implementation.
"A DM sees every character; a player sees only their own." "Invoices are raised as
drafts; finalising is a separate deliberate act." This is the section tickets are
derived from, so it earns the most interrogation time.

## Features
| Feature | State | Tickets |
|---|---|---|
| Character sheet — combat core | ticketed | DND-009, DND-041, DND-042 |
| Fast reference lookup | shipped | DND-003 |
| Dice roller | out | — killed 2026-08-13, physical dice are the point |

State is one of: **shipped** · **ticketed** · **wanted** (agreed, not yet cut) ·
**out** (deliberately excluded — always say why).

## Constraints
- **Technical** — stack, data source ceilings, platform limits.
- **Accessibility** — the bar being built to, stated once so every ticket inherits it.
- **Legal / data** — licensing, personal data, sector rules.
- **Commercial** — deadline, budget shape, anything that bounds scope.

## Decisions
| ID | Decision | Date | Supersedes |
|---|---|---|---|
| D1 | SRD 5.1 (2014), not the 2024 PHB — it is what the data source serves | 2026-08-14 | BRD §3.1.1 |

Stable IDs, never reused. A reversal gets a new ID and names what it supersedes; the
old row stays, so the history of the thinking survives.

## Open questions
Things nobody has decided, carried between runs so they are re-asked rather than
forgotten. Each names who can answer it and what it blocks. A question that blocks work
should already be a decision ticket — link it.

## Run log
| Date | Commit | What changed |
|---|---|---|
| 2026-08-14 | `1675b5e` | First run. 10 decisions, 28 tickets cut, DM role added. |
````

## Rules

- **One file per repo**, at `.icm/project.md`. Never per-feature, never dated — the dated
  artifacts are the tickets and the git history.
- **`/project` owns it.** Hand-edits are allowed and will be respected, but the next run
  will reconcile them against what it finds and ask about anything contradictory.
- **The run log is append-only.** It is how a re-run knows what code to look at: everything
  since the last recorded commit.
- **Decisions are append-only too.** Amend by superseding, never by editing a row away —
  the estate has already lost one scope decision to a silent rewrite.
- **Adopt, never fabricate.** A repo with existing scope docs, discovery reports or a
  decisions register gets them *folded in* on first run, with their provenance cited.
  Never write a register that invents intent nobody stated.
- **Empty sections stay, marked `— not yet established`.** A missing section reads as an
  oversight; an empty one reads as an honest gap and becomes the next run's questions.
