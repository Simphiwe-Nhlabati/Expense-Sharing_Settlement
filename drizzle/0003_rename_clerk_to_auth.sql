-- Rename clerk_id to auth_id in users table
ALTER TABLE "users" RENAME COLUMN "clerk_id" TO "auth_id";
ALTER TABLE "users" RENAME CONSTRAINT "users_clerk_id_unique" TO "users_auth_id_unique";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_auth_id" ON "users" USING btree ("auth_id");
