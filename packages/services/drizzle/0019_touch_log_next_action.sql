-- The touch log comes back, and the lead grows a spine — sequence 2 of the
-- lead-engine epic.
--
-- Additive and reversible. `biz.touches` is a new table (0013 dropped the old
-- one along with the AI deal pipeline it belonged to; this is a leaner table
-- with the same name, not a restore — nothing recovers those rows, and nothing
-- needs to). The three new columns on `biz.clients` are nullable, so every
-- existing row means exactly what it meant before this ran.
--
-- `channel`, `direction` and `outcome` are plain varchars with no CHECK, the
-- same convention `status`, `language` and `fit_tier` already follow: the
-- vocabularies are closed in the application (queries/touches.ts), which is
-- what lets a word be added without a migration. The cascade on `client_id` is
-- deliberate — a deleted lead's history is part of that record, not
-- free-standing data.
--
-- Two ordinary (non-concurrent) CREATE INDEX statements, which take a brief
-- write lock. `touches` is empty when this runs, and `clients` is small; take a
-- Neon branch first if you like, per the precedent 0016/0017/0018 set.

CREATE TABLE "biz"."touches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"channel" varchar(20) NOT NULL,
	"direction" varchar(3) DEFAULT 'out' NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"note" text,
	"draft_md" text,
	"model" varchar(60),
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "next_action" varchar(200);--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "next_action_due" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "biz"."clients" ADD COLUMN "wake_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "biz"."touches" ADD CONSTRAINT "touches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "touches_client_id_logged_at_idx" ON "biz"."touches" USING btree ("client_id","logged_at");--> statement-breakpoint
CREATE INDEX "clients_next_action_due_idx" ON "biz"."clients" USING btree ("next_action_due");