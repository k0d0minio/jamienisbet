# JN-028 · Expose the client mutations over a token-authed API

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

Business state lives in Neon and is only reachable from a browser. Every mutation in the
dashboard is a Next.js server action behind the session-cookie proxy (`proxy.ts`,
`ADMIN_SESSION_SECRET`); there are **no API routes at all**. Nothing outside a logged-in
browser tab can read or write a client row.

That is now the bottleneck. Most of the work that moves a deal along its stages happens in
Claude Code sessions in `icm-board` — the quote gets written, the number gets decided,
the rung changes — and Neon only learns about it if Jamie remembers to open the dashboard
and re-type it. It usually does not happen. `workspaces/deals/alix-hahusseau/` was quoted
at €7,500 fixed-price on 2026-08-27 and the Neon row still says the deal is unpriced.

The fix is not to give sessions `DATABASE_URL`. That hands a production write credential
to every session including cloud ones, and it writes raw SQL that bypasses
`isClientStatus`, `isBillingType` and `normalizeBps` — which is precisely how `status`
acquires a value outside the closed set that `_system/contracts/CLIENTS.md` says is
closed. The same objection kills the Neon MCP. **`packages/services` must stay the only
writer.**

## Build

`app/api/biz/*` in `websites/admin-dashboard`, a thin HTTP shell over the query functions
the server actions already call — no new business logic, no raw SQL.

Read:
- `GET /api/biz/clients` — list, supporting the same options as `listClients`
- `GET /api/biz/clients/:id` — one row

Write, each wrapping its existing function:
- `PATCH /api/biz/clients/:id/status` → `setClientStatus` (validated by `isClientStatus`)
- `PATCH /api/biz/clients/:id/deal` → `updateClient` for `value_minor`, `billing_type`,
  `deal_type` (validated by `isBillingType`, `isDealType`, `normalizeBps`)
- `PATCH /api/biz/clients/:id/repo` → `setClientRepo`
- `PATCH /api/biz/clients/:id/work-started` → `setClientWorkStarted`
- `POST /api/biz/clients/:id/touch` → `touchClient`

Deliberately **not** exposed: `deleteClient`, `createClientRepo`, `setClientArchived`,
anything that sends. Creation stays with the public forms and the dashboard's Add sheet;
a session materialises an existing row into a deal folder, it does not mint rows.

Auth: a bearer token in `Authorization`, compared against `BIZ_API_TOKEN` in the
environment, constant-time. Not the session cookie — this is a machine caller. `proxy.ts`
already skips `/api`, so confirm the routes are actually reachable and are not
accidentally left unauthenticated by that same skip.

`BIZ_API_TOKEN` is an environment variable in Vercel and nowhere else. It never appears in
a committed file, a `.env` that is tracked, or a ticket. Generate it with real entropy and
record only *that* it exists, in the password manager.

Every write stamps `last_touched_at`, same as the dashboard path, so a session touch and a
browser touch are indistinguishable downstream.

## Acceptance

- [ ] All six write routes and both read routes exist and call `packages/services` — no
      SQL in the route handlers
- [ ] A request with no token, a wrong token, or a malformed header gets 401, and the
      comparison is constant-time
- [ ] An invalid `status`, `billing_type` or `deal_type` is rejected by the existing
      validators, not silently written
- [ ] `BIZ_API_TOKEN` is set in Vercel and appears in no tracked file — `git grep` for it
      returns nothing
- [ ] Writing through the API and writing through the dashboard produce identical rows,
      including `last_touched_at`
- [ ] CI green

## Prompt

Add a token-authenticated API surface to the admin dashboard so Claude Code sessions can
read and update client rows without a browser and without `DATABASE_URL`.

Read `.icm/intake/JN-028-biz-api-for-sessions.md` for the full context and the route
list. The rule that matters: `packages/services` stays the only writer to Neon — the
route handlers wrap the existing exported functions
(`packages/services/src/queries/clients.ts`) and contain no SQL and no validation of their
own. The existing server actions in `websites/admin-dashboard/app/(app)/actions.ts` are
the model for how each one is called.

Note that `proxy.ts` skips `/api` when gating pages, so these routes are not covered by
the session cookie — they must authenticate themselves against `BIZ_API_TOKEN` from the
environment. Never commit that value.

Open a PR on a `claude/` branch. Do not run local checks — CI is the source of truth.
