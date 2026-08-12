-- The customer form builder. One row per questionnaire sent to one lead: the
-- primary key doubles as the unguessable link token the customer opens, and
-- `form_snapshot` is the markdown from `.icm/onboarding/` frozen at send time,
-- so editing a question never rewrites a form already in someone's inbox.
-- `answers` stays null until they submit; `completed_at` spends the link.
-- Purely additive — a new table, nothing existing is touched.
CREATE TABLE "biz"."form_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"form_slug" varchar(100) NOT NULL,
	"form_snapshot" jsonb NOT NULL,
	"answers" jsonb,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "biz"."form_links" ADD CONSTRAINT "form_links_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE cascade ON UPDATE no action;