# State & Status

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** One machine-readable way to know where every lead, deal, project, and invoice stands — without crawling the whole repo.

State is **per-entity YAML front-matter** on the markdown file that owns the entity. Plain text,
human-editable, git-diffable. No database.

## Front-matter schema
Every tracked entity opens with front-matter:

```
---
slug: acme_lda          # the client slug (see client-and-slug.md)
type: client            # client | deal | project | invoice
status: qualified       # see status sets below
retainer: false         # true for ongoing-retainer relationships
value: 4800             # EUR; expected or agreed value (0 if n/a)
created: 2026-06-15
updated: 2026-06-15
external_repo: none      # url of the client's delivery repo, or none
---
```

Where each entity's front-matter lives:
- **client / deal** → `shared/clients/<slug>/profile.md` and `deals.md`
- **project** → `projects/<slug>/scope.md`
- **invoice** → the invoice record in `workspaces/finance/` ledgers

## Status sets (the only allowed values)
- **lead / deal:** `new` → `qualified` → `proposed` → `won` | `lost`
- **project:** `discovery` → `build` → `delivery` → `closed`
- **invoice:** `draft` → `sent` → `paid` | `overdue`

## The admin dashboard's live store (Neon) and how it maps
The admin dashboard ([`websites/admin-dashboard/`](../../websites/admin-dashboard/)) runs the
pipeline **live** against Neon Postgres (`biz` schema) and syncs approved artifacts back into
these folders (see below). Two extra status sets exist there, and they map onto the sets above:

- **`biz.clients.status`** (relationship summary): `new → contacted → qualified → proposed →
  won → delivered | lost`. This is the *client* relationship; `contacted` and `delivered` are
  dashboard-only refinements with no front-matter equivalent (`contacted` folds into `new`,
  `delivered` into `won` when written as front-matter).
- **`biz.deals.status`** (per-opportunity): exactly the lead/deal set above —
  `new → qualified → proposed → won | lost`. One client can carry several deals.
- **`biz.documents.status`** (review gate): `draft → in_review → approved | rejected`. This is
  the ICM review gate as data — an AI-generated document is a Layer-4 draft until Jamie
  approves it, and **only approved documents** feed anything downstream (dependent
  generators, the Stripe draft invoice, export, repo sync-back).

**Repo sync-back:** on approval the dashboard commits the artifact into the ICM folders
(stage-owned kinds to their `workspaces/*/stages/*/output/` home, dashboard-native kinds to
`shared/clients/<slug>/documents/`), so the repo stays the canonical business record and
agent runs and dashboard runs stay interoperable. Neon is the live working store; git is the
reviewed record.

## Retainer clients
`retainer: true` marks an ongoing relationship (Jamie has a live one). Retainers bill on a recurring
cadence rather than per-deal; finance and proposals treat them as a distinct path.

## The dashboard (generated)
[`state/`](../../state/) holds a generated `dashboard.md` — a script aggregates the front-matter
across the repo into the five metrics: **pipeline value, win rate, monthly revenue, tax reserve,
overdue receivables**. The dashboard is generated, never hand-edited; the front-matter is the source
of truth. (The generator script is built once real entity data exists.)

Related: [`client-and-slug.md`](client-and-slug.md) · [`macro-pipeline.md`](macro-pipeline.md)
