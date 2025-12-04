DO $$ BEGIN
 CREATE TYPE "public"."currency" AS ENUM('EUR', 'USD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"picture_url" text NOT NULL,
	"start_date" timestamp (3) with time zone NOT NULL,
	"end_date" timestamp (3) with time zone,
	"address" text,
	"draft" boolean DEFAULT false NOT NULL,
	"student_office_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "liked_event" (
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	CONSTRAINT "liked_event_user_id_event_id_pk" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" "currency" NOT NULL,
	"price" text NOT NULL,
	"picture_url" text,
	"student_office_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_on" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_on" timestamp (3) with time zone,
	"student_office_id" integer NOT NULL,
	"poll_options" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_office" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_name" text NOT NULL,
	"description" text,
	"profile_picture_url" text,
	"cover_picture_url" text,
	"domain" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket" (
	"uid" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ticket_option_id" integer NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_option" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" "currency" NOT NULL,
	"price" text NOT NULL,
	"total_quantity" integer,
	"event_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"email" text NOT NULL,
	"school_email" text,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"profile_picture_url" text,
	"student_office_id" integer,
	CONSTRAINT "user_login_unique" UNIQUE("login"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_school_email_unique" UNIQUE("school_email"),
	CONSTRAINT "user_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote" (
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"option_index" integer NOT NULL,
	CONSTRAINT "vote_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_student_office_id_student_office_id_fk" FOREIGN KEY ("student_office_id") REFERENCES "public"."student_office"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_event" ADD CONSTRAINT "liked_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_event" ADD CONSTRAINT "liked_event_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_student_office_id_student_office_id_fk" FOREIGN KEY ("student_office_id") REFERENCES "public"."student_office"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_student_office_id_student_office_id_fk" FOREIGN KEY ("student_office_id") REFERENCES "public"."student_office"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket" ADD CONSTRAINT "ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket" ADD CONSTRAINT "ticket_ticket_option_id_ticket_option_id_fk" FOREIGN KEY ("ticket_option_id") REFERENCES "public"."ticket_option"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_option" ADD CONSTRAINT "ticket_option_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_student_office_id_student_office_id_fk" FOREIGN KEY ("student_office_id") REFERENCES "public"."student_office"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
