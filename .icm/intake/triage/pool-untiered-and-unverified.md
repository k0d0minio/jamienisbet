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

## What a cloud session established, 2026-08-31

The three runs themselves did not happen: this ran in the cloud, and there is no
`DATABASE_URL` and no `AI_GATEWAY_API_KEY` there — which is what the prompt already said
would be true. Nothing below was read from Neon. It is derived statically from
`0022_seed_mafra_lisbon_prospects.sql`, which is the pool as seeded, by running the real
`deriveFitTier` over the migration's own `VALUES` rows. The parse reproduces every count
this stub already claimed (101 rows, 54 websites, 17 grades, 1 review count, 71 without a
phone, 87 without an email), which is why the rest is worth reading.

**`--retier` alone will not order the queue.** Run against the seeded facts it tiers all
101 — nothing comes back untiered, because every row carries a sector and a town, and
`deriveFitTier` only returns null when all four facts are empty. The letters land
**A 17 · B 77 · C 7**: the block is still a block, it has just been renamed. The reason is
the `need` signal, which is the one worth three points and is null on 84 rows, scoring
them all the same 1 ("site not graded"). Grading is what separates the pool, so step 1
before step 2 is not a preference — done the other way round the queue is sorted on a
column that is constant.

**Enrichment reaches 50 of those 84.** `listEnrichable` requires a non-empty
`website_url` (`queries/enrichment.ts`), and of the 54 rows with one, 4 are already
graded. The other **34 have no website at all** and sit outside the pass permanently. That
function's comment assumes they arrive graded — "the import already grades those `none` or
`social_only`" — and migration 0022 deliberately did not, because a blank website cell in
the list means "could not confirm", never "does not exist". So those 34 are the pool's
highest-need businesses scored as if nobody had looked, and only a person can close it:
confirm the business genuinely has no site, then grade it `none` or `social_only` and let
the next `--retier` pick the three points up. That is a fourth verification gap, and the
biggest one by row count.

For what it is worth, if the 50 readable sites all came back `dated` the split moves to
A 41 · B 59 · C 1, and if they all came back `decent`, A 16 · B 70 · C 15. The real answer
is in between, and it is the pass that decides it.

**Run them in this order.** `--retier`, then `leads-enrich --all`, then `--retier` again.
The middle run is the expensive one and the first run is free, and doing it first is what
makes the enrichment queue's own ordering work: it sorts `fit_tier asc nulls last`
specifically so a `--limit` spends itself on the A-tier rows, which on an all-untiered
pool it cannot do.

### The letters, sanity-checked

Reading the derived letters against the sectors turned up one thing worth fixing rather
than noting, and it is in this branch: the same business scored two different tiers
depending on which words whoever compiled the row happened to use. "Dental clinic" hit
`clinic` and scored 2; plain "Dental" hit nothing and scored 1. Same for "Sushi" and
"Tapas" against `restaur`, "Fitness" against `gym`, and "Aparthotel" and "B&B" against
`hotel`. Those spellings are now in `HIGH_VALUE_SECTORS` — nine rows change score, and one
changes letter (Esphera Clínica, a dental clinic, B → A, which is where Beclinique Mafra
already sat). Nothing moves down.

What was deliberately **not** changed, because it is a judgement about who to call and not
a spelling gap — all of these currently score the neutral 1:

- **Coworking** (8 rows, incl. incubator/coliving hybrids) — a desk is booked online.
- **Golf** (6 rows) — tee times are, too, though most of these are chains and far away.
- **STR / short-let management** (4 rows), **winery + tourism** (4), **padel** (2),
  food tours, supermarket, marketing agency.

If any of those belong at 2, add the keyword and re-run `--retier`; that is the whole
gesture, and it is why the weights live in a pure function.

### One documentation ambiguity

`tiering.ts` and the services README both offer "a Lisbon clinic with a good site is a 3".
It is a 3 only if that clinic has a review count on file (0 + 2 + 0 + 1); with reviews not
looked up it is a 2 — and that is the B/C boundary, so the example lands on either side
depending on a fact it does not state. The Mafra-restaurant example beside it (7) checks
out exactly. Left alone here rather than reworded, since it is Jamie's prose.

### Still open

Everything the stub listed under "What closing it takes" that needs the database or a
phone: the three runs, the two Estoril numbers, the truncated Atlântico number, the
paywalled Mafra restaurant numbers, Tik Tapas's Instagram handle, and now the 34
no-website rows that need a grade before they can rank. This stub stays put until then.

## The 34, flagged rather than graded — migration 0023

The blind-spot rows now get asked about. `0023_flag_pool_web_presence_unknown` sets a
dated `next_action` ("Confirm whether they have a website, then grade it") on every seeded
row that still has neither a `website_url` nor a `website_grade`, so they surface in
`listDueOutreach` instead of sorting mid-pool forever. It runs in CI on merge to main,
which is the only place a `DATABASE_URL` lives.

**It writes nothing about anybody's website.** `website_grade`, `website_url` and
`fit_tier` are untouched, so the tiering inputs stay as honest as they were and the letter
stays arithmetic. Grading these in SQL was the obvious move and the wrong one: 26 of the 34
notes say only "Listed via Google" or "Listed via directory", which is not evidence of no
website; exactly one ("Sunset Surf Lodge — no own site confirmed") supports a `none`, and
one contradicts it outright ("Salty Souls Surf School — Sold via Expedia *and their own
site*"), a row that needs its URL found rather than its presence denied. There is no
cautious letter either — every non-null grade scores at least 2 on `need` where null scores
1, and `none` and `social_only` both score the maximum 3, so any grade invented in a
migration can only push these rows *up* the call list.

The date is load-bearing. `unplannedWhere` in `queries/crack-finder.ts` counts an action
with no due date as the same crack as no action at all, so text alone would look planned
and surface nowhere. All 34 come due together — this is one sitting with a phone, not a
schedule, and re-dating from the dashboard is a normal edit.

Guarded the way 0022 is: scoped to `source_detail = '2026-07-23 Mafra/Lisbon prospect
list'`, only rows where both website columns are still null, never overwriting a
`next_action` or `next_action_due` somebody already set (which also makes a second apply a
no-op), and `nurture` excluded because a parked row is meant to have nothing planned.
Verified against the seed: the predicate matches exactly those 34, touches nothing already
graded or holding a URL, and leaves no ungraded no-URL row unflagged.

This does not close the gap — it stops the gap being silent. A person still has to confirm
each one and set the grade, and `leads-enrich --retier` then picks the points up.
