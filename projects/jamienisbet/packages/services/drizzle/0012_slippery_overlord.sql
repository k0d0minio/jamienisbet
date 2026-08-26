CREATE TABLE "biz"."touches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"content_md" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"logged_at" timestamp with time zone,
	"channel" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biz"."generations" ALTER COLUMN "deal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "biz"."generations" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "biz"."touches" ADD CONSTRAINT "touches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz"."generations" ADD CONSTRAINT "generations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE cascade ON UPDATE no action;