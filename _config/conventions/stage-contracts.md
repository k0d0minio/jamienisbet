# Stage Contracts — the CONTEXT.md schema

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The one canonical shape every stage contract must follow, plus the rules for inputs, outputs, verification, numbering, and versioning.

Every stage folder (`NN_name/`) contains a `CONTEXT.md` with these six sections, in this order,
always:

```
# <NN — Stage Name> — Contract    (ICM Layer 2; narrative in README.md)

## Inputs
- Layer 4 (working): <prior stage output path | "human input">
- Layer 3 (reference): <exact reference path(s) this stage loads>

## Process
<the single job this stage does, in plain language>

## Outputs
- <deliverable>.md -> output/<client-or-run>/<vN>/

## Integrations
- <none | the script/MCP this stage may invoke, and whether draft-only>

## Verify
- <concrete cross-checks against earlier stages, run before the review gate>

## Review gate
- <none | what the human edits/approves before the next stage runs>
```

## Section rules
- **Inputs — always layer-tagged.** Prefix every input with `Layer 4 (working):` or
  `Layer 3 (reference):`. This tells the model what to *process as input* versus *internalise as a
  rule* (ICM §3.2). Name exact paths, never "the references".
- **Process — one job.** If you need "and" to describe two unrelated jobs, split the stage.
  (Principle: one stage = one job.)
- **Outputs — to `output/`, versioned** (see below).
- **Integrations — mandatory section, default `none`.** Any script or MCP call the stage may make
  is declared here so side-effects are auditable. Outbound actions are **draft-only** —
  [`scripts-and-integrations.md`](scripts-and-integrations.md).
- **Verify — mandatory, never empty.** Concrete checks ("every invoice number here exists in
  `07_invoice`; client name matches the `biz.clients` record"). Catches drift before the human sees it.
- **Review gate — explicit.** Either `none` or a description. Client-facing stages are always a
  gate — [`review-gates.md`](review-gates.md).

## Numbering & cross-references
- Stages are ordered by numeric prefix: `01_`, `02_`, … (snake_case).
- **Reference prior stages by number** (`../02_deal_analysis/output/`). Reordering or renumbering
  therefore means a deliberate find-replace pass — accepted cost, kept simple.
- **Insert a stage** with a letter suffix to avoid renumbering: `02a_design/` runs between `02_`
  and `03_`.

## Output versioning
- Runs live side-by-side: `output/<client-or-run>/<vN>/` (`v1/`, `v2/`, …) — a re-run never
  overwrites a prior one.
- Every run output opens with a **run header**:
  ```
  <!-- run: v2 | date: 2026-06-15 | setup: v1 | input: ../01_intake/output/acme_lda/v2/ -->
  ```
  the date, which `setup/` version configured it, and which input run it consumed.
- **Commit per stage/run.** After a stage's output is reviewed, commit it; git history *is* the
  pipeline's version history (ICM §3.4).

## Provenance
Real outputs cite the reference that drove them — [`provenance-and-verify.md`](provenance-and-verify.md).

Related: [`readme-as-context.md`](readme-as-context.md) · [`review-gates.md`](review-gates.md) · [`building-a-workspace.md`](building-a-workspace.md)
