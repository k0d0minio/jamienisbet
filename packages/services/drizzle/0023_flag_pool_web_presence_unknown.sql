-- Flag the seeded pool's no-website rows for a human check — without inventing
-- a grade for them.
--
-- Migration 0022 landed 101 prospects. 34 of them carry neither a `website_url`
-- nor a `website_grade`, which puts them in a blind spot with two sides:
--
--   `listEnrichable` (packages/services/src/queries/enrichment.ts) requires a
--   non-empty `website_url`, because there is no page to fetch without one and
--   "a model asked to read a page that does not exist is a model asked to
--   invent one". So the enrichment pass will never reach these 34, however
--   many times it runs.
--
--   `deriveFitTier` (packages/services/src/tiering.ts) scores an ungraded row
--   1 on `need`, the signal worth three. So they sit mid-pool indefinitely —
--   below a business with a merely dated site, whatever their actual presence
--   turns out to be.
--
-- The obvious fix is the wrong one. Writing `website_grade = 'none'` across
-- them would close the gap in one statement, and it would be 34 assertions
-- nobody checked: 0022's own caveat is that a blank cell means "could not
-- confirm from an official source", never "does not exist". Their `notes` bear
-- that out — 26 of the 34 say only "Listed via Google" or "Listed via
-- directory", and a directory listing is not evidence of no website; a Google
-- Business profile usually carries one. Exactly one row ("Sunset Surf Lodge —
-- no own site confirmed") supports the grade, and one flatly contradicts it
-- ("Salty Souls Surf School — Sold via Expedia and their own site"), which is
-- a row that needs its URL found, not its presence denied.
--
-- Nor is there a cautious letter to reach for. Every non-null grade scores at
-- least 2 on `need` where null scores 1, and `none` and `social_only` both
-- score the maximum 3 — so any grade invented here can only push these rows
-- *up* the call list. A wrong guess does not add noise; it puts a fabricated
-- assessment at the top of a Monday, in front of a stranger, on a pool whose
-- first cold message has not gone out yet.
--
-- So this migration writes no facts about anybody's website. It writes the
-- **work**: a dated next action, which is the one mechanism the schema has for
-- "somebody has to look at this". `website_grade`, `website_url` and
-- `fit_tier` are untouched — the tiering inputs stay exactly as honest as they
-- were, and the letter remains arithmetic over stored facts that a `--retier`
-- re-runs (the rule 0021 and 0022 both state).
--
-- **The date is not optional.** `unplannedWhere` in queries/crack-finder.ts
-- counts a next action with no due date as the same crack as no next action at
-- all — "an action with no due date never reaches the queue above, so it is a
-- decision that was made and then lost". Setting the text alone would be worse
-- than leaving the column null: it would look planned and surface nowhere. The
-- pair is what puts these rows in `listDueOutreach`.
--
-- All 34 come due on the same day, deliberately. This is one sitting with a
-- phone and a browser rather than a schedule, and the queue caps itself at ten
-- — re-dating them from the dashboard is a normal edit, and a cheaper one than
-- a migration guessing at a work plan.
--
-- Guards, so this is safe against a table somebody has worked since 0022:
--
--   1. Scoped to the batch — `source = 'import'` and the same `source_detail`
--      string 0022 stamped. No other import and no hand-added row is touched.
--   2. Only the blind spot — both `website_url` and `website_grade` still
--      null. A row somebody has since graded, or found a URL for, is done and
--      is left alone.
--   3. Never clobbers a plan. A row that already carries a `next_action` or a
--      `next_action_due` keeps both; this only ever fills a pair of nulls,
--      which also makes re-running it a no-op.
--   4. Live rows on a rung that owes something. `nurture` is excluded for the
--      reason queries/clients.ts gives — a parked relationship's whole point is
--      that nothing is planned, and asking it for a next action would turn
--      every parked row into a crack.
--
-- What closes the gap for real is a person confirming each one and setting the
-- grade, after which `leads-enrich --retier` picks the points up. This
-- migration only makes sure the 34 are asked about instead of quietly sorting
-- mid-pool forever. See .icm/intake/triage/pool-untiered-and-unverified.md.

UPDATE "biz"."clients"
   SET "next_action" = 'Confirm whether they have a website, then grade it',
       -- End of the day the migration lands, in the database's timezone: due
       -- today rather than instantly overdue, which would sort these ahead of
       -- outreach that genuinely slipped.
       "next_action_due" =
         date_trunc('day', now()) + interval '1 day' - interval '1 second'
 WHERE "source" = 'import'
   AND "source_detail" = '2026-07-23 Mafra/Lisbon prospect list'
   AND "archived_at" IS NULL
   AND "status" IN ('prospect', 'lead', 'discussing')
   AND "website_url" IS NULL
   AND "website_grade" IS NULL
   AND "next_action" IS NULL
   AND "next_action_due" IS NULL;
