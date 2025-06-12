import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, check, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  currentPhase: integer("current_phase").notNull().default(1),
  submittedWebsiteUrl: text("submitted_website_url"),
  cohortTag: text("cohort_tag"),
  accessToken: text("access_token").notNull().unique(),
  avatarIcon: text("avatar_icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cohortTagIdx: index("teams_cohort_tag_idx").on(table.cohortTag),
}));

export const phaseData = pgTable("phase_data", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  phaseNumber: integer("phase_number").notNull(),
  data: jsonb("data").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const cohorts = pgTable("cohorts", {
  tag: text("tag").primaryKey(),
  name: text("name").notNull(),
  submissionsOpen: boolean("submissions_open").notNull().default(false),
  votingOpen: boolean("voting_open").notNull().default(false),
  resultsVisible: boolean("results_visible").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  cohortTag: text("cohort_tag").references(() => cohorts.tag).notNull(),
  votingTeamId: integer("voting_team_id").references(() => teams.id).notNull(),
  votedForTeamId: integer("voted_for_team_id").references(() => teams.id).notNull(),
  rank: integer("rank").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueRankPerTeam: unique("votes_cohort_team_rank_unique").on(table.cohortTag, table.votingTeamId, table.rank),
  uniqueVotePerTeam: unique("votes_cohort_voting_voted_unique").on(table.cohortTag, table.votingTeamId, table.votedForTeamId),
  noSelfVoting: check("votes_no_self_voting", sql`${table.votingTeamId} != ${table.votedForTeamId}`),
}));

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhaseDataSchema = createInsertSchema(phaseData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCohortSchema = createInsertSchema(cohorts).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

// Relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  cohort: one(cohorts, {
    fields: [teams.cohortTag],
    references: [cohorts.tag],
  }),
  phaseData: many(phaseData),
  votesGiven: many(votes, { relationName: "votingTeam" }),
  votesReceived: many(votes, { relationName: "votedForTeam" }),
}));

export const cohortsRelations = relations(cohorts, ({ many }) => ({
  teams: many(teams),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  cohort: one(cohorts, {
    fields: [votes.cohortTag],
    references: [cohorts.tag],
  }),
  votingTeam: one(teams, {
    fields: [votes.votingTeamId],
    references: [teams.id],
    relationName: "votingTeam",
  }),
  votedForTeam: one(teams, {
    fields: [votes.votedForTeamId],
    references: [teams.id],
    relationName: "votedForTeam",
  }),
}));

export const phaseDataRelations = relations(phaseData, ({ one }) => ({
  team: one(teams, {
    fields: [phaseData.teamId],
    references: [teams.id],
  }),
}));

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertPhaseData = z.infer<typeof insertPhaseDataSchema>;
export type PhaseData = typeof phaseData.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type Cohort = typeof cohorts.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
