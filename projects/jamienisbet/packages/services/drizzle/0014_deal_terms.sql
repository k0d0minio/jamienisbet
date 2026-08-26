-- What an engagement is worth in euros was never the whole story: some are
-- traded for work rather than invoiced, some pay a cut of the client's revenue
-- through Stripe, some pay in equity. These five columns put all of that on the
-- lead row so it reads at a glance. Purely additive — every existing row lands
-- on 'cash' with no commission, no stake, and work not yet marked as started.
ALTER TABLE "biz"."clients" ADD COLUMN "deal_type" varchar(20) DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "barter_terms" text;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "commission_bps" integer;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "equity_bps" integer;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "work_started_at" timestamp with time zone;