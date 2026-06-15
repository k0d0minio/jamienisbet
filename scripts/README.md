# scripts/ — The Automation Layer

> **ICM role:** Layer 3 — reference (the mechanical half of ICM)
> **Purpose:** Deterministic, no-judgment automation the agent invokes as tools. The AI does the
> judgment; these do the moving-files / formatting / sending.

Convention: [`_config/conventions/scripts-and-integrations.md`](../_config/conventions/scripts-and-integrations.md).

## Rules
- **Bash** (portable, no runtime). Python only when bash gets genuinely unwieldy — say why in the header.
- **Invoked by the agent**, not by Jamie directly. Day-to-day driving is natural language.
- **Each script declares a tiny contract** in a header comment: `Inputs / Outputs / Side-effects /
  Invocation`. Same Inputs/Outputs discipline as a stage.
- **Outbound boundary:** no script sends/writes externally without a human-reviewed file **and** an
  explicit `--confirm`. Read-only is free; writes happen only after review.

## Index
- [`send-email.sh`](send-email.sh) — send an email via Resend from a reviewed body file.
  Dry-runs unless `--confirm` is passed. Reads `RESEND_API_KEY` from `.env`.
- [`new-client.sh`](new-client.sh) — scaffold `shared/clients/<slug>/` from `_template-client/`;
  derives the slug from a legal name and stops on a collision for human review.
- [`new-project.sh`](new-project.sh) — scaffold the docs-only `projects/<slug>/` from
  `_template-project/`; reminds you to create the external delivery repo (a separate reviewed step).

Finance (Stripe is the source of truth — these are **read-only** fetches; no committed ledgers):
- [`stripe-income.sh`](stripe-income.sh) — paid income for a period.
- [`stripe-receivables.sh`](stripe-receivables.sh) — open + overdue invoices.
- [`stripe-report.sh`](stripe-report.sh) — period summary: income, receivables, tax reserve.

Planned: `gen-dashboard.sh` — aggregate per-entity front-matter + the `stripe-report` figures into
[`state/dashboard.md`](../state/README.md).
