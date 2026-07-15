# Workspaces — Business-Capability Pipelines

> **ICM role:** Layer 1 — router ("Where do I go?"). This folder is the hub for every
> reusable business *capability*. Each subfolder is a self-contained ICM workspace: a
> numbered, human-reviewed pipeline that does one job and can run again and again.

## What this folder accomplishes
A **workspace** is a permanent capability of the business — the machinery that produces a
recurring kind of deliverable. You configure it once (`setup/`) and then run it whenever you
need its output. Workspaces are the "factory"; the things they produce are the "product."

Client delivery is deliberately different: it lives in the client's own external repo (seeded by
the admin dashboard), not here. A workspace is the reusable mould; a delivery is one casting.

## The workspaces
| Workspace | What it does | Priority |
|---|---|---|
| [`legal-and-tax/`](legal-and-tax/) | Set up the Portuguese legal entity and optimise tax legally; emits a compliance calendar. | **First — founder's #1 priority** |
| [`proposals/`](proposals/) | **Flagship.** Exhaustive deal intake → negotiation coaching → proposal → quote → contract → invoice, focused on closing at a higher rate. | High |
| [`lead-generation/`](lead-generation/) | Marketing, sales and the local-affiliate (10%) referral program. | High |
| [`project-triage/`](project-triage/) | Fast portfolio-level go/no-go and on-the-fly structured customer feedback. | Medium |
| [`finance/`](finance/) | Lightweight bookkeeping, invoice tracking and tax-reserve calculation. | Medium |
| [`_template-workspace/`](_template-workspace/) | The blank workspace-builder seed. **Copy it to create a new capability.** | Scaffolding |

## How a workspace runs (the ICM loop)
1. Read the workspace's `README.md` (its Layer 1 router).
2. Configure once via `setup/` (the "configure the factory, not the product" principle).
3. Walk `stages/NN_name/` **in numerical order**. For each stage: read its `CONTEXT.md`
   (the Layer 2 stage contract; `README.md` is the human narrative), load **only** the Inputs it
   names, do the Process, write the result to that stage's `output/`.
4. **Stop at every `output/` for the human review gate** before the next stage runs.

## How it connects to the architecture
- **Draws on (Layer 3):** [`../_config/`](../_config/) (brand, business facts, conventions) and
  [`../shared/`](../shared/) (document templates).
- **Feeds:** the admin dashboard's AI pipeline (which loads these contracts via
  [`packages/icm`](../packages/icm/)), the client's external delivery repo (a closed deal), and
  the dashboard's daily brief (deadlines and todos).
- **Governed by:** [`../_config/conventions/`](../_config/conventions/) — the ICM protocol for this repo.

## Adding a new capability
Copy [`_template-workspace/`](_template-workspace/) to `workspaces/<your-capability>/`, rename
its stages, and fill in the stage contracts. No code, no deploy step — a new capability is a new
folder. That is how this repo scales over the long term.
