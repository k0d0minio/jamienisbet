-- The permanent opt-out list — sequence 3 of the lead-engine epic, and the one
-- part of it that lands before the pool is imported rather than after.
--
-- Purely additive: one new table, no column touched anywhere else, nothing
-- backfilled. Every existing row means exactly what it meant before this ran,
-- and the table is empty until somebody asks to be left alone.
--
-- `kind` is a plain varchar with no CHECK, the same convention `status`,
-- `channel` and `fit_tier` already follow: the vocabulary is closed in the
-- application (queries/suppressions.ts), which is what lets a channel be added
-- without a migration.
--
-- **No foreign key, and that is the point.** A suppression is keyed to the
-- contact point rather than to the lead it was asked through, so it survives
-- the archive, the delete, the retention purge and next spring's re-import of
-- the same business. A `client_id` here would die with the client and the next
-- import would write them straight back in.
--
-- The unique constraint on (kind, value) is what makes every write idempotent
-- — the app inserts with ON CONFLICT DO NOTHING — and what makes the import
-- script's "skip anything suppressed" check a single indexed lookup. Values
-- are stored normalized by the application (lowercased email, E.164 phone,
-- bare lowercase handle); Postgres is not asked to case-fold anything.
--
-- One ordinary CREATE TABLE, no lock on anything that exists.

CREATE TABLE "biz"."suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(20) NOT NULL,
	"value" varchar(200) NOT NULL,
	"reason" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppressions_kind_value_key" UNIQUE("kind","value")
);
