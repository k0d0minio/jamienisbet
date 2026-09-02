# Stub: The pool still has no tiers, and 37 rows have no way to reach them

- lane: chore
- found-by: closing `pool-untiered-and-unverified` once migration 0023 flagged the 34, 2026-08-31
- priority: P1 — before the first message goes out
- size: S

## What this is

`pool-untiered-and-unverified` closed on the call that the rest would be flagged in the
dashboard. Migration `0023_flag_pool_web_presence_unknown` does that for the 34 rows with
neither a `website_url` nor a `website_grade` — they carry a dated `next_action` and surface
in **Needs you**. Two pieces of that stub's work are *not* flagged by it, and closing the
ticket is what makes them easy to lose.

**The pool still has no tiers.** `fit_tier` is null on all 101 and stays null until
`leads-enrich --retier` runs; nothing in the dashboard represents a script that has not been
run. Until it does, the outreach queue's second sort key is empty and the pool is one block.
The order that matters — established while closing the last stub — is `--retier`, then
`leads-enrich --all`, then `--retier` again: the middle run is the expensive one, and the
first is free and is what lets the enrichment queue's own `fit_tier asc nulls last` ordering
spend a `--limit` on the best rows instead of on creation order.

**37 rows have no phone, no email and no Instagram — and 0023 does not flag them.** 68 rows
in the pool carry no contact point at all; 31 of those are inside the flagged 34 and will
surface, and the other 37 are not, because they already have a `website_url` or a
`website_grade` and so fall outside 0023's predicate. They are reachable today only by
walk-in or by a website contact form, and nothing will ever raise a hand about them.

The named caveats from the old stub are all in this second group — none is inside the
flagged 34:

- **Clube de Golfe do Estoril** — two numbers circulating; `+351214680176` is stored, the
  other (21 431 00 77) is in `notes`.
- **Atlântico Real Estate (Isabel & Franco)** — number truncated in the directories, so
  `phone` is null. Has a website (`mediadoraatlantico.com`).
- **Tik Tapas** — Instagram-only and the list never recorded the handle, so every channel is
  null. Graded `social_only`, which is why 0023 skips it.
- The Mafra restaurants that sat behind directory paywalls — Taberna D. João V, Quinta da
  Cerca and Escondidinho all now carry a phone, so that caveat is mostly spent.

`review_count` stays hand-entered by design — no Places API at this scale — and is still set
on exactly one row (AniCura, 949).

## What closing it takes

1. `leads-enrich --retier`, then `leads-enrich --all`, then `--retier` again, against a live
   `DATABASE_URL` and `AI_GATEWAY_API_KEY`. Sanity-check the letters before trusting the
   queue's order.
2. Find a contact point for the 37 — or decide they are walk-in only and record that, so the
   decision is on the record rather than re-derived every time somebody reads the pool.
3. Fill the named gaps above: which Estoril number is live, Atlântico's full number, Tik
   Tapas's Instagram handle.

None of this is a migration and none of it is a schema change. It needs a terminal with the
two secrets, and a phone.

## Prompt

In the jamienisbet repo, the Neon `biz.clients` cold pool (101 prospects seeded by migration
`0022_seed_mafra_lisbon_prospects`) still has `fit_tier` null on every row, and 37 rows have
no phone, no email and no Instagram without anything flagging them. Read
`.icm/intake/triage/pool-not-yet-tiered-and-partly-unreachable.md` first, then run
`leads-enrich --retier`, `leads-enrich --all` and `--retier` again (in that order —
`packages/services/scripts/leads-enrich.ts`) against `DATABASE_URL` and `AI_GATEWAY_API_KEY`,
and work through the contact gaps the stub lists.

This needs live secrets, so it is a local session, not a cloud one. CI is the source of
truth; don't run builds, lint or typecheck locally. If any code changes fall out of it, work
on a `claude/` branch and open a PR; `git mv` this stub to `.icm/intake/triage/_done/` when
the pool is tiered and the 37 are either reachable or recorded as walk-in only.
