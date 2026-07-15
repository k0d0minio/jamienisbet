# Stage 05 — Pipeline

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Status:** this stage's run-process now lives in the **admin dashboard** (`/clients` and
> `/deals` over the Neon `biz.*` store). This contract remains the Layer-2 spec the dashboard's
> behaviour mirrors — fix the source here when the behaviour needs to change.
> **Purpose:** Track every lead from first contact to qualified, then hand off to proposals and delivery while keeping the client registry current.

## What this folder accomplishes
This stage defines Jamie's single sales pipeline. Each lead moves through clear states — new → contacted → qualified → proposed → won (or lost) — with who referred them (affiliate seller or direct), the offer in play, next action, and date. The state itself lives in the Neon `biz.clients` / `biz.deals` tables and is operated in the admin dashboard: intake forms on the portfolio and sellers sites create the client row, qualification hands it to the deal flow (`workspaces/proposals/` contracts), and a win triggers delivery in the client's external repo. Attribution for the affiliate payout is recorded on the client record so the payout is unambiguous.

## How it connects to the architecture
- **Upstream / reads from:** `../04_outreach/output/`, `../02_channels/output/`, `../03_affiliate_program/output/attribution-rules.md`
- **Downstream / feeds:** the deal pipeline in the admin dashboard (`workspaces/proposals/` contracts); delivery in the client's external repo
- **Draws on (Layer 3 reference):** `_config/conventions/`

## Notes
Pipeline state is a living artifact updated continuously in the dashboard, not a one-shot run. The dashboard's daily brief surfaces "who needs a follow-up today." Won/lost reasons are worth a one-line note on the client record to improve `01_positioning` over time.

> Contract: see [CONTEXT.md](CONTEXT.md).
