# jamienisbet — the operating system for one business

This repository runs the **entire business of Jamie Nisbet**, a software engineer / AI
consultant based in Mafra, Portugal. It is built so that an AI agent (Claude) can operate it
directly: the **folder structure is the architecture**, and every instruction lives in a plain
`README.md` file you can read and edit.

> Your original brief is preserved verbatim at
> [`_config/business/founder-brief.md`](_config/business/founder-brief.md). This README is the
> **map**; that file is the **intent**.

## Built on ICM (Interpretable Context Methodology)

Following the included paper (`icm.pdf`), the repo replaces orchestration code with folders and
markdown. Numbered folders are workflow stages; each stage does **one job**, reads only the
context it needs, and writes a plain-text **output** you review before the next stage runs.
Nothing is hidden — you can open any folder and see exactly what the agent will do and what it
produced. Five context layers run the whole system:

- **Layer 0 — [`CLAUDE.md`](CLAUDE.md):** the agent's identity & routing ("where am I?").
- **Layer 1 — a folder's `README.md`:** routes you to the right stage ("where do I go?").
- **Layer 2 — a stage's `CONTEXT.md`:** the contract — Inputs / Process / Outputs / Integrations / Verify / Review gate (the `README.md` is its narrative).
- **Layer 3 — `_config/`, `shared/`, `references/`:** stable reference (brand, templates, rules) — *the factory*.
- **Layer 4 — `output/`:** per-run deliverables — *the product*.

## The map

```text
jamienisbet/
├── CLAUDE.md            Layer 0 — agent identity & routing (read first)
├── README.md           you are here — the human master map
├── suggestions.md      ideas to make this repo more valuable
│
├── _config/            THE FACTORY (global Layer 3 — stable, drawn on everywhere)
│   ├── brand/          single source of truth: visual/ · voice/ · assets/
│   ├── business/       legal-entity facts, NIF/VAT, IBAN, rates + founder-brief.md
│   └── conventions/    the ICM protocol localised to this repo
│
├── shared/             cross-workspace Layer 3
│   ├── clients/        lightweight CRM — one record per client, shared by all workspaces
│   ├── templates/      master proposal / quote / contract / work-order / invoice / email
│   └── knowledge/      reusable playbooks, case studies, snippets
│
├── workspaces/         REUSABLE BUSINESS CAPABILITIES (run again and again)
│   ├── legal-and-tax/      ① set up the PT entity + reduce tax legally + compliance calendar
│   ├── proposals/          ★ flagship: deep intake → negotiation coach → proposal→quote→contract→invoice
│   ├── lead-generation/    marketing, sales, and the local-affiliate (10%) program
│   ├── project-triage/     fast go/no-go + on-the-fly structured customer feedback
│   ├── finance/            bookkeeping-lite, invoice tracking, tax reserve
│   └── _template-workspace/  copy this to create a new capability
│
├── projects/           PER-CLIENT DELIVERY DOCS (docs-only; the build lives in the client's own external repo)
├── websites/           Jamie's own apps: portfolio/ · payment-gateway/ · admin-dashboard/ · sellers-site/
├── packages/           SHARED CODE for every website — ui/ = @jamie-nisbet/ui (design system: tokens, components, assets)
├── tracker/            STANDALONE business-only daily todos + morning brief & weekly review
├── scripts/            the automation layer (bash): new-client · new-project · send-email
└── state/              generated dashboard: pipeline value · win rate · revenue · tax reserve · receivables
```

## How the pieces work together

1. **Find work** in `lead-generation/` (incl. the affiliate program + the public `sellers-site/`).
2. **Qualify it** fast in `project-triage/` — worth your time? better solution out there? On a go, a
   `shared/clients/<slug>/` record is created (`scripts/new-client.sh`); hand the customer structured
   feedback on the spot.
3. **Close it** in `proposals/` — the flagship: it asks you exhaustive questions, then coaches the
   negotiation to lift your rate, and generates the proposal, quote and contract on-brand.
4. **Deliver it** via `scripts/new-project.sh` → a docs-only `projects/<slug>/` pipeline that tracks
   the build; the build itself runs in the client's **own external repo**.
5. **Get paid & stay compliant** via `finance/` and `legal-and-tax/`, whose deadlines surface every
   morning in `tracker/`.

Brand identity from [`_config/brand/`](_config/brand/) flows into every website and every document,
so everything looks and sounds like one business.

## Status

**Foundation built (Pass 1).** The ICM protocol is now real: the
[`_config/conventions/`](_config/conventions/) docs, the [`scripts/`](scripts/) automation layer, the
[`state/`](state/) model, and a machine-loadable `CONTEXT.md` contract in every stage. The structural
decisions are settled — `projects/` is docs-only (client builds live in external repos), `websites/`
hosts Jamie's own apps, `tracker/` is business-only. **Still to come (later passes):** brand identity,
each workspace's `setup/` + `references/` content, and making `legal-and-tax` runnable first.
Decisions are recorded in [`brainstorm.md`](brainstorm.md) and
[`_config/conventions/decisions.md`](_config/conventions/decisions.md).

## Important

Legal, tax, and financial features in this repo are **decision-support, not professional advice**.
Anything they produce should be reviewed by a licensed Portuguese *contabilista certificado* /
lawyer before you act on it.

— Start at [`CLAUDE.md`](CLAUDE.md) · ideas in [`suggestions.md`](suggestions.md)
