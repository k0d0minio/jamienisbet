# Admin Dashboard

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** Jamie's private internal control panel — pipeline, deals, invoices, and the five business metrics at a glance.

## What this folder accomplishes
A private Next.js (App Router) app, deployed on Vercel (auth-gated, Jamie-only), that surfaces the state of the business: the pipeline, open deals, project status, and receivables — the same numbers generated into [state/dashboard.md](../../state/README.md), but as a live UI. It reads, it does not write: it is a window onto the repo's per-entity front-matter, not a second source of truth. Skeleton only — intent, not code.

## How it connects to the architecture
- **Upstream / reads from:** the per-entity front-matter across [shared/clients/](../../shared/clients/), [projects/](../../projects/), and [workspaces/finance/](../../workspaces/finance/); the generated [state/](../../state/) dashboard.
- **Downstream / feeds:** Jamie (read-only views). It triggers no outbound action — drafting and sending stay in the workspaces behind a review gate.
- **Draws on (Layer 3 reference):** [_config/conventions/state-and-status.md](../../_config/conventions/state-and-status.md) (the data model), [_config/brand/visual/](../../_config/brand/visual/) (tokens).

## Contents
- `app/` — (planned) Next.js App Router pages: pipeline, clients, invoices, metrics.
- `theme.config` — (planned) imports brand tokens from `_config/brand/visual/`.

## Notes
- One job: show business state. It must stay read-only — to change a number, change the entity it comes from ([state-and-status.md](../../_config/conventions/state-and-status.md)), then it re-reads.
- Private / auth-gated; never exposed publicly. Stack intent: Next.js App Router on Vercel — skeleton only.
