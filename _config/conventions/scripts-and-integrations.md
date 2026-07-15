# Scripts & Integrations

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The automation layer — where scripts live, how they're invoked, and the hard boundary around any action that leaves the building.

ICM is "one agent + folders + **local scripts**". Scripts handle the deterministic, no-judgment
work; the agent handles judgment. Anything an agent would do the same way every time should be a
script.

## Scripts (`scripts/`)
- All mechanical automation lives in top-level [`scripts/`](../../scripts/). One concern per script.
- **Language: bash** (portable, no runtime). Reach for Python only when bash gets genuinely
  unwieldy (structured parsing, heavy arithmetic) — and say why in the script header.
- **Invocation: by the agent as a tool**, not by Jamie on the CLI. Day-to-day driving is natural
  language; the agent reaches for a script when the task is mechanical.
- **Every script declares a tiny contract** in a header comment — Inputs, Outputs, Side-effects,
  Invocation — the same Inputs/Outputs discipline as a stage, so scripts stay ICM-legible.

Current scripts: `send-email.sh` and the read-only `stripe-*.sh` fetchers. Index in
`scripts/README.md`. (Client and project creation are the admin dashboard's job — see the
dashboard-first reversal in [`decisions.md`](decisions.md).)

## The integration boundary (hard rule)
External services reached via MCP or script: **Stripe, Vercel, GitHub** are the wired set
(accounting via Stripe).

> **No outbound action — email sent, payment captured, calendar/issue written, repo created —
> happens without a human-reviewed file in an `output/` first. No exceptions.**

This preserves ICM's core safety property: every action is visible in a file before it happens.
Read-only reads (scanning the repo, reading a Stripe balance, listing Vercel deploys) may be done
freely. The line is **read freely, write only after review.**

- A stage that may call an integration **declares it** in its `CONTEXT.md` `## Integrations`
  section (default `none`), so side-effects are auditable.
- Outbound scripts enforce the boundary themselves: `send-email.sh` refuses to send without an
  explicit reviewed-file path **and** a `--confirm` flag.

## Secrets
Keys for these services live in `.env` (gitignored) and the Vercel env store — never committed.
See [`governance.md`](governance.md).

Related: [`review-gates.md`](review-gates.md) · [`stage-contracts.md`](stage-contracts.md)
