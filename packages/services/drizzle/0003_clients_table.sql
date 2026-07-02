CREATE TABLE "biz"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200),
	"phone" varchar(40),
	"company" varchar(120),
	"source" varchar(30) DEFAULT 'portfolio' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"intake_message" text,
	"service" varchar(40),
	"referral_code" varchar(40),
	"budget" varchar(40),
	"preferred_call_time" varchar(20),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
-- Backfill: fold existing intakes into the unified clients table before the old
-- tables are dropped, so no captured lead is lost. Contact enquiries had no
-- status, so they start at 'new'; referral leads carry their pipeline status
-- across unchanged (new/contacted/won/lost are all valid client statuses).
INSERT INTO "biz"."clients" (
	"id", "name", "email", "source", "status", "intake_message", "service", "created_at", "archived_at"
)
SELECT
	"id", "name", "email", "source", 'new', "message", "service", "created_at", "archived_at"
FROM "biz"."contact_submissions";
--> statement-breakpoint
INSERT INTO "biz"."clients" (
	"id", "name", "email", "phone", "source", "status", "intake_message", "referral_code", "budget", "preferred_call_time", "created_at", "archived_at"
)
SELECT
	"id", "customer_name", "customer_email", "customer_phone", 'referral', "status", "need", "referral_code", "budget", "preferred_call_time", "created_at", "archived_at"
FROM "biz"."referral_leads";
--> statement-breakpoint
DROP TABLE "biz"."contact_submissions" CASCADE;--> statement-breakpoint
DROP TABLE "biz"."referral_leads" CASCADE;