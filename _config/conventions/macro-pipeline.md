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
| `project-triage` | lead **qualified** (go) | the `biz.clients` row in the admin | `proposals` |
| `proposals` | lead **won** | agreed scope + rate (the reviewed proposal) | the client's external delivery repo, seeded from `shared/templates/delivery/` |
| `projects` | milestone / final acceptance | accepted deliverable | `finance` |
| `finance` | invoice paid | income event → tax reserve (live in Stripe) | — |

## Two rules that fall out of this
- **The client is qualified at the `triage → proposals` boundary**, not at first contact. Before
  that, a lead is just an entry in `lead-generation`. The lead itself lives as one row in the
  Neon `biz.clients` table, worked through the admin dashboard.
- **`project-triage` runs in two modes:** (a) the **gate before proposals** (qualify, then pitch),
  and (b) **standalone fast-feedback** — give a customer a 5-minute structured opinion on the spot
  without opening a full pipeline. Same stages, different exit.

## The spine
The Neon `biz.*` schema is the single source of truth every leg reads and writes, so all of them
see one consistent view of the client — there is no repo mirror. See
[`state-and-status.md`](state-and-status.md).

## Where this runs: workspaces produce the documents, the dashboard tracks the person
The dashboard is deliberately **not** a document runtime. It answers one question — who is
waiting to hear back, and what are they worth — plus the Stripe money surface. It carries no
generation, no review gate, no per-deal record. See
[`websites/admin-dashboard/README.md`](../../websites/admin-dashboard/README.md).

Everything a leg of this pipeline *produces* — a triage verdict, a pitch, a proposal, a contract
— is a **workspace run**: walk the stage contracts under `workspaces/<name>/stages/NN_*`, load
the Layer-3 references each names, and write a reviewed file to that stage's `output/`. An agent
runs those directly from the repo. The lead's row in the dashboard is what moves as a result
(status, value, "touched"), and Stripe is where the invoice is raised.

So `proposals/` is still the source of truth for *how* each document is produced — the change is
that a human or an agent walks it, rather than a route handler in the dashboard.

Related: [`state-and-status.md`](state-and-status.md) · [`building-a-workspace.md`](building-a-workspace.md)
