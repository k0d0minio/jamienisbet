# The Five Layers

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The canonical definition of the five ICM context layers and how this repo maps onto them.

ICM (see `icm.pdf`) structures all context into five layers. The principle: **at any moment an
agent loads only the layers a task needs**, so the context window stays small, focused, and
auditable. In this repo the layers map as follows.

| Layer | Question | Where it lives | Stability |
|---|---|---|---|
| **0** | Where am I? | root `CLAUDE.md` | identity — one file, rarely changes |
| **1** | Where do I go? | a folder's `README.md` (workspace / hub router) | stable |
| **2** | What do I do here? | a stage's `CONTEXT.md` (contract); `README.md` is its narrative | stable |
| **3** | What rules apply? | `_config/`, `shared/`, any `references/` | the factory — stable across runs |
| **4** | What am I working with? | any `output/` | the product — new every run |

## How a run uses the layers
A stage execution loads: **Layer 0** (always — identity/routing), the **Layer 1** router that led
here, this stage's **Layer 2** `CONTEXT.md`, the exact **Layer 3** references that contract names,
and the **Layer 4** output of the previous stage. Nothing else. That is the whole discipline.

## Layer 3 is split by reach
- **Global Layer 3** — `_config/` (brand, business facts, conventions) and `shared/` (clients,
  templates, knowledge): drawn on everywhere.
- **Local Layer 3** — a workspace's own `references/`: stable rules scoped to that one capability.

A reference is promoted from local to global (`shared/knowledge/`) only once a *second* workspace
needs it. Keep it local until then.

## Why layers, not one big prompt
Loading everything (the "monolithic" approach) produces a ~40k-token context that is mostly
irrelevant to the current step, and models degrade on long, unfocused context. Layered loading
keeps each step at ~2–8k focused tokens. [`stage-contracts.md`](stage-contracts.md) is the
mechanism that enforces it.

Related: [`readme-as-context.md`](readme-as-context.md) · [`stage-contracts.md`](stage-contracts.md)
