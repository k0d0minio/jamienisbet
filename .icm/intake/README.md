# Intake

The tickets of this repo, as markdown stubs. An epic is a folder with a `breakdown.md` and one
stub per unit of work. A one-off finding is a stub in `triage/`. A stub's path is its identity
and its folder is its status: open here, done in `_done/`. The desk reads this folder on `main`.
The contract, the formats and the loop from stub to merge: `CONTEXT.md`.

This page is the repo's own. Copier writes it once. What is true of this backlog goes below:
the epics in order, the decisions of record that bind them, the milestones.

## This backlog

- `portfolio-only` (cut 2026-10-22, done 2026-10-26): the repo keeps the portfolio only. The
  admin dashboard and the sellers site left, because the desk in `legible-consulting/house`
  does their work. Six stubs, merged as pull requests 197 to 202, in
  `_done/portfolio-only/breakdown.md`.
- The one-off findings are in `triage/`. `patch-high-dependency-advisories` is P0.

Decisions of record (Jamie, 2026-10-22): the portfolio is Jamie Nisbet's public site at
`jamienisbet.com`. Legible Consulting is not public. The repo stays `k0d0minio/jamienisbet`.
Invoices come from Revolut Pro. The brand stays "Jamie Nisbet.", and its tokens live in this
repo as files.

Decisions of record (Jamie, 2026-10-26, pull request 203): the two business records that lived
in `.icm/docs/` move into the house. They are the legitimate-interest assessment for cold
outreach and the accountant pack. The `design-dna` skill is deleted, not copied. The `copier update` answers
are `monorepo` no, `release` yes, `uat` no.

## Open after `portfolio-only`

Jamie's hand, on 2026-10-26:

- Delete the DNS records for `app.jamienisbet.com` and `sell.jamienisbet.com`. Both still
  resolve to Vercel. No redirect.
- Delete the Neon project `jamie-nisbet` (`restless-rain-15879798`). The `biz.*` backups are
  in `~/Desktop/legible-consulting/house/desk/app/`, untracked and not ignored. They hold
  personal data. Ignore them or move them out of the repo folder.
- The Vercel project `portfolio`: `DESK_POOL_URL` and `DESK_POOL_TOKEN` set, `DATABASE_URL`,
  `GITHUB_TOKEN` and the Neon integration gone. The audit of 2026-10-25 could not read the
  variable names.
- On the desktop clone, delete `websites/` and `packages/` once the Neon project is gone.
  `websites/admin-dashboard/.env.local` holds the Neon connection string.
  `websites/portfolio/.vercel/` is the project link, which now belongs at the root.
- Uninstall the admin dashboard from the phone.

In the house:

- `core/voice.md` (Document design) still names `packages/ui/tokens/`. Since pull request 201
  the tokens are `tokens/`, `assets/logo/` and `BRAND.md` at this repo's root.
- The two business records from `.icm/docs/` enter the house where a contract holds them.
  Pull request 202 deleted them. Git history holds them at commit `0defe02`.
