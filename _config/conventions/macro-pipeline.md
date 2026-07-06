# The Macro-Pipeline — how a client flows across workspaces

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The pipeline-of-pipelines: which workspace hands off to which, what triggers it, and what file is the baton.

Each workspace is its own ICM pipeline. This is how they chain into the business as a whole.

```
lead-generation → project-triage → proposals → projects → finance
                 (shared/clients/ is the spine through all of them)
```

| From | Trigger | Baton (file passed) | To |
|---|---|---|---|
| `lead-generation` | a lead is sourced (networking, affiliate, partner) | lead details | `project-triage` |
| `project-triage` | lead **qualified** (go) | `intake-<slug>.md`; a `shared/clients/<slug>/` record is **created here** | `proposals` |
| `proposals` | deal **won** | signed scope + agreed rate | `projects/<slug>/` (copy `_template-project/`) |
| `projects` | milestone / final acceptance | accepted deliverable + `finances.md` | `finance` |
| `finance` | invoice paid | income event → tax reserve | `state/` dashboard |

## Two rules that fall out of this
- **The client record is created only at the `triage → proposals` boundary** (once qualified), not
  at first contact. Before that, a lead is just an entry in `lead-generation`.
- **`project-triage` runs in two modes:** (a) the **gate before proposals** (qualify, then pitch),
  and (b) **standalone fast-feedback** — give a customer a 5-minute structured opinion on the spot
  without opening a full pipeline. Same stages, different exit.

## The spine
`shared/clients/<slug>/` is read and written across every workspace, so all of them see one
consistent view of the client. Slug rules in [`client-and-slug.md`](client-and-slug.md).

## Where this runs: the admin dashboard is the runtime
The triage → proposals leg of this pipeline **executes inside the admin dashboard**
([`websites/admin-dashboard/`](../../websites/admin-dashboard/)), driven by
[`@jamie-nisbet/icm`](../../packages/icm/). The workspace stage contracts and their `references/`
are the **specification** — the Layer-3 context each generation loads; the admin is the **execution
engine** that runs them against a real deal, holds each draft at its `documents.status` review gate,
and syncs the approved artifact back to `shared/clients/<slug>/`. So a workspace like `proposals/`
is not run stage-by-stage by hand — it is the source of truth for *how* each document is produced,
and the runtime reads it. The document kinds the runtime produces (`triage`, `pitch`, `negotiation`,
`proposal`, `contract`) map onto these stage contracts; `quote` and `invoice` are not documents —
the deal's payment schedule is the quote and Stripe is the invoice.

Related: [`state-and-status.md`](state-and-status.md) · [`building-a-workspace.md`](building-a-workspace.md) · [`packages/icm/README.md`](../../packages/icm/README.md)
