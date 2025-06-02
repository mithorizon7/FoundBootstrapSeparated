import { teams, phaseData, type Team, type InsertTeam, type PhaseData, type InsertPhaseData, type User, type InsertUser } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private teams: Map<number, Team>;
  private phaseDataMap: Map<string, PhaseData>;
  private users: Map<number, User>;
  private currentTeamId: number;
  private currentPhaseDataId: number;
  private currentUserId: number;

  constructor() {
    this.teams = new Map();
    this.phaseDataMap = new Map();
    this.users = new Map();
    this.currentTeamId = 1;
    this.currentPhaseDataId = 1;
    this.currentUserId = 1;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = {
      ...insertTeam,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async getTeamByCode(code: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.code === code);
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async updateTeamPhase(id: number, currentPhase: number): Promise<Team> {
    const team = this.teams.get(id);
    if (!team) {
      throw new Error('Team not found');
    }
    const updatedTeam: Team = {
      ...team,
      currentPhase,
      updatedAt: new Date(),
    };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async savePhaseData(insertData: InsertPhaseData): Promise<PhaseData> {
    const key = `${insertData.teamId}-${insertData.phaseNumber}`;
    const existing = this.phaseDataMap.get(key);
    
    if (existing) {
      const updated: PhaseData = {
        ...existing,
        data: insertData.data,
        updatedAt: new Date(),
      };
      this.phaseDataMap.set(key, updated);
      return updated;
    } else {
      const id = this.currentPhaseDataId++;
      const data: PhaseData = {
        ...insertData,
        id,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.phaseDataMap.set(key, data);
      return data;
    }
  }

  async getPhaseData(teamId: number, phaseNumber: number): Promise<PhaseData | undefined> {
    const key = `${teamId}-${phaseNumber}`;
    return this.phaseDataMap.get(key);
  }

  async getAllPhaseDataForTeam(teamId: number): Promise<PhaseData[]> {
    return Array.from(this.phaseDataMap.values()).filter(data => data.teamId === teamId);
  }

  async markPhaseComplete(teamId: number, phaseNumber: number): Promise<PhaseData> {
    const key = `${teamId}-${phaseNumber}`;
    const data = this.phaseDataMap.get(key);
    if (!data) {
      throw new Error('Phase data not found');
    }
    const updated: PhaseData = {
      ...data,
      completedAt: new Date(),
      updatedAt: new Date(),
    };
    this.phaseDataMap.set(key, updated);
    return updated;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
