# Building a Workspace

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** How to create a new business capability — by copying a folder, never by writing orchestration code.

The business scales by **copying folders, not writing code**. A new capability is a new workspace.

## Steps
1. **Copy the seed:** `workspaces/_template-workspace/` → `workspaces/<new-name>/` (lowercase,
   snake_case).
2. **Configure the factory once:** fill `setup/questionnaire.md` — the one-time config this
   capability needs (rates, rubric weights, tone, thresholds). Principle 5.
3. **Define the stages:** rename/renumber `stages/01_stage` → real stages (`01_intake`,
   `02_draft`, …). Each stage gets:
   - a `README.md` (human narrative),
   - a `CONTEXT.md` (the contract — schema in [`stage-contracts.md`](stage-contracts.md)),
   - an `output/` folder.
   Stage N's `output/` is stage N+1's input. One stage = one job.
4. **Fill `references/`:** the stable Layer-3 rules this capability uses (rubrics, playbooks, voice
   notes). Keep them local; promote to `shared/knowledge/` only when a second workspace needs them.
5. **Update the router:** edit the workspace `README.md` so it lists the real stages in execution
   order.
6. **Validate** against the checklist in [`model-and-scaling.md`](model-and-scaling.md) before the
   first real run.

## Inserting / reordering stages
Use a letter suffix to insert (`02a_design/`) so you don't renumber the chain. Reordering means a
find-replace of cross-references — see [`stage-contracts.md`](stage-contracts.md).

## When is it a new workspace vs a stage?
Rule of thumb: **own `setup/` + ≥3 stages + runs independently → new workspace.** Otherwise it's a
stage inside an existing one. Full rule in [`model-and-scaling.md`](model-and-scaling.md).

## Per-client delivery is different
A *workspace* is a reusable capability (run many times). A client *delivery* is a one-off: copy
`projects/_template-project/` → `projects/<slug>/` (docs-only — the build/delivery code lives in
the client's own external repo). See [`client-and-slug.md`](client-and-slug.md) and
[`macro-pipeline.md`](macro-pipeline.md).

Related: [`the-five-layers.md`](the-five-layers.md) · [`readme-as-context.md`](readme-as-context.md)
