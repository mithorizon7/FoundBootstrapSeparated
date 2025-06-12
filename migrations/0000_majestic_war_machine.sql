CREATE TABLE "cohorts" (
	"tag" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"submissions_open" boolean DEFAULT false NOT NULL,
	"voting_open" boolean DEFAULT false NOT NULL,
	"results_visible" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phase_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"phase_number" integer NOT NULL,
	"data" jsonb NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"submitted_website_url" text,
	"cohort_tag" text,
	"access_token" text NOT NULL,
	"avatar_icon" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_code_unique" UNIQUE("code"),
	CONSTRAINT "teams_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_tag" text NOT NULL,
	"voting_team_id" integer NOT NULL,
	"voted_for_team_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_cohort_team_rank_unique" UNIQUE("cohort_tag","voting_team_id","rank"),
	CONSTRAINT "votes_cohort_voting_voted_unique" UNIQUE("cohort_tag","voting_team_id","voted_for_team_id"),
	CONSTRAINT "votes_no_self_voting" CHECK ("votes"."voting_team_id" != "votes"."voted_for_team_id")
);
--> statement-breakpoint
ALTER TABLE "phase_data" ADD CONSTRAINT "phase_data_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_cohort_tag_cohorts_tag_fk" FOREIGN KEY ("cohort_tag") REFERENCES "public"."cohorts"("tag") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voting_team_id_teams_id_fk" FOREIGN KEY ("voting_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voted_for_team_id_teams_id_fk" FOREIGN KEY ("voted_for_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teams_cohort_tag_idx" ON "teams" USING btree ("cohort_tag");