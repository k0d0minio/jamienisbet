# Stub: The seeded pool is untiered and its contact details are unverified

- lane: chore
- found-by: seeding the 2026-07-23 Mafra/Lisbon list (`0022_seed_mafra_lisbon_prospects`), 2026-08-31
- priority: P1 — before the first message goes out
- size: S

## What this is

Migration `0022_seed_mafra_lisbon_prospects` puts 101 prospects into `biz.clients`, and
they land the way `insertProspects` lands anything: `status = 'prospect'`, `source =
'import'`, `source_detail = '2026-07-23 Mafra/Lisbon prospect list'`, nothing touched,
nothing owed. Two things are deliberately *not* in that migration, and both have to
happen before anybody is contacted.

**No row is tiered.** `fit_tier` is null on all 101. That is not an omission — the A/B/C
letter is arithmetic over stored facts (`deriveFitTier`, `packages/services/src/tiering.ts`),
and migration `0021` states the rule outright: re-tiering the pool is a re-run of a pure
function, never a migration. Until it runs, the outreach queue's second sort key is empty
and the pool is one undifferentiated block. `website_grade` is set on only 17 rows — the
ones where the list actually assessed the site — so most of the tiering evidence is
missing too, and `review_count` is set on exactly one (AniCura, 949).

**The contact details are as the list compiled them, not as verified.** The list's own
caveats say so, and the ones that name a row are in that row's `notes`:

- Golfe do Estoril has two numbers circulating (214 680 176 and 21 431 00 77).
- Atlântico Real Estate's number is truncated in the directories, so it is stored null.
- Several Mafra restaurant numbers sat behind directory paywalls.
- Chain-owned properties (Vila Galé, Pestana/Beloura, Ritz-Carlton/Penha Longa,
  Wyndham/Dolce CampoReal, Marriott/Praia D'El Rey) have corporate IT and are a
  lower-probability approach unless a specific local F&B or events unit is the target.
- Praia D'El Rey (Óbidos) and some Torres Vedras venues sit near or beyond a strict 40 km
  radius from Mafra.

71 rows carry no phone and 87 carry no email, which is the list being honest — a blank
cell means "could not confirm from an official source", never "does not exist" — but it
means a large slice of the pool is reachable today only by walk-in, Instagram or the
website's own contact form.

## What closing it takes

1. Run the enrichment pass over the rows that have a website — `pnpm --filter
   @jamie-nisbet/services leads-enrich` — so `website_grade`, and the facts under it, come
   from somebody having actually looked. 54 rows have a `website_url` to read.
2. Re-tier the whole pool (`leads-enrich --retier`) and sanity-check the letters against
   the worked examples in the services README before trusting the queue's order.
3. Fill the gaps the list left, by hand and from live Google Business listings: the two
   Estoril numbers, the truncated Atlântico number, the paywalled restaurant numbers, and
   the Instagram handle for Tik Tapas (Instagram-only, and the list never recorded it).
   `review_count` stays hand-entered by design — no Places API at this scale.

None of this is a migration and none of it is a schema change. It is three script runs and
an afternoon with a phone, and the first cold message should not go out before it.

## Prompt

The cold pool in the jamienisbet repo's Neon `biz.clients` was seeded by migration
`0022_seed_mafra_lisbon_prospects` — 101 prospects from the 2026-07-23 Mafra/Lisbon list.
Every row is untiered (`fit_tier` null, by design — the letter is derived, never migrated)
and most carry no website grade, so the outreach queue has nothing to order on. Read
`.icm/intake/triage/pool-untiered-and-unverified.md` first, then run the enrichment and
re-tier passes (`packages/services/scripts/leads-enrich.ts`) against `DATABASE_URL` and
work through the verification gaps the stub lists.

This needs a live `DATABASE_URL`, so it is a local session, not a cloud one. CI is the
source of truth; don't run builds, lint or typecheck locally. If any code changes fall
out of it, work on a `claude/` branch and open a PR; `git mv` this stub to
`.icm/intake/triage/_done/` when the pool is tiered and the gaps are closed.
