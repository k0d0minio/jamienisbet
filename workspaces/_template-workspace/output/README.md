# Output — Workspace Deliverable (Layer 4)

> **ICM role:** Layer 4 — working artifacts
> **Purpose:** Hold the per-run deliverable this capability produces — the finished product of one pass through the stages.

## What this folder accomplishes
This is where the meal is served. The final stage rolls its result up here, giving each run a single, plain-text deliverable a human can open, review, and hand off. Contents change every run — that's what makes this Layer 4 (working), in contrast to `setup/` and `references/` (Layer 3, stable). In the empty seed this folder is a placeholder; once the workspace runs, dated or named deliverables appear here.

## How it connects to the architecture
- **Upstream / reads from:** the final stage in [`../stages/`](../stages/) (whichever has the highest number) writes here.
- **Downstream / feeds:** typically the client record in Neon `biz.clients` (via the admin dashboard), or the client's external delivery repo; some capabilities feed a hosted site under [`websites/`](../../../websites/).
- **Draws on (Layer 3 reference):** indirectly — the deliverable inherits brand/voice from [`_config/brand/`](../../../_config/brand/) and structure from [`shared/templates/`](../../../shared/templates/) via the stages that produced it.

## Contents
- `<run-name-or-date>.md` — *(produced per run, do not pre-create)* the finished deliverable for one pass.

## Notes
Every output is an edit surface (Principle 4): the human reviews and edits files here before they're sent or promoted downstream. Keep this folder as plain markdown — no hidden state (Principle 2). Consider naming runs by date or client (e.g. `2026-06-15-acme.md`) so the history reads cleanly. If a deliverable contains legal, tax, or financial content, it is decision-support only and requires review by a licensed Portuguese contabilista certificado / lawyer before use.
