CREATE TYPE "public"."lead_source" AS ENUM('WEBSITE', 'REFERRAL', 'DIRECT', 'SOCIAL', 'ADVERTISING', 'EVENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('RESIDENTIAL', 'COMMERCIAL', 'INTERIOR', 'LANDSCAPE', 'RENOVATION', 'OTHER');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"source" "lead_source",
	"project_type" "project_type",
	"estimated_budget" numeric(12, 2),
	"location" varchar(255),
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"converted_to_client_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_tenant_id_idx" ON "leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");