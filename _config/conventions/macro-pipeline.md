# The Macro-Pipeline — how a client flows across workspaces

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The pipeline-of-pipelines: which workspace hands off to which, what triggers it, and what file is the baton.

Each workspace is its own ICM pipeline. This is how they chain into the business as a whole.

```
lead-generation → project-triage → proposals → projects → finance
                 (the Neon biz.* schema is the spine through all of them)
```

| From | Trigger | Baton (passed) | To |
|---|---|---|---|
| `lead-generation` | a lead is sourced (networking, affiliate, partner) | lead details | `project-triage` |
| `project-triage` | lead **qualified** (go) | the `biz.clients` / `biz.deals` rows in the admin | `proposals` |
| `proposals` | deal **won** | agreed scope + rate (the approved proposal) | `projects/<slug>/` (copy `_template-project/`) |
| `projects` | milestone / final acceptance | accepted deliverable | `finance` |
| `finance` | invoice paid | income event → tax reserve (live in Stripe) | — |

## Two rules that fall out of this
- **The client is qualified at the `triage → proposals` boundary**, not at first contact. Before
  that, a lead is just an entry in `lead-generation`. The client and its deals live as rows in the
  Neon `biz.*` schema, worked through the admin dashboard.
- **`project-triage` runs in two modes:** (a) the **gate before proposals** (qualify, then pitch),
  and (b) **standalone fast-feedback** — give a customer a 5-minute structured opinion on the spot
  without opening a full pipeline. Same stages, different exit.

## The spine
The Neon `biz.*` schema is the single source of truth every leg reads and writes, so all of them
see one consistent view of the client — there is no repo mirror. See
[`state-and-status.md`](state-and-status.md).

## Where this runs: the admin dashboard is the runtime
The triage → proposals leg of this pipeline **executes inside the admin dashboard**
([`websites/admin-dashboard/`](../../websites/admin-dashboard/)), driven by
[`@jamie-nisbet/icm`](../../packages/icm/). The workspace stage contracts and their `references/`
are the **specification** — the Layer-3 context each generation loads; the admin is the **execution
engine** that runs them against a real deal and holds each draft at its `documents.status` review
gate. Approval flips that status in the database and nothing else — there is no write-back to git.
So a workspace like `proposals/` is not run stage-by-stage by hand — it is the source of truth for
*how* each document is produced, and the runtime reads it. The document kinds the runtime produces
(`triage`, `pitch`, `negotiation`, `proposal`, `contract`) map onto these stage contracts; `quote`
and `invoice` are not documents — the deal's payment schedule is the quote and Stripe is the invoice.

Related: [`state-and-status.md`](state-and-status.md) · [`building-a-workspace.md`](building-a-workspace.md) · [`packages/icm/README.md`](../../packages/icm/README.md)
