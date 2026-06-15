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

Related: [`state-and-status.md`](state-and-status.md) · [`building-a-workspace.md`](building-a-workspace.md)
