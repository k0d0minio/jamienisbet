# Architecture Decisions (register)

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** A terse register of the decisions that shaped this repo, so an agent loads the *what* without re-reading the full Q&A. Rationale lives in [`brainstorm.md`](../../brainstorm.md).

Decided 2026-06 from the `brainstorm.md` questionnaire (~50 answers). Most load-bearing first.

## Structure
- **Stage contract = split:** `README.md` (narrative) + `CONTEXT.md` (contract). Root `CLAUDE.md`
  stays the only Layer-0 file. → [`readme-as-context.md`](readme-as-context.md)
- **`projects/` = in-repo, docs-only** per client; delivery **code lives in the client's external
  repo**. → [`client-and-slug.md`](client-and-slug.md)
- **`websites/` here = `portfolio/`, `payment-gateway/`, `admin-dashboard/`, `sellers-site/`**
  (Next.js + Vercel). Client sites are **external repos**. No `clients/` or `personal/` here.
- **`tracker/` = business-only.** The personal/business privacy wall is **retired**.
- **Repo is private forever.** Not handed to clients; sensitive global config is injected at
  run-time, not referenced from a shared workspace.

## Automation & integrations
- **Scripts = bash**, agent-invoked, each with a tiny contract. First three: `send-email` (Resend),
  `new-client`, `new-project`. → [`scripts-and-integrations.md`](scripts-and-integrations.md)
- **Wired services: Stripe, Vercel, GitHub.** Accounting via Stripe.
- **Hard boundary:** no outbound action without a human-reviewed `output/` file first. No
  exceptions. Per-stage `## Integrations` declares any external call.

## State & process
- **State = per-entity YAML front-matter**, plain text. → [`state-and-status.md`](state-and-status.md)
- Statuses: lead `new|qualified|proposed|won|lost`; project `discovery|build|delivery|closed`;
  invoice `draft|sent|paid|overdue`. Metrics: pipeline value, win rate, monthly revenue, tax
  reserve, overdue receivables.
- **Output versioning:** `output/<client>/<vN>/` side-by-side; run header on each; commit per
  stage/run.
- **Verify mandatory; provenance markers in real outputs; edit→source-fix loop.**
- **Client record created only once qualified.** Triage is both a gate-before-proposals and a
  standalone fast-feedback mode.

## Business parameters (used by later passes)
- **Rate: €120/hour.** Open to a reduced rate for commission/incentive comp; slight reduction for
  monthly retainers. Tiered good/better/best by default; price against client upside. **Account for
  a retainer client type from the start** (one is live).
- **Affiliate:** sellers quote freely (min €200) for a landing page + contact form without approval;
  anything more complex needs Jamie's sign-off. 10% paid on payment received. Lead intake + partner
  referrals via the public `sellers-site/`.
- **Triage rubric:** fit, budget, strategic value. May recommend a competitor/SaaS when it serves
  the client better; standalone mode = a 5-minute verbal-ready summary.
- **Legal/tax:** nothing set up yet (sole trader likely, undecided); **decision-support only**;
  source + as-of-date on every note; compliance calendar does **not** auto-feed Google Calendar.
- **Brand:** name "Jamie Nisbet"; English-first; friendly + informative + expert; designing from
  zero; email `contact@jamienisbet.com`. Brand emits machine-readable design tokens consumed by
  documents and websites.
- **Models:** heavy for negotiation/triage; cheap for formatting/scans.
- **Goal of "powerful":** fewer admin hours, higher close rate, never miss a deadline.

Rationale & full answers: [`brainstorm.md`](../../brainstorm.md).
