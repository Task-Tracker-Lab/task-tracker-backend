ALTER TYPE "base"."team_role" ADD VALUE 'owner' BEFORE 'admin';
ALTER TYPE "base"."team_role" ADD VALUE 'lead' BEFORE 'moderator';
ALTER TYPE "base"."team_role" ADD VALUE 'viewer';
ALTER TABLE "base"."teams" DROP CONSTRAINT "teams_owner_id_users_id_fk";

ALTER TABLE "base"."team_members" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE "base"."team_members" ALTER COLUMN "status" SET DEFAULT 'inactive'::text;
DROP TYPE "base"."member_status";
CREATE TYPE "base"."member_status" AS ENUM('active', 'banned', 'inactive');
ALTER TABLE "base"."team_members" ALTER COLUMN "status" SET DEFAULT 'inactive'::"base"."member_status";
ALTER TABLE "base"."team_members" ALTER COLUMN "status" SET DATA TYPE "base"."member_status" USING "status"::"base"."member_status";
ALTER TABLE "base"."teams" ADD COLUMN "deleted_at" timestamp;
ALTER TABLE "base"."teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "base"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "member_role_idx" ON "base"."team_members" USING btree ("user_id","role");
CREATE UNIQUE INDEX "team_active_slug_idx" ON "base"."teams" USING btree ("slug") WHERE "base"."teams"."deleted_at" is null;
CREATE INDEX "team_owner_idx" ON "base"."teams" USING btree ("owner_id");
CREATE INDEX "team_deleted_at_idx" ON "base"."teams" USING btree ("deleted_at");
CREATE INDEX "teams_to_tags_tag_id_idx" ON "base"."teams_to_tags" USING btree ("tag_id");