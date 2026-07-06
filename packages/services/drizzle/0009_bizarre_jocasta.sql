ALTER TABLE "biz"."deals" ADD COLUMN "billing_type" varchar(20) DEFAULT 'one_off' NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."deals" ADD COLUMN "recurring_amount_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."deals" ADD COLUMN "recurring_interval" varchar(10) DEFAULT 'month' NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."deals" ADD COLUMN "active_until" timestamp with time zone;