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
the work by reading the right files at the right moment. Local scripts in [`scripts/`](scripts/)
handle the mechanical parts that need no AI; business state lives in **one** store — the Neon
`biz.*` schema — operated through the admin dashboard, never mirrored into the repo.

## The method: ICM (Interpretable Context Methodology)
Everything here follows the ICM paper (`icm.pdf`). The five context layers:

| Layer | File / location | Question it answers |
|---|---|---|
| **0** | this `CLAUDE.md` | Where am I? |
| **1** | a folder's `README.md` (workspace / hub) | Where do I go? |
| **2** | a stage's `CONTEXT.md` (contract); `README.md` is narrative | What do I do *here*? |
| **3** | `_config/`, `shared/`, any `references/` | What rules apply? (stable — the factory) |
| **4** | any `output/` | What am I working with? (per-run — the product) |

**Convention:** each folder's `README.md` is its human narrative + router. At **stage** level the
strict Layer-2 contract lives in a sibling `CONTEXT.md` (Inputs / Process / Outputs / Integrations /
Verify / Review gate); the `README.md` stays narrative. This `CLAUDE.md` is the only separate
Layer-0 file. See [`_config/conventions/readme-as-context.md`](_config/conventions/readme-as-context.md).

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
| Deliver a client engagement (docs-only; build lives in the client's external repo) | [`projects/`](projects/) (`scripts/new-project.sh`) |
| Build/host one of Jamie's own web apps (portfolio, payment gateway, admin dashboard, sellers site) | [`websites/`](websites/) |
| Use/extend shared code across every website (design system / UI components, future services) | [`packages/`](packages/) (`packages/ui` = `@jamie-nisbet/ui`) |
| Daily business todos / the morning brief + weekly review | [`tracker/`](tracker/) |
| Run a mechanical action (new client/project, send a reviewed email) | [`scripts/`](scripts/) |
| See where the business stands (pipeline, metrics) | the admin dashboard ([`websites/admin-dashboard/`](websites/admin-dashboard/)) |
| Brand colours, voice, logos, business facts | [`_config/`](_config/) |
| Shared document templates, playbooks | [`shared/`](shared/) |
| Create a brand-new capability | copy [`workspaces/_template-workspace/`](workspaces/_template-workspace/) |

## How to run any workspace
1. Read the workspace `README.md` (Layer 1). 2. Configure once via its `setup/`.
3. Walk `stages/NN_*` in order; per stage read its `CONTEXT.md`, load only its named Inputs,
do the Process, write to `output/`. 4. **Pause at each `output/` for human review before continuing.**

## Standing rules (do not break these)
- **Brand is one source of truth.** All visual identity is defined in
  [`_config/brand/visual/`](_config/brand/visual/) (the contract) and implemented in code by
  [`packages/ui`](packages/ui/) (`@jamie-nisbet/ui` — tokens + components + assets); all copy
  tone comes from [`_config/brand/voice/`](_config/brand/voice/). Websites consume the package
  and every official document pulls from there. Change the package tokens and the brand docs
  together — never fork them per site.
- **Legal / tax / financial output is decision-support only.** Never assert tax figures or legal
  conclusions as fact; always note that outputs need review by a licensed Portuguese
  *contabilista certificado* / lawyer.
- **No outbound action without review.** No email sent, payment captured, or repo created without a
  human-reviewed `output/` file first — see [`_config/conventions/scripts-and-integrations.md`](_config/conventions/scripts-and-integrations.md).
- **`tracker/` is a standalone business-only daily hub.** It reads business state read-only and never
  writes back upstream.
- **Fix the source, not the symptom.** When a run's output is repeatedly wrong, edit the Layer-3
  reference (template, voice, rubric) so every future run improves — don't just patch the one output.
- The original intent of this repo lives in
  [`_config/business/founder-brief.md`](_config/business/founder-brief.md). Re-read it when unsure.
- Full protocol: [`_config/conventions/`](_config/conventions/).
