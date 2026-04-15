CREATE TYPE "base"."project_status" AS ENUM('active', 'archived', 'template');
CREATE TYPE "base"."project_visibility" AS ENUM('public', 'private');
CREATE TABLE "base"."projects" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"key" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(255),
	"color" varchar(7),
	"status" "base"."project_status" DEFAULT 'active' NOT NULL,
	"task_sequence" integer DEFAULT 0 NOT NULL,
	"owner_id" text,
	"visibility" "base"."project_visibility" DEFAULT 'public' NOT NULL,
	"is_publicly_viewable" boolean DEFAULT false NOT NULL,
	"share_token" varchar(64),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "projects_share_token_unique" UNIQUE("share_token")
);

ALTER TABLE "base"."projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "base"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "base"."projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "base"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "project_team_key_idx" ON "base"."projects" USING btree ("team_id","key") WHERE "base"."projects"."deleted_at" is null;
CREATE INDEX "project_owner_id_idx" ON "base"."projects" USING btree ("owner_id");
CREATE INDEX "project_team_id_idx" ON "base"."projects" USING btree ("team_id");
CREATE INDEX "project_share_token_idx" ON "base"."projects" USING btree ("share_token");