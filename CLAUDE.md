# CLAUDE.md — Layer 0: Repository Identity & Routing

> **ICM role:** Layer 0 — identity ("Where am I?"). This is the **first file any Claude
> routine reads.** It says what this repo is, how it is organised, and where to go for a
> given task. Keep it short; detail lives in each folder's own `README.md`.

## What this repo is
This is the single Git repository that runs the entire business of **Jamie Nisbet** — a
software engineer / AI consultant based in **Mafra, Portugal**. Lead generation today is
networking and word of mouth. The repo is operated by Claude agent routines, so the
**folder structure *is* the application architecture.** There is no orchestration code:
numbered folders and plain-text `README.md` files carry the instructions, and an agent does
the work by reading the right files at the right moment. Local scripts (added later) handle
the mechanical parts that need no AI.

## The method: ICM (Interpretable Context Methodology)
Everything here follows the ICM paper (`icm.pdf`). The five context layers:

| Layer | File / location | Question it answers |
|---|---|---|
| **0** | this `CLAUDE.md` | Where am I? |
| **1** | a folder's `README.md` (workspace / hub) | Where do I go? |
| **2** | a stage's `README.md` (the stage contract) | What do I do *here*? |
| **3** | `_config/`, `shared/`, any `references/` | What rules apply? (stable — the factory) |
| **4** | any `output/` | What am I working with? (per-run — the product) |

**Convention:** in this repo each folder's `README.md` *is* its ICM context file — a workspace
README is its Layer-1 router, a stage README is its Layer-2 contract. This `CLAUDE.md` is the
only separate Layer-0 file.

Five principles, always: **one stage = one job** · **plain text is the interface** ·
**load only the context the stage needs** · **every output is a human edit/review surface** ·
**configure the factory once, then run it.**

## Routing — "if the task is… → go to…"
| The task | Go to |
|---|---|
| Set up the PT business entity / reduce tax / compliance dates | [`workspaces/legal-and-tax/`](workspaces/legal-and-tax/) |
| Win a deal: intake, negotiation strategy, proposal, quote, contract, invoice | [`workspaces/proposals/`](workspaces/proposals/) |
| Find/sell work, run the local-affiliate program, outreach | [`workspaces/lead-generation/`](workspaces/lead-generation/) |
| Decide if a project is worth it / give a customer fast structured feedback | [`workspaces/project-triage/`](workspaces/project-triage/) |
| Track income, expenses, invoices, tax reserve | [`workspaces/finance/`](workspaces/finance/) |
| Deliver a specific client engagement | [`projects/`](projects/) (copy `_template-project/`) |
| Build/host a website (portfolio, personal, client) | [`websites/`](websites/) |
| Daily todos / the every-morning routine (business **and** personal) | [`tracker/`](tracker/) |
| Brand colours, voice, logos, business facts | [`_config/`](_config/) |
| Shared client records, document templates, playbooks | [`shared/`](shared/) |
| Create a brand-new capability | copy [`workspaces/_template-workspace/`](workspaces/_template-workspace/) |

## How to run any workspace
1. Read the workspace `README.md` (Layer 1). 2. Configure once via its `setup/`.
3. Walk `stages/NN_*` in order; per stage read its `README.md`, load only its named Inputs,
do the Process, write to `output/`. 4. **Pause at each `output/` for human review before continuing.**

## Standing rules (do not break these)
- **Brand is one source of truth.** All visual identity comes from
  [`_config/brand/visual/`](_config/brand/visual/) and all copy tone from
  [`_config/brand/voice/`](_config/brand/voice/). Websites and every official document pull from there.
- **Legal / tax / financial output is decision-support only.** Never assert tax figures or legal
  conclusions as fact; always note that outputs need review by a licensed Portuguese
  *contabilista certificado* / lawyer.
- **`tracker/` is standalone and privacy-walled.** Business data may be *read* into the morning
  brief, but personal items must **never** flow into any business deliverable.
- **Fix the source, not the symptom.** When a run's output is repeatedly wrong, edit the Layer-3
  reference (template, voice, rubric) so every future run improves — don't just patch the one output.
- The original intent of this repo lives in
  [`_config/business/founder-brief.md`](_config/business/founder-brief.md). Re-read it when unsure.
- Full protocol: [`_config/conventions/`](_config/conventions/).
