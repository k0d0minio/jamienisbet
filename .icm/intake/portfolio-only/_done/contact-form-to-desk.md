# Stub: A contact form submission lands in the desk's pool, and Jamie still gets the mail

- feature-slug: contact-form-to-desk
- epic: portfolio-only
- sequence: 3 of 6
- depends-on: drop-questionnaires
- complexity: medium
- priority: P1

## Problem

`app/actions/contact.ts` writes a `biz.clients` row through `@jamie-nisbet/services` and sends the Resend mail. The `biz.*` schema leaves with the admin dashboard. The desk's pool is the one home for a lead.

## Proposed change

The contact action posts the lead to the desk's pool API and keeps the mail. The portfolio stops depending on `@jamie-nisbet/services` and on `DATABASE_URL`.

## Acceptance criteria

- [ ] A submission on the preview creates a `prospects` row in the desk with `source: portfolio`, `sourced_by: jamie`, `status: new`, the name, the email, the message as `ask` and the locale as `language`.
- [ ] Jamie receives the Resend mail as before.
- [ ] A failed API call does not lose the lead. The mail is still sent, the form shows success, and the failure is logged.
- [ ] `websites/portfolio/package.json` no longer depends on `@jamie-nisbet/services`, and `next.config.ts` no longer transpiles it.
- [ ] `websites/portfolio/.env.example` names `DESK_POOL_URL` and `DESK_POOL_TOKEN`. `DATABASE_URL` and the Neon integration block leave it.
- [ ] `ci` is green.

## Out of scope

- The API itself. House work.
- The `biz.*` schema. Stub 4.

## Notes

The API's contract comes from the house pull request: the route, the JSON fields, the bearer header, the 422 answer for an open prospect with the same email. Names only in this repo. The honeypot and the Zod schema in `lib/contact-schema.ts` stay. Jamie sets the two variables on the Vercel project `portfolio` and removes `DATABASE_URL` and the Neon integration from it by hand.
