-- hit:schema-only
-- Auto-generated from pack schema; app Drizzle migrations handle tables.

CREATE TABLE "dashboard_definition_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"principal_type" varchar(16) NOT NULL,
	"principal_id" varchar(255) NOT NULL,
	"permission" varchar(16) DEFAULT 'view' NOT NULL,
	"shared_by" varchar(255) NOT NULL,
	"shared_by_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_definition_shares_unique" UNIQUE("dashboard_id","principal_type","principal_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"owner_user_id" varchar(255) DEFAULT 'system' NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"scope" jsonb DEFAULT '{"kind":"global"}'::jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "dashboard_definition_shares" ADD CONSTRAINT "dashboard_definition_shares_dashboard_id_dashboard_definitions_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_definition_shares_dashboard_idx" ON "dashboard_definition_shares" USING btree ("dashboard_id");--> statement-breakpoint
CREATE INDEX "dashboard_definition_shares_principal_idx" ON "dashboard_definition_shares" USING btree ("principal_type","principal_id");--> statement-breakpoint
CREATE INDEX "dashboard_definitions_scope_idx" ON "dashboard_definitions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "dashboard_definitions_owner_idx" ON "dashboard_definitions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "dashboard_definitions_visibility_idx" ON "dashboard_definitions" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "dashboard_definitions_is_system_idx" ON "dashboard_definitions" USING btree ("is_system");