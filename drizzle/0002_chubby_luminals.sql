CREATE TABLE "rate_limit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"path" text NOT NULL,
	"method" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_rate_limit_ip_timestamp" ON "rate_limit_logs" USING btree ("ip","timestamp");