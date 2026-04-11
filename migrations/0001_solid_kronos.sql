CREATE TABLE "base"."user_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "base"."user_notifications" (
	"user_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{"email":{"task_assigned":true,"mentions":true,"daily_summary":false},"push":{"task_assigned":true,"reminders":true}}'::jsonb NOT NULL
);

CREATE TABLE "base"."user_security" (
	"user_id" text PRIMARY KEY NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_2fa_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"last_password_change" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "base"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"middle_name" varchar(50),
	"email" varchar(255) NOT NULL,
	"bio" text,
	"avatar_url" varchar(512),
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"language" varchar(5) DEFAULT 'ru' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "base"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_type" varchar(20),
	"browser" varchar(50),
	"os" varchar(50),
	"user_agent" text NOT NULL,
	"ip" varchar(45) NOT NULL,
	"city" varchar(100),
	"country_code" varchar(5),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL
);

ALTER TABLE "base"."user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "base"."user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "base"."user_security" ADD CONSTRAINT "user_security_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "base"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;