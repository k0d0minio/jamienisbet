# Breakdown: the repo keeps the portfolio only

- epic-slug: portfolio-only
- source: Jamie's 28 answers of 2026-10-22, in the session that moved the repo and adopted the blueprint

## What I understood

Jamie runs the business from the house (`legible-consulting/house`) and its desk app at `desk.jamienisbet.com`. The admin dashboard and the sellers site in this repo duplicate the desk: the pool, the Sell page, the work view and the client pages. This repo keeps one Next.js app, the portfolio, which is Jamie Nisbet's public site at `jamienisbet.com`. Legible Consulting is Jamie's internal name for the system and is not public. The brand stays "Jamie Nisbet.", paper and ink, and its tokens stay in this repo as files, because the desk's design pass reads them. The contact form stops writing to the `biz.*` schema and posts to the desk's pool API, with the Resend mail kept. Money leaves, because Jamie invoices from Revolut Pro. The customer questionnaires leave, because D1's templates in the house replace them. The `biz.*` data is backed up to the desk app folder before the schema goes. The repo stays `k0d0minio/jamienisbet`.

## Build order

1. remove-sellers-site — delete `websites/sellers-site` and its email template — depends-on: none
2. drop-questionnaires — the portfolio loses `/f/[token]`, `/start` and the icm-board read — depends-on: remove-sellers-site
3. contact-form-to-desk — the contact form posts to the desk's pool API, `@jamie-nisbet/services` leaves the portfolio — depends-on: drop-questionnaires
4. remove-admin-dashboard — delete `websites/admin-dashboard`, `packages/services` and `db-migrations.yml` — depends-on: contact-form-to-desk
5. one-app-at-root — the portfolio moves to the repo root, `packages/ui` and `packages/app-shell` fold into it, the workspace leaves — depends-on: remove-admin-dashboard
6. retire-legacy-pipeline — the icm-board era files leave, `CLAUDE.md` and `README.md` are rewritten — depends-on: one-app-at-root

The order differs from the one Jamie confirmed in one place. The sellers site goes first, because it waits on nothing. The contact form waits on the desk's pool API in the house, and stub 3 carries a `blocked:` line until that API is merged.

## Out of scope

- The desk's pool API and the seller kit on `/sell`. House work, see "For the house".
- Vercel projects, domains, DNS and the Neon project. Jamie's hand, see "Jamie's hand".
- The `tier: app` answer in `.copier-answers.yml`. It leaves with the blueprint's questionnaire, and the next `copier update` asks the new questions.
- Public content for Legible Consulting. The portfolio stays Jamie Nisbet's.
- Any restyle of the portfolio.

## For the house

Not stubs here: one home per ticket, the repo where the work is. The paste-prompt is in `~/Desktop/legible-consulting/prompts-2026-10-22.md`, section "the pool API and the seller kit".

- The desk gains a pool API: one POST route, a bearer token (`POOL_TOKEN`, a name only), that inserts a `prospects` row with `source: portfolio`, `sourced_by: jamie`, `status: new`. Stub 3 waits on it.
- The seller kit copy moves from `websites/sellers-site/messages/{en,fr,pt}.json` into `sell/01-prospecting/kit.<language>.md` and shows on `/sell`. Stub 1 deletes the source. The house session reads it before that merge, or from this repo's history.
- `desk/mani.yaml` gains `jamienisbet` as `live`, so D4 checks it against the blueprint tag.
- `core/stack.md` (Layout), `core/lexicon.md` (local lane) and `core/voice.md` (Document design) name the old paths. The brand's path after stub 5 is `tokens/` and `assets/logo/` at this repo's root.
- `core/wave.md`: Jamie adds the line for this work and decides whether "Where the business site is served" is closed.

## Jamie's hand

- The `biz.*` backup of 2026-10-22 is at `~/Desktop/legible-consulting/house/desk/app/biz-2026-10-22-backup.tar.gz`, untracked in the house: commit it or ignore it. A fresh copy before stub 4, when rows changed, follows stub 4's Notes.
- Delete the Vercel projects `jamie-nisbet` and `client-referrals`. Remove `app.jamienisbet.com` and `sell.jamienisbet.com`. No redirect.
- Stub 3: set `DESK_POOL_URL` and `DESK_POOL_TOKEN` on the Vercel project `portfolio`. Remove `DATABASE_URL`, `GITHUB_TOKEN` and the Neon integration from it.
- Stub 5: set the Vercel project `portfolio`'s Root Directory to the repo root when that pull request is ready, before the merge, and push nothing to `main` in between.
- After stub 4 and the backup: delete the Neon project `jamie-nisbet` (`restless-rain-15879798`).
- Uninstall the admin dashboard from the phone.

## Notes

Until stub 6 merges, `AGENTS.md` and `.icm/intake/CONTEXT.md` disagree on how a ticket ships. The contract wins: one branch, one pull request, the stub moved to `_done/` on the branch, nothing committed straight to `main`.
