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
│
├── _config/            THE FACTORY (global Layer 3 — stable, drawn on everywhere)
│   ├── brand/          single source of truth: visual/ · voice/ · assets/
│   ├── business/       legal-entity facts, NIF/VAT, IBAN, rates + founder-brief.md
│   └── conventions/    the ICM protocol localised to this repo
│
├── shared/             cross-workspace Layer 3
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
├── websites/           Jamie's own apps: portfolio/ · payment-gateway/ · admin-dashboard/ · sellers-site/
├── packages/           SHARED CODE for every website — ui/ = @jamie-nisbet/ui (design system: tokens, components, assets)
└── scripts/            the automation layer (bash): send-email · stripe fetchers
```

**Where the business stands** — clients, deals, pipeline and metrics — lives in the
[admin dashboard](websites/admin-dashboard/). Business state (clients, deals, documents, statuses)
lives in **one** store, the Neon `biz.*` schema operated through that dashboard; the repo holds no
pipeline state and nothing is mirrored back into git.

## How the pieces work together

1. **Find work** in `lead-generation/` (incl. the affiliate program + the public `sellers-site/`).
2. **Qualify it** fast in `project-triage/` — worth your time? better solution out there? On a go,
   the client and its deal are worked as rows in the Neon `biz.*` schema through the admin
   dashboard; hand the customer structured feedback on the spot.
3. **Close it** in `proposals/` — the flagship: it asks you exhaustive questions, then coaches the
   negotiation to lift your rate, and generates the proposal, quote and contract on-brand.
4. **Deliver it** in the client's **own external repo** — created and seeded with the delivery-stage
   docs (`shared/templates/delivery/`) from the deal's onboarding checklist in the admin dashboard.
5. **Get paid & stay compliant** via the dashboard (`/finances`, `/invoices`) and `legal-and-tax/`,
   whose deadlines surface every morning on the dashboard's `/today` page.

Brand identity from [`_config/brand/`](_config/brand/) flows into every website and every document,
so everything looks and sounds like one business.

## Status

**Foundation built (Pass 1).** The ICM protocol is now real: the
[`_config/conventions/`](_config/conventions/) docs, the [`scripts/`](scripts/) automation layer, and
a machine-loadable `CONTEXT.md` contract in every stage. The structural decisions are settled —
business state lives in **one** store (the Neon `biz.*` schema, run from the admin dashboard),
client delivery (code + docs) lives in each client's external repo, `websites/` hosts Jamie's own apps,
Daily todos live on the dashboard's `/today` page. **Still to come (later passes):** brand identity, each workspace's
`setup/` + `references/` content, and making `legal-and-tax` runnable first.
Decisions are recorded in [`_config/conventions/decisions.md`](_config/conventions/decisions.md).

## Important

Legal, tax, and financial features in this repo are **decision-support, not professional advice**.
Anything they produce should be reviewed by a licensed Portuguese *contabilista certificado* /
lawyer before you act on it.

— Start at [`CLAUDE.md`](CLAUDE.md)
