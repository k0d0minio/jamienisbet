# JN-005 · Customer form builder — markdown questionnaires → link → lead profile

| | |
|---|---|
| Status | in-progress |
| Type | feature |
| Priority | P2 |
| Size | L |

## Problem

Prospection today is unstructured: initial info gathering happens over email, and the
answers land in an inbox instead of the lead's profile. We want markdown-defined
questionnaires that live in this repo (`.icm/onboarding/` — folder and file convention
already committed), a "Send form" button on a lead's profile in the admin dashboard that
publishes one as a customer-facing link, and the customer's answers saved onto their
`biz.clients` profile.

Design principles (settled during brainstorming, don't relitigate):

- **Questions are content (git), answers are business state (Neon).** The
  `.icm/onboarding/` convention README documents the file format.
- **Publish = snapshot.** "Send form" parses the markdown *at click time* and stores the
  parsed questions as JSON on the link row, so later edits to the markdown never
  reinterpret already-collected answers.
- **The link is copied, not sent.** Per the estate rule "no outbound action without
  review", the dashboard shows a copyable URL; the email is written by a human.
- **The public page lives on the portfolio** (it already has brand chrome, i18n, and a
  server action writing to `biz.clients`). No new app; nothing public on the dashboard.
- **Four field types only** (`text`, `textarea`, `select`, `boolean`). No conditional
  logic, no uploads.

## Steps

1. **Data layer** (`packages/services`): add `biz.form_links` to `src/schema/index.ts` —
   `id` uuid PK (doubles as the unguessable link token), `client_id` uuid →
   `clients.id` (`on delete cascade`), `form_slug` varchar, `form_snapshot` jsonb NOT
   NULL, `answers` jsonb, `sent_at` tz NOT NULL default now, `completed_at` tz. Generate
   the migration with `db:generate` (the db-migrations workflow applies it on main).
   Export the snapshot/answer TypeScript types here so both apps share them.
2. **Queries** (`packages/services/src/queries/form-links.ts`): `createFormLink`,
   `getFormLink(id)`, `listFormLinksForClient(clientId)`,
   `saveFormLinkAnswers(id, answers)` (sets `completed_at`, rejects if already
   completed), `deleteFormLink`. Re-export from the barrel.
3. **Parser** (`websites/admin-dashboard/lib/onboarding.ts`): parse an
   `.icm/onboarding/<slug>.md` file into the snapshot type per the convention in
   `.icm/onboarding/README.md` (gray-matter for front matter; heading/list parsing in the
   style of `lib/tickets.ts`). List available forms by scanning the folder. Read from
   disk — the monorepo ships with the deployment — and add the folder to the dashboard's
   `outputFileTracingIncludes` in `next.config.ts` so Vercel traces it; if disk reads
   prove unreliable there, fall back to the GitHub-fetch pattern `lib/tickets.ts` already
   uses.
4. **Dashboard — send + view** (`websites/admin-dashboard`): on the lead profile
   (`app/(app)/leads/[id]/page.tsx`), a "Forms" card listing that lead's links (pending =
   "sent, awaiting response"; completed = fold open the answers read-only, styled like
   the existing Intake card). A "Send form" flow: pick a form by slug → server action in
   `app/(app)/actions.ts` parses, snapshots, inserts the row, revalidates → the card
   shows the full public URL with a copy button. Also a delete action for dead links.
   Public URL base comes from an env var (e.g. `PORTFOLIO_BASE_URL`).
5. **Portfolio — public form page** (`websites/portfolio`): route `/f/[token]`,
   `dynamic = "force-dynamic"`, `robots: { index: false }` (the payment-gateway
   convention). Load via `getFormLink`; unknown token or completed link renders a polite
   dead-end ("this form has been submitted / is no longer available"). Render fields from
   `form_snapshot` only — the page never reads markdown. Submit via a server action:
   validate answers against the snapshot (required fields, select options, boolean
   coercion) with a Zod schema built from the snapshot (pattern: `lib/contact-schema.ts`),
   write `saveFormLinkAnswers`, call `touchClient`. On success show a thank-you state.
   Plain brand styling from `@jamie-nisbet/ui`; skip the locale machinery — forms are
   authored in one language.
6. **Docs**: add a short section to the admin-dashboard and portfolio READMEs (the root
   `CLAUDE.md` routing row and the `.icm/onboarding/` convention are already committed).
   Don't run checks locally; push and read CI.

## Acceptance

- [ ] `.icm/onboarding/project-intake.md` can be sent to a lead from their profile and
      the dashboard shows a copyable portfolio URL.
- [ ] The customer link renders the questions, enforces required fields and select
      options, and submits exactly once; revisiting a completed link shows a dead-end,
      not the form.
- [ ] Submitted answers appear on the lead's profile keyed per the convention's `key`
      rules, and `last_touched_at` updates on submission.
- [ ] Editing the markdown after a link is sent does not change what that link renders.
- [ ] Migration lands via the db-migrations workflow; CI green on all four apps.

## Prompt

Implement JN-005: read .icm/intake/JN-005-customer-form-builder.md and
.icm/onboarding/README.md for full context and the settled design. Add the
biz.form_links table and query module in packages/services, a markdown→snapshot parser
and "Forms" card with a send-link server action in websites/admin-dashboard, and the
public /f/[token] form page with a validated submit action in websites/portfolio. Follow
the steps and acceptance boxes in the ticket. Open a PR on a claude/ branch; do not run
local checks — CI is the source of truth.
