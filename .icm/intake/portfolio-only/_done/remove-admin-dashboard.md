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

- [ ] The backup `biz-backup-<date>.tar.gz` exists in `~/Desktop/legible-consulting/house/desk/app/` before this merges. The pull request body names its date.
- [ ] `websites/admin-dashboard/`, `packages/services/` and `.github/workflows/db-migrations.yml` are gone.
- [ ] `packages/ui/emails/` keeps `contact-form-notification.html` only, and `template-ids.ts` names only that one.
- [ ] `pnpm-lock.yaml` has no `@jamie-nisbet/admin` or `@jamie-nisbet/services` entry, and no `drizzle-orm`, `stripe` or `ai` package.
- [ ] `websites/README.md` and `AGENTS.md` route to the portfolio only.
- [ ] `ci` is green.

## Out of scope

- The Vercel project `jamie-nisbet`, `app.jamienisbet.com`, the Neon project `jamie-nisbet` and the app on Jamie's phone. Jamie's hand, after the merge and the backup.
- `packages/ui` and `packages/app-shell`. Stub 5.

## Notes

The backup is Jamie's hand on the desktop, before this stub starts. The connection string lives in the gitignored `websites/admin-dashboard/.env.local`. When that file has no `DATABASE_URL`, run `vercel env pull` in that folder first. `pg_dump` is not installed on the machine. Homebrew's `libpq` provides it.

```bash
brew install libpq
```

```bash
cd ~/Desktop/legible-consulting/projects/jamienisbet && set -a && . websites/admin-dashboard/.env.local && set +a && d=~/Desktop/legible-consulting/house/desk/app && f="biz-$(date +%F)" && "$(brew --prefix libpq)/bin/pg_dump" "$DATABASE_URL" --schema=biz --schema=drizzle --no-owner --no-privileges -f "$d/$f.sql" && tar -czf "$d/$f-backup.tar.gz" -C "$d" "$f.sql" && rm "$d/$f.sql" && ls -l "$d"/biz-*-backup.tar.gz
```

On 2026-10-22 the schema held 117 leads, 2 touches, 6 questionnaire links, 0 suppressions and a 27-row Drizzle journal. The archive is untracked in the house until Jamie commits or ignores it. The DDL also lives in `packages/services/drizzle/` in this repo's history.

Decisions (Jamie, 2026-10-25):

1. The backup archive carries the date 2026-10-25: `biz-backup-2026-10-25.tar.gz`. A local session makes it from a prompt Jamie runs.
2. `.icm/project.json` loses the `jamie-nisbet` deploy entry and the `migrations` and `database` blocks.
3. `.icm/_shared/`, `.icm/docs/`, `.icm/runs/` and the `design-dna` skill stay for stub 6. A separate session copies the `design-dna` toolbox into another repo from a prompt Jamie runs.
4. The root `README.md` tree lists the portfolio and the two packages. Stub 6 rewrites the file. (Default, no answer given.)
