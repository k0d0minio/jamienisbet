# Stub: The portfolio no longer hosts customer questionnaires or the intake diagnostic

- feature-slug: drop-questionnaires
- epic: portfolio-only
- sequence: 2 of 6
- depends-on: remove-sellers-site
- complexity: low
- priority: P1

## Problem

The portfolio hosts `/f/[token]`, the questionnaire a lead was sent from the admin dashboard, and `/[locale]/start`, the intake diagnostic read live from `k0d0minio/icm-board`. Both write to `biz.*` through `@jamie-nisbet/services`. The admin dashboard leaves, icm-board is retired, and D1's templates in the house replace the questionnaire.

## Proposed change

Remove both routes and what only they use. The home page, `/work`, `/tech` and the contact form stay as they are.

## Acceptance criteria

- [ ] `app/f/`, `app/[locale]/start/`, `app/actions/form.ts`, `app/actions/intake.ts`, `components/intake-form.tsx`, `components/customer-form.tsx`, `lib/form-answer-schema.ts`, `lib/intake-schema.ts` and `lib/icm-board.ts` are gone.
- [ ] `proxy.ts` no longer excludes `/f`, and `app/robots.ts` no longer disallows it.
- [ ] `GITHUB_TOKEN` leaves `websites/portfolio/.env.example`.
- [ ] `/f/anything` and `/en/start` answer 404 on the preview.
- [ ] `ci` is green.

## Out of scope

- The contact form and the `@jamie-nisbet/services` dependency. Stub 3.
- `biz.form_links` rows. The backup keeps them (breakdown, "Jamie's hand").

## Notes

`lib/problems.ts` stays: `components/sections/problems.tsx` on the home page imports it. After this stub, `app/actions/contact.ts` and `next.config.ts` are the only files that name `@jamie-nisbet/services`. Jamie removes `GITHUB_TOKEN` from the Vercel project `portfolio` by hand.

Decisions (Jamie, 2026-10-25, at the start of the ticket):

1. The five `/start` links on the home page open a public route of `desk.jamienisbet.com` in a new tab. The forms and the questionnaires move to the desk, so the answers are written to git there.
2. The link copy "Get a free look" stays.
3. The link is `https://desk.jamienisbet.com/start?lang=<locale>`, with `en`, `fr` or `pt`.
4. This pull request does not wait for the desk route. The links answer what the desk answers until the house ships the route.
5. The house work (the public route, the intake form, the per-lead questionnaires, the answers to git) is cut into tickets by a house session from a prompt Jamie passes. No text for the house goes into this repo.
