CREATE TYPE "base"."team_role" AS ENUM ('admin', 'moderator', 'member');

CREATE TYPE "base"."member_status" AS ENUM ('pending', 'active', 'declined', 'banned');

CREATE TABLE
	"base"."tags" (
		"id" text PRIMARY KEY NOT NULL,
		"name" varchar(50) NOT NULL,
		CONSTRAINT "tags_name_unique" UNIQUE ("name")
	);

CREATE TABLE
	"base"."team_members" (
		"team_id" text NOT NULL,
		"user_id" text NOT NULL,
		"role" "base"."team_role" DEFAULT 'member' NOT NULL,
		"status" "base"."member_status" DEFAULT 'pending' NOT NULL,
		"joined_at" timestamp,
		"created_at" timestamp DEFAULT now () NOT NULL,
		CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY ("team_id", "user_id")
	);

CREATE TABLE
	"base"."teams" (
		"id" text PRIMARY KEY NOT NULL,
		"slug" varchar(120) NOT NULL,
		"name" varchar(100) NOT NULL,
		"description" text,
		"avatar_url" text,
		"cover_url" text,
		"owner_id" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL,
		CONSTRAINT "teams_slug_unique" UNIQUE ("slug")
	);

CREATE TABLE
	"base"."teams_to_tags" (
		"team_id" text NOT NULL,
		"tag_id" text NOT NULL,
		CONSTRAINT "teams_to_tags_team_id_tag_id_pk" PRIMARY KEY ("team_id", "tag_id")
	);

ALTER TABLE "base"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "base"."teams" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "base"."team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "base"."teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "base"."users" ("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "base"."teams_to_tags" ADD CONSTRAINT "teams_to_tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "base"."teams" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "base"."teams_to_tags" ADD CONSTRAINT "teams_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "base"."tags" ("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "member_status_idx" ON "base"."team_members" USING btree ("status");

CREATE INDEX "team_slug_idx" ON "base"."teams" USING btree ("slug");