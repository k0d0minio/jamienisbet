# Stub: The repo no longer builds the admin dashboard or the biz data layer

- feature-slug: remove-admin-dashboard
- epic: portfolio-only
- sequence: 4 of 6
- depends-on: contact-form-to-desk
- complexity: medium
- priority: P1

## Problem

`websites/admin-dashboard` is the owner cockpit: Work, Inbox, Leads, Money. The desk does Work, the pool and the client pages. Money leaves: Jamie invoices from Revolut Pro. `packages/services` is the `biz.*` data layer under it, and `db-migrations.yml` applies its Drizzle journal to Neon. After stub 3 nothing in the repo reads `biz.*`.

## Proposed change

Delete the admin dashboard, `packages/services` and the migrations workflow. Trim the email templates to the one the contact form uses.

## Acceptance criteria

- [ ] The backup `~/Desktop/legible-consulting/house/desk/app/biz-2026-10-22-backup.tar.gz` still exists, and no row was added to `biz.*` after 2026-10-22. Otherwise a fresh backup is taken first (Notes).
- [ ] `websites/admin-dashboard/`, `packages/services/` and `.github/workflows/db-migrations.yml` are gone.
- [ ] `packages/ui/emails/` keeps `contact-form-notification.html` only, and `template-ids.ts` names only that one.
- [ ] `pnpm-lock.yaml` has no `@jamie-nisbet/admin` or `@jamie-nisbet/services` entry, and no `drizzle-orm`, `stripe` or `ai` package.
- [ ] `websites/README.md` and `AGENTS.md` route to the portfolio only.
- [ ] `ci` is green.

## Out of scope

- The Vercel project `jamie-nisbet`, `app.jamienisbet.com`, the Neon project `jamie-nisbet` and the app on Jamie's phone. Jamie's hand, after the merge and the backup.
- `packages/ui` and `packages/app-shell`. Stub 5.

## Notes

The backup was taken on 2026-10-22 through the Neon connector, with Jamie's go-ahead:
`~/Desktop/legible-consulting/house/desk/app/biz-2026-10-22-backup.tar.gz`. It holds `backup.json`
(the whole export), `data/<schema>.<table>.json` (117 leads, 2 touches, 6 questionnaire links,
0 suppressions, the 27-row Drizzle journal) and `restore.sql` (the DDL and one `insert` per row,
for `psql "$DATABASE_URL" -f restore.sql` into an empty database). The archive is untracked in the
house until Jamie commits or ignores it. The DDL also lives in `packages/services/drizzle/` in this
repo's history.

A fresh copy, when rows changed after 2026-10-22, is Jamie's hand on the desktop with `pg_dump`
(Homebrew's `libpq`). The connection string is not in the local `.env.local`: pull it first.

```bash
cd ~/Desktop/legible-consulting/projects/jamienisbet/websites/admin-dashboard && vercel env pull .env.production.local --environment=production
```

```bash
cd ~/Desktop/legible-consulting/projects/jamienisbet && set -a && . websites/admin-dashboard/.env.production.local && set +a && d=~/Desktop/legible-consulting/house/desk/app && f="biz-$(date +%F)" && "$(brew --prefix libpq)/bin/pg_dump" "$DATABASE_URL" --schema=biz --schema=drizzle --no-owner --no-privileges -f "$d/$f.sql" && tar -czf "$d/$f-backup.tar.gz" -C "$d" "$f.sql" && rm "$d/$f.sql" && ls -l "$d"/biz-*-backup.tar.gz
```
