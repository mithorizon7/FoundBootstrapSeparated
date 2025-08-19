import { teams, phaseData, users, cohorts, votes, type Team, type InsertTeam, type PhaseData, type InsertPhaseData, type User, type InsertUser, type Cohort, type InsertCohort, type Vote, type InsertVote } from "@shared/schema";
import { selectRandomAvatar } from "@shared/avatars";
import { db } from "./db";
import { eq, and, isNotNull, sql, desc, asc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamById(id: number): Promise<Team | undefined>;
  getTeamByAccessToken(accessToken: string): Promise<Team | undefined>;
  updateTeamPhase(id: number, currentPhase: number): Promise<Team>;
  updateTeamWebsite(id: number, websiteUrl: string | null): Promise<Team>;
  updateTeamAvatar(id: number, avatarIcon: string): Promise<Team>;
  assignTeamsToCohort(teamIds: number[], cohortTag: string): Promise<Team[]>;
  unassignTeamsFromCohort(teamIds: number[]): Promise<void>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByCohort(cohortTag: string): Promise<Team[]>;
  getSubmittedTeamsByCohort(cohortTag: string): Promise<Team[]>;
  
  // Phase data operations
  savePhaseData(data: InsertPhaseData): Promise<PhaseData>;
  getPhaseData(teamId: number, phaseNumber: number): Promise<PhaseData | undefined>;
  getAllPhaseDataForTeam(teamId: number): Promise<PhaseData[]>;
  markPhaseComplete(teamId: number, phaseNumber: number): Promise<PhaseData>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Cohort operations
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  getCohortByTag(tag: string): Promise<Cohort | undefined>;
  getAllCohorts(): Promise<Cohort[]>;
  getActiveCohorts(): Promise<Cohort[]>;
  getArchivedCohorts(): Promise<Cohort[]>;
  updateCohort(tag: string, updates: Partial<InsertCohort>): Promise<Cohort>;
  archiveCohort(tag: string): Promise<Cohort>;
  unarchiveCohort(tag: string): Promise<Cohort>;
  
  // Voting operations
  submitVotes(votes: InsertVote[]): Promise<Vote[]>;
  getVotesByCohort(cohortTag: string): Promise<Vote[]>;
  getVotesByTeam(cohortTag: string, teamId: number): Promise<Vote[]>;
  getVotingResults(cohortTag: string): Promise<Array<{teamId: number, teamName: string, totalPoints: number, votes: Array<{rank: number, count: number}>}>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    // Get the last 15 teams to avoid avatar collisions
    const recentTeams = await db
      .select({ avatarIcon: teams.avatarIcon })
      .from(teams)
      .orderBy(desc(teams.createdAt))
      .limit(15);
    
    const recentAvatars = recentTeams.map(team => team.avatarIcon);
    const selectedAvatar = selectRandomAvatar(recentAvatars);
    
    const teamWithTokenAndAvatar: InsertTeam = {
      ...insertTeam,
      accessToken: insertTeam.accessToken || randomUUID(),
      avatarIcon: insertTeam.avatarIcon || selectedAvatar,
    };
    
    const [team] = await db
      .insert(teams)
      .values(teamWithTokenAndAvatar)
      .returning();
    return team;
  }

  async getTeamByCode(code: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.code, code));
    return team || undefined;
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamByAccessToken(accessToken: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.accessToken, accessToken));
    return team || undefined;
  }

  async updateTeamPhase(id: number, currentPhase: number): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ 
        currentPhase,
        updatedAt: new Date()
      })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async updateTeamWebsite(id: number, websiteUrl: string | null): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ 
        submittedWebsiteUrl: websiteUrl,
        updatedAt: new Date()
      })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async updateTeamAvatar(id: number, avatarIcon: string): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ 
        avatarIcon,
        updatedAt: new Date()
      })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async assignTeamsToCohort(teamIds: number[], cohortTag: string): Promise<Team[]> {
    if (teamIds.length === 0) {
      return [];
    }
    const updatedTeams = await db
      .update(teams)
      .set({ 
        cohortTag,
        updatedAt: new Date()
      })
      .where(inArray(teams.id, teamIds))
      .returning();
    
    return updatedTeams;
  }

  async unassignTeamsFromCohort(teamIds: number[]): Promise<void> {
    if (teamIds.length === 0) {
      return;
    }
    await db
      .update(teams)
      .set({ cohortTag: null, updatedAt: new Date() })
      .where(inArray(teams.id, teamIds));
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(desc(teams.updatedAt));
  }

  async getTeamsByCohort(cohortTag: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.cohortTag, cohortTag));
  }

  async getSubmittedTeamsByCohort(cohortTag: string): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(and(
        eq(teams.cohortTag, cohortTag),
        isNotNull(teams.submittedWebsiteUrl),
        sql`trim(${teams.submittedWebsiteUrl}) != ''`
      ));
  }

  async savePhaseData(insertData: InsertPhaseData): Promise<PhaseData> {
    const existing = await this.getPhaseData(insertData.teamId, insertData.phaseNumber);
    
    if (existing) {
      const [updated] = await db
        .update(phaseData)
        .set({
          data: insertData.data,
          updatedAt: new Date()
        })
        .where(eq(phaseData.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(phaseData)
        .values(insertData)
        .returning();
      return created;
    }
  }

  async getPhaseData(teamId: number, phaseNumber: number): Promise<PhaseData | undefined> {
    const data = await db
      .select()
      .from(phaseData)
      .where(and(eq(phaseData.teamId, teamId), eq(phaseData.phaseNumber, phaseNumber)));
    return data[0] || undefined;
  }

  async getAllPhaseDataForTeam(teamId: number): Promise<PhaseData[]> {
    return await db
      .select()
      .from(phaseData)
      .where(eq(phaseData.teamId, teamId));
  }

  async markPhaseComplete(teamId: number, phaseNumber: number): Promise<PhaseData> {
    const existing = await this.getPhaseData(teamId, phaseNumber);
    if (!existing) {
      throw new Error('Phase data not found');
    }

    const [updated] = await db
      .update(phaseData)
      .set({
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(phaseData.id, existing.id))
      .returning();
    return updated;
  }

  // Cohort operations
  async createCohort(insertCohort: InsertCohort): Promise<Cohort> {
    const [cohort] = await db
      .insert(cohorts)
      .values(insertCohort)
      .returning();
    return cohort;
  }

  async getCohortByTag(tag: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.tag, tag));
    return cohort || undefined;
  }

  async getAllCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts).orderBy(asc(cohorts.createdAt));
  }

  async getActiveCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts).where(eq(cohorts.archived, false)).orderBy(asc(cohorts.createdAt));
  }

  async getArchivedCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts).where(eq(cohorts.archived, true)).orderBy(asc(cohorts.createdAt));
  }

  async updateCohort(tag: string, updates: Partial<InsertCohort>): Promise<Cohort> {
    const [cohort] = await db
      .update(cohorts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(cohorts.tag, tag))
      .returning();
    return cohort;
  }

  async archiveCohort(tag: string): Promise<Cohort> {
    const [cohort] = await db
      .update(cohorts)
      .set({
        archived: true,
        updatedAt: new Date()
      })
      .where(eq(cohorts.tag, tag))
      .returning();
    return cohort;
  }

  async unarchiveCohort(tag: string): Promise<Cohort> {
    const [cohort] = await db
      .update(cohorts)
      .set({
        archived: false,
        updatedAt: new Date()
      })
      .where(eq(cohorts.tag, tag))
      .returning();
    return cohort;
  }

  // Voting operations
  async submitVotes(insertVotes: InsertVote[]): Promise<Vote[]> {
    const votesData = await db
      .insert(votes)
      .values(insertVotes)
      .returning();
    return votesData;
  }

  async getVotesByCohort(cohortTag: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.cohortTag, cohortTag));
  }

  async getVotesByTeam(cohortTag: string, teamId: number): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.cohortTag, cohortTag),
        eq(votes.votingTeamId, teamId)
      ));
  }

  async getVotingResults(cohortTag: string): Promise<Array<{teamId: number, teamName: string, totalPoints: number, votes: Array<{rank: number, count: number}>}>> {
    // Calculate points: Rank 1 = 3 points, Rank 2 = 2 points, Rank 3 = 1 point
    const results = await db
      .select({
        teamId: votes.votedForTeamId,
        teamName: teams.name,
        rank: votes.rank,
        count: sql<number>`count(*)::int`,
      })
      .from(votes)
      .innerJoin(teams, eq(votes.votedForTeamId, teams.id))
      .where(eq(votes.cohortTag, cohortTag))
      .groupBy(votes.votedForTeamId, teams.name, votes.rank)
      .orderBy(votes.votedForTeamId, votes.rank);

    // Aggregate results by team
    const aggregated = new Map<number, {teamId: number, teamName: string, totalPoints: number, votes: Array<{rank: number, count: number}>}>();
    
    for (const result of results) {
      if (!aggregated.has(result.teamId)) {
        aggregated.set(result.teamId, {
          teamId: result.teamId,
          teamName: result.teamName,
          totalPoints: 0,
          votes: []
        });
      }
      
      const team = aggregated.get(result.teamId)!;
      const points = result.rank === 1 ? 3 : result.rank === 2 ? 2 : 1;
      team.totalPoints += points * result.count;
      team.votes.push({ rank: result.rank, count: result.count });
    }

    return Array.from(aggregated.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }
}

export const storage = new DatabaseStorage();
