# Stage 05 — Pipeline

> **ICM role:** Layer 2 — stage
> **Purpose:** Track every lead from first contact to qualified, then hand off to proposals and projects while keeping the client registry current.

## What this folder accomplishes
This stage is Jamie's single, plain-markdown sales pipeline. Each lead moves through clear states — new → contacted → qualified → handed off (or lost) — with who referred them (affiliate seller or direct), the offer in play, next action, and date. When a lead qualifies, this stage hands it to `workspaces/proposals/` and, on a win, to a new `projects/` pipeline, and writes the contact into `shared/clients/`. It also closes the affiliate loop by recording attribution so the 10% payout is unambiguous.

## How it connects to the architecture
- **Upstream / reads from:** `../04_outreach/output/`, `../02_channels/output/`, `../03_affiliate_program/output/attribution-rules.md`
- **Downstream / feeds:** `workspaces/proposals/`, `projects/` (copied from `projects/_template-project/`), `shared/clients/`
- **Draws on (Layer 3 reference):** `_config/conventions/`, `shared/knowledge/`

## Stage contract
### Inputs
- Layer 4 (working): `../04_outreach/output/` (sends/replies), incoming intros and inbound enquiries
- Layer 3 (reference): `../03_affiliate_program/output/attribution-rules.md`, `_config/conventions/`
### Process
Log each lead with status, source/referrer, offer, value band, and next action; advance or close leads; on "qualified," package the lead for `workspaces/proposals/`; on "won," trigger a `projects/` pipeline and upsert `shared/clients/`; flag affiliate-attributed deals for payout in `../03_affiliate_program/`.
### Outputs
- `pipeline.md` (the live board) -> output/
- `handoffs/` (per-lead qualified packets) -> output/
### Verify
- Every affiliate-sourced lead has exactly one referrer per attribution rules; qualified leads exist in both `pipeline.md` and a handoff packet; client records written to `shared/clients/` match the lead; no duplicate clients.

## Notes
This is a living Layer 4 artifact updated continuously, not a one-shot run. Keep it skimmable — Jamie's morning routine in `tracker/` may reference it for "who needs a follow-up today." Won/lost reasons are worth a one-line note to improve `01_positioning` over time.
