# Stub: The repo no longer builds or deploys the sellers site

- feature-slug: remove-sellers-site
- epic: portfolio-only
- sequence: 1 of 6
- depends-on: none
- complexity: low
- priority: P1

## Problem

`websites/sellers-site` is the public front door of the 10% referral program. A seller submits a lead with a referral code, reads the seller kit and shows a printable customer pitch. The desk replaces all of it. A salesman signs in and adds the row at `/pool`. The kit moves to `sell/01-prospecting/` in the house. The pitch is the rendered proposal. Referral codes leave: `sourced_by` on the pool row and `commission` in `record.md` carry attribution.

## Proposed change

Delete the sellers site and everything only it used. The portfolio and the admin dashboard build as before.

## Acceptance criteria

- [ ] `websites/sellers-site/` is gone.
- [ ] `packages/ui/emails/referral-lead-notification.html` is gone, and `packages/ui/emails/template-ids.ts` no longer names it.
- [ ] `pnpm-lock.yaml` has no `@jamie-nisbet/sellers-site` entry.
- [ ] `websites/README.md` and `AGENTS.md` no longer route to the sellers site. The Vercel table in `websites/README.md` lists two projects.
- [ ] `ci` is green.

## Out of scope

- The Vercel project `client-referrals` and `sell.jamienisbet.com`. Jamie deletes them by hand, no redirect.
- The seller kit copy in `websites/sellers-site/messages/`. The house takes it before this merges, or from this repo's history (breakdown, "For the house").

## Notes

`@jamie-nisbet/app-shell` stays: the portfolio uses it. A `packages/ui` component used only by the sellers site may stay until stub 5 folds the package.
