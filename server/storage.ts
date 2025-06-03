import { teams, phaseData, users, cohorts, votes, type Team, type InsertTeam, type PhaseData, type InsertPhaseData, type User, type InsertUser, type Cohort, type InsertCohort, type Vote, type InsertVote } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNotNull, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamById(id: number): Promise<Team | undefined>;
  updateTeamPhase(id: number, currentPhase: number): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  
  // Phase data operations
  savePhaseData(data: InsertPhaseData): Promise<PhaseData>;
  getPhaseData(teamId: number, phaseNumber: number): Promise<PhaseData | undefined>;
  getAllPhaseDataForTeam(teamId: number): Promise<PhaseData[]>;
  markPhaseComplete(teamId: number, phaseNumber: number): Promise<PhaseData>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
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

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
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
}

export const storage = new DatabaseStorage();
