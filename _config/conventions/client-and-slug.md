# Client Slug & Per-Client Footprint

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** One identifier that threads a client across the whole repo, and a clear rule for what client data lives here vs in the client's own repo.

## The slug
- Format: lowercase `snake_case`, derived from the client's **legal name**
  (e.g. *Acme, Lda.* → `acme_lda`).
- **Assigned by `new-client.sh`** — never hand-coined, so it is consistent everywhere.
- **Collisions** (two similar names, a rebrand): the script surfaces the clash and **stops for human
  review** rather than guessing a suffix.
- The same slug is used everywhere the client appears, so an agent can trace one client end-to-end.

## Per-client footprint (what lives where)
This repo is **private, for Jamie only** — it is never handed to clients. So the client's footprint
here is deliberately minimal:

- **`shared/clients/<slug>/`** — the canonical record: `profile.md` (identity + front-matter),
  `history.md` (interaction log), `deals.md` (opportunities + status), `scope.md` (agreed scope),
  `finances.md` (billed / paid), `repo-link.md` (pointer to the external delivery repo).
- **`projects/<slug>/`** — delivery **docs only**: scope, milestones, acceptance, finances.
  **No delivery code.**
- **The client's own external repo** — the actual build, with its own ICM pipeline tailored to that
  client. Anything shared *with* the client lives there, not here.

Created **only once a lead is qualified** (not at first contact) — see
[`macro-pipeline.md`](macro-pipeline.md).

## Secrets vs facts
A client's NIF/VAT and agreed rate are business facts and may live in plaintext here; nothing in a
client folder is a credential. Credentials never touch client folders — see
[`governance.md`](governance.md).

Related: [`state-and-status.md`](state-and-status.md) · [`macro-pipeline.md`](macro-pipeline.md)
