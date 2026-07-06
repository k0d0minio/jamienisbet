# Client Slug & Per-Client Footprint

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** One identifier that threads a client across the repo, and a clear rule for what
> client data lives here vs in the client's own repo.

## Where the client record lives
The canonical client record is a row in the Neon `biz.clients` table, worked through the admin
dashboard — **not** a folder in this repo. See [`state-and-status.md`](state-and-status.md). This
repo holds no client records.

## The slug
- Format: lowercase `snake_case`, derived from the client's name
  (e.g. *Acme, Lda.* → `acme_lda`).
- Derived by the admin (`clientSlug` in
  [`websites/admin-dashboard/lib/github.ts`](../../websites/admin-dashboard/lib/github.ts)) — used to
  **suggest a delivery-repo name** and to key the docs-only `projects/<slug>/` folder, so the same
  identifier traces a client across the repo consistently.

## Per-client footprint (what lives where)
This repo is **private, for Jamie only** — it is never handed to clients. The client's footprint
here is deliberately minimal:

- **The Neon `biz.*` schema** — the client, its deals, and every generated document (the working
  record, operated from the admin dashboard).
- **`projects/<slug>/`** — delivery **docs only**: scope, milestones, acceptance, finances.
  **No delivery code.**
- **The client's own external repo** — the actual build, with its own ICM pipeline tailored to that
  client. Anything shared *with* the client lives there, not here. The admin stores a pointer to it
  on the client row (`clients.github_repo`).

## Secrets vs facts
A client's NIF/VAT and agreed rate are business facts; nothing about a client is a credential.
Credentials never touch the repo — see [`governance.md`](governance.md).

Related: [`state-and-status.md`](state-and-status.md) · [`macro-pipeline.md`](macro-pipeline.md)
