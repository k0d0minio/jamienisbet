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
- **Layer 2 — a stage's `README.md`:** the stage contract — Inputs / Process / Outputs / Verify.
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
├── projects/           ONE ICM PIPELINE PER CLIENT (copy _template-project/ per lead)
├── websites/           hosted sites: portfolio/ · personal/ · clients/ (all brand-driven)
└── tracker/            STANDALONE daily todo + morning routine (business + personal, walled off)
```

## How the pieces work together

1. **Find work** in `lead-generation/` (incl. the affiliate program) → leads land in `shared/clients/`.
2. **Qualify it** fast in `project-triage/` — worth your time? better solution out there? Hand the
   customer structured feedback on the spot.
3. **Close it** in `proposals/` — the flagship: it asks you exhaustive questions, then coaches the
   negotiation to lift your rate, and generates the proposal, quote and contract on-brand.
4. **Deliver it** by copying `projects/_template-project/` into a per-client pipeline; client sites
   live in `websites/`.
5. **Get paid & stay compliant** via `finance/` and `legal-and-tax/`, whose deadlines surface every
   morning in `tracker/`.

Brand identity from [`_config/brand/`](_config/brand/) flows into every website and every document,
so everything looks and sounds like one business.

## Status

This is the **architecture skeleton**: every folder exists and is documented with a detailed
`README.md` describing what it does and how it connects. No business content, code, or assets have
been built yet — each README describes what *will* live there. Build a capability by opening its
workspace and filling in `setup/` and the stage contracts.

## Important

Legal, tax, and financial features in this repo are **decision-support, not professional advice**.
Anything they produce should be reviewed by a licensed Portuguese *contabilista certificado* /
lawyer before you act on it.

— Start at [`CLAUDE.md`](CLAUDE.md) · ideas in [`suggestions.md`](suggestions.md)
