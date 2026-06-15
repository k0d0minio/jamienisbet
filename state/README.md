# state/ — The Generated Dashboard

> **ICM role:** Layer 4 — generated artifact (read-only surface)
> **Purpose:** One place to see where the whole business stands, aggregated from per-entity front-matter across the repo.

`dashboard.md` here is **generated, never hand-edited.** The source of truth is the YAML
front-matter on each entity (client, deal, project, invoice) — schema in
[`_config/conventions/state-and-status.md`](../_config/conventions/state-and-status.md). A script
(`scripts/gen-dashboard.sh`, built once real entity data exists) reads that front-matter and writes
the five metrics here:

- **Pipeline value** — sum of open deal `value` (status `new` | `qualified` | `proposed`).
- **Win rate** — `won` / (`won` + `lost`).
- **Monthly revenue** — paid invoices in the current month.
- **Tax reserve** — accumulated reserve from `workspaces/finance/03_tax_reserve`.
- **Overdue receivables** — invoices with status `overdue`.

## Contents
- `dashboard.md` — *(generated; planned until entity data exists)* the at-a-glance metrics + lists.

## Notes
This is a read-only convenience surface. To change a number, change the entity it comes from, then
regenerate — never edit `dashboard.md` directly. The tracker's morning brief and Friday review read
this. Generating it is a read-only scan, so it may run without a review gate
([`_config/conventions/review-gates.md`](../_config/conventions/review-gates.md)).
