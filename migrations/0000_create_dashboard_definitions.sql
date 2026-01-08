-- Feature Pack: dashboard-core
-- Purpose: Ensure dashboard definition storage tables exist.
-- NOTE: These tables are also defined in Drizzle schema, but keeping this idempotent
-- SQL initializer prevents "seed before table exists" failures in drifted/local envs.

CREATE TABLE IF NOT EXISTS "dashboard_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL,
  "owner_user_id" varchar(255) NOT NULL DEFAULT 'system',
  "is_system" boolean NOT NULL DEFAULT true,
  "name" text NOT NULL,
  "description" text,
  "visibility" varchar(16) NOT NULL DEFAULT 'public',
  "scope" jsonb NOT NULL DEFAULT '{"kind":"global"}'::jsonb,
  "version" integer NOT NULL DEFAULT 0,
  "definition" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_definitions_key_unique"
  ON "dashboard_definitions" ("key");

CREATE INDEX IF NOT EXISTS "dashboard_definitions_scope_idx"
  ON "dashboard_definitions" ("scope");

CREATE INDEX IF NOT EXISTS "dashboard_definitions_owner_idx"
  ON "dashboard_definitions" ("owner_user_id");

CREATE INDEX IF NOT EXISTS "dashboard_definitions_visibility_idx"
  ON "dashboard_definitions" ("visibility");

CREATE INDEX IF NOT EXISTS "dashboard_definitions_is_system_idx"
  ON "dashboard_definitions" ("is_system");

CREATE TABLE IF NOT EXISTS "dashboard_definition_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "dashboard_id" uuid NOT NULL,
  "principal_type" varchar(16) NOT NULL,
  "principal_id" varchar(255) NOT NULL,
  "permission" varchar(16) NOT NULL DEFAULT 'view',
  "shared_by" varchar(255) NOT NULL,
  "shared_by_name" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dashboard_definition_shares_dashboard_idx"
  ON "dashboard_definition_shares" ("dashboard_id");

CREATE INDEX IF NOT EXISTS "dashboard_definition_shares_principal_idx"
  ON "dashboard_definition_shares" ("principal_type", "principal_id");

CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_definition_shares_unique"
  ON "dashboard_definition_shares" ("dashboard_id", "principal_type", "principal_id");

-- Foreign key (best-effort). If it already exists, ignore duplicate_object.
DO $$ BEGIN
  ALTER TABLE "dashboard_definition_shares"
    ADD CONSTRAINT "dashboard_definition_shares_dashboard_id_dashboard_definitions_id_fk"
    FOREIGN KEY ("dashboard_id") REFERENCES "dashboard_definitions" ("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

