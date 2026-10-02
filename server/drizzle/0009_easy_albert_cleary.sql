ALTER TABLE "users" ADD COLUMN "auth_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;