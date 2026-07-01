CREATE SCHEMA "biz";
--> statement-breakpoint
CREATE TABLE "biz"."contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"source" varchar(50) DEFAULT 'portfolio' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz"."referral_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code" varchar(40) NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_phone" varchar(40) NOT NULL,
	"customer_email" varchar(200),
	"need" text NOT NULL,
	"budget" varchar(40),
	"preferred_call_time" varchar(20),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
