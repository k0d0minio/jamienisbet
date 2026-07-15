CREATE TABLE "biz"."compliance_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"notes" text,
	"due_date" timestamp with time zone NOT NULL,
	"recurrence" varchar(20) DEFAULT 'none' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"notes" text,
	"client_id" uuid,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "last_touched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "biz"."tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE set null ON UPDATE no action;