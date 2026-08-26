CREATE TABLE "biz"."deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"value_minor" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"kind" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content_md" text,
	"content_html" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"sync_path" text,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz"."generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"document_id" uuid,
	"kind" varchar(30) NOT NULL,
	"model" varchar(80) NOT NULL,
	"stage_contract_path" text,
	"context_files" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz"."workshop_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"role" varchar(12) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biz"."deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "biz"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz"."documents" ADD CONSTRAINT "documents_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "biz"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz"."generations" ADD CONSTRAINT "generations_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "biz"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz"."generations" ADD CONSTRAINT "generations_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "biz"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz"."workshop_messages" ADD CONSTRAINT "workshop_messages_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "biz"."deals"("id") ON DELETE cascade ON UPDATE no action;