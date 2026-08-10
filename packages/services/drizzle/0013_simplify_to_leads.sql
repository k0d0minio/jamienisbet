-- Simplify the dashboard to leads + money. The deal pipeline and the AI
-- document generation it drove are gone, so are the tables behind them:
-- deals, documents (their versioned artifacts), generations (AI provenance),
-- touches (draft outreach emails), workshop_messages (the brainstorm chat).
-- IRREVERSIBLE — take a Neon backup/branch before running this if any of those
-- rows still matter. What survives is one row per person (clients), now
-- carrying what the relationship is worth, plus tasks and compliance_dates.
DROP TABLE "biz"."deals" CASCADE;--> statement-breakpoint
DROP TABLE "biz"."documents" CASCADE;--> statement-breakpoint
DROP TABLE "biz"."generations" CASCADE;--> statement-breakpoint
DROP TABLE "biz"."touches" CASCADE;--> statement-breakpoint
DROP TABLE "biz"."workshop_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "value_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "billing_type" varchar(20) DEFAULT 'one_off' NOT NULL;