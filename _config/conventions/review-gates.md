# Review Gates & Autonomy

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The human-in-the-loop discipline — when the agent stops for review, and how much it may do on its own.

Every `output/` is an **edit surface**. The agent writes a deliverable, then **stops**; the human
reviews and edits before the next stage runs. This is ICM Principle 4 and the reason the system is
trustworthy: nothing compounds on top of an unreviewed step.

## The gate
- A stage's `CONTEXT.md` declares its `Review gate` (or `none`).
- At a gate, the agent presents the `output/`, summarises what it did and what it is unsure about,
  and **waits**. It does not start the next stage.
- The human edits the file directly. The next stage reads whatever the human left.

## Heavy vs light gates
Per ICM's observed U-shape, edit effort concentrates at the ends:
- **Direction-setting stages** (intake, discovery, negotiation strategy) — heavy gates; this is
  where the human shapes the run. Slow down here.
- **Middle stages** — lighter; they sit between fixed anchors.
- **Final assembly** (proposal, contract, invoice) — heavy again; aligning output with earlier
  decisions.

## Autonomy policy
- **Draft-and-wait for everything client-facing** — proposals, quotes, contracts, invoices, emails,
  anything that leaves the building. The agent drafts to `output/`; a human approves before it is
  sent. No exceptions — see [`scripts-and-integrations.md`](scripts-and-integrations.md).
- **Auto-run for read-only scans and internal formatting** — the morning brief's read-only crawl,
  totalling a ledger, reformatting, slug derivation. No outward effect, so no gate needed.

When in doubt, treat it as client-facing and stop.

Related: [`stage-contracts.md`](stage-contracts.md) · [`provenance-and-verify.md`](provenance-and-verify.md)
