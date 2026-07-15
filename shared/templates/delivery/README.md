# Delivery Templates — the seed for a client's repo

> **ICM role:** Layer 3 — reference (templates)
> **Purpose:** The three delivery-stage documents the admin dashboard seeds into a client's
> external repo when a deal is won, so every engagement starts with the same
> discovery → build → delivery discipline.

## The seeding contract
When a deal is marked **won** in the admin dashboard, the onboarding checklist offers
"create + seed the delivery repo". That action creates (or uses) the client's GitHub repo
recorded on their `biz.clients` row and commits these three files into it as:

- `docs/icm/01_discovery.md`
- `docs/icm/02_build.md`
- `docs/icm/03_delivery.md`

The templates are written to stand alone in the *client's* repo: they reference the signed
proposal and the dashboard, never this repo's internal paths. Seeding is idempotent — a file
that already exists in the client repo is left untouched.

## Editing
These are the Layer-3 source (fix the source, not the symptom): edit here and every future
seeded engagement improves. Already-seeded repos are the client's working copies and are not
retro-updated.

## Rules
Delivery **code and docs both live in the client's repo** — this repo holds no per-client
delivery record (see the dashboard-first reversal in
[`_config/conventions/decisions.md`](../../../_config/conventions/decisions.md)). Any commercial
change mid-delivery (rate, timeline, scope) routes back through the deal in the dashboard —
never patched silently in the delivery docs.
