# Proposals — Output (Per-Deal Runs)

> **ICM role:** Layer 4 — working
> **Purpose:** Hold one self-contained folder per deal, accumulating that deal's artifacts as it moves through the pipeline.

## What this folder accomplishes
Every live deal gets its own folder here, named for the client — `output/<client>/`. As the deal advances, the artifacts from each stage collect in that folder: the deal dossier, the leverage map, the negotiation strategy and talk-track, the proposal, the quote, the contract, and the closing invoice. This is the product, not the factory — content that changes on every run. A closed deal's folder stays as the permanent record of how that deal was won.

## How it connects to the architecture
- **Upstream / reads from:** each stage's own `output/` in [`../stages/`](../stages/) (stage N writes here, becomes input to stage N+1)
- **Downstream / feeds:** Stripe invoicing via the dashboard (on invoice); the client's external delivery repo once signed; the deal record in Neon `biz.deals` (deal status)
- **Draws on (Layer 3 reference):** none directly — this is pure Layer 4 working content produced by the stages

## Contents
- `<client>/` — planned per deal: `deal-dossier.md`, `leverage-map.md`, `negotiation-strategy.md`, `proposal.md`, `quote.md`, `contract.md`, `invoice.md`. Created per run by the stages; do not pre-create.

## Notes
One folder per deal keeps runs isolated and reviewable (Principle 4 — every output is an edit surface). Use a consistent client slug matching the `biz.clients` record. Any financial or contractual file here is decision-support and must be confirmed by a licensed Portuguese contabilista certificado / lawyer before it is acted on.
