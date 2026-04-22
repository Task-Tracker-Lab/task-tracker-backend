CREATE TABLE
	"base"."project_shares" (
		"id" text PRIMARY KEY NOT NULL,
		"project_id" text NOT NULL,
		"token" text NOT NULL,
		"expires_at" timestamp
		with
			time zone,
			"created_by" text NOT NULL,
			"created_at" timestamp DEFAULT now () NOT NULL,
			CONSTRAINT "project_shares_token_unique" UNIQUE ("token")
	);

ALTER TABLE "base"."projects"
DROP CONSTRAINT "projects_share_token_unique";

DROP INDEX "base"."project_share_token_idx";

ALTER TABLE "base"."project_shares" ADD CONSTRAINT "project_shares_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "base"."projects" ("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "token_idx" ON "base"."project_shares" USING btree ("token");

CREATE INDEX "project_share_project_id_idx" ON "base"."project_shares" USING btree ("project_id");

CREATE UNIQUE INDEX "project_team_name_idx" ON "base"."projects" USING btree ("team_id", "name")
WHERE
	"base"."projects"."deleted_at" is null;

ALTER TABLE "base"."projects"
DROP COLUMN "is_publicly_viewable";

ALTER TABLE "base"."projects"
DROP COLUMN "share_token";