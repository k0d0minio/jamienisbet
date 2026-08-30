-- Grow the ladder for the cold pool, and give a row the profile a cold pool
-- needs — the shape sequence 1 of the lead-engine epic asked for.
--
-- Purely additive, and deliberately so. `status` is a plain varchar(20) with no
-- CHECK constraint, so the two new rungs ('prospect', 'nurture') need no DDL at
-- all: they are new strings the application now names, and the column default
-- stays 'lead' because an inbound intake is still a lead. Nothing moves. No row
-- is updated, nothing is renamed, and every existing row means exactly what it
-- meant before this ran — unlike 0016 and 0017, this one is reversible by
-- dropping the columns.
--
-- The eleven new columns are all nullable: an inbound lead has none of them and
-- is not lying by omission. `source` likewise gains 'import' as a value the
-- application accepts, not as a constraint change.
--
-- The two indexes are what an imported pool costs. `status` is what every
-- screen partitions on and stops being free once the cold rows outnumber the
-- relationships; `last_touched_at` is the varying half of the list's
-- `coalesce(last_touched_at, created_at)` sort. Both are ordinary (non-
-- concurrent) CREATE INDEX statements, which take a brief write lock — nothing
-- at this table's size, but take a Neon branch first if you like, per the
-- precedent 0016/0017 set.

ALTER TABLE "biz"."clients" ADD COLUMN "source_detail" varchar(200);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "sector" varchar(60);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "town" varchar(80);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "language" varchar(8);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "hook" text;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "fit_tier" varchar(1);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "website_url" varchar(300);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "website_grade" varchar(20);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "whatsapp" varchar(40);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "instagram" varchar(100);--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "biz"."clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_last_touched_at_idx" ON "biz"."clients" USING btree ("last_touched_at");