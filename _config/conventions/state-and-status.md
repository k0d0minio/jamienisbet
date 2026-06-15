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

## Retainer clients
`retainer: true` marks an ongoing relationship (Jamie has a live one). Retainers bill on a recurring
cadence rather than per-deal; finance and proposals treat them as a distinct path.

## The dashboard (generated)
[`state/`](../../state/) holds a generated `dashboard.md` — a script aggregates the front-matter
across the repo into the five metrics: **pipeline value, win rate, monthly revenue, tax reserve,
overdue receivables**. The dashboard is generated, never hand-edited; the front-matter is the source
of truth. (The generator script is built once real entity data exists.)

Related: [`client-and-slug.md`](client-and-slug.md) · [`macro-pipeline.md`](macro-pipeline.md)
