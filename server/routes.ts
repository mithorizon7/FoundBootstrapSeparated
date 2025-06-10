import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { insertTeamSchema, insertPhaseDataSchema, insertCohortSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Admin authentication middleware
function ensureAuthenticatedAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user || (req.user as any).role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/admin/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        return res.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/admin/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get("/api/auth/admin/status", (req, res) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
      res.json({ 
        isAuthenticated: true, 
        user: { 
          id: (req.user as any).id, 
          username: (req.user as any).username, 
          role: (req.user as any).role 
        } 
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Team routes
  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.get("/api/teams/:code", async (req, res) => {
    try {
      const team = await storage.getTeamByCode(req.params.code);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team" });
    }
  });

  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams" });
    }
  });

  app.patch("/api/teams/:id/phase", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { currentPhase } = req.body;
      const team = await storage.updateTeamPhase(teamId, currentPhase);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error updating team phase" });
    }
  });

  // Phase data routes
  app.post("/api/phase-data", async (req, res) => {
    try {
      const phaseData = insertPhaseDataSchema.parse(req.body);
      const saved = await storage.savePhaseData(phaseData);
      res.json(saved);
    } catch (error) {
      res.status(400).json({ message: "Invalid phase data" });
    }
  });

  app.get("/api/phase-data/:teamId/:phaseNumber", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const phaseNumber = parseInt(req.params.phaseNumber);
      const data = await storage.getPhaseData(teamId, phaseNumber);
      if (!data) {
        return res.status(404).json({ message: "Phase data not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching phase data" });
    }
  });

  app.get("/api/phase-data/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const data = await storage.getAllPhaseDataForTeam(teamId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team phase data" });
    }
  });

  app.patch("/api/phase-data/:teamId/:phaseNumber/complete", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const phaseNumber = parseInt(req.params.phaseNumber);
      const data = await storage.markPhaseComplete(teamId, phaseNumber);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error marking phase complete" });
    }
  });

  // Phase config routes
  app.get("/api/configs/phase-:id", async (req, res) => {
    try {
      const phaseId = parseInt(req.params.id);
      if (phaseId < 1 || phaseId > 8) {
        return res.status(404).json({ message: "Phase not found" });
      }
      
      const configPath = path.resolve(process.cwd(), `configs/phase-${phaseId}.json`);
      const configData = await fs.promises.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      res.json(config);
    } catch (error) {
      res.status(404).json({ message: "Phase configuration not found" });
    }
  });

  // Website submission endpoint
  app.patch("/api/teams/:teamId/website", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { website_url } = req.body;
      
      if (!website_url) {
        return res.status(400).json({ message: "Website URL is required" });
      }
      
      const team = await storage.updateTeamWebsite(teamId, website_url);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error updating website" });
    }
  });

  // Admin cohort management endpoints
  app.post("/api/admin/cohorts", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohortData = insertCohortSchema.parse(req.body);
      const cohort = await storage.createCohort(cohortData);
      res.json(cohort);
    } catch (error) {
      res.status(400).json({ message: "Invalid cohort data" });
    }
  });

  app.get("/api/admin/cohorts", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohorts = await storage.getAllCohorts();
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohorts" });
    }
  });

  app.get("/api/admin/cohorts/:cohortTag", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohort = await storage.getCohortByTag(req.params.cohortTag);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohort" });
    }
  });

  app.patch("/api/admin/cohorts/:cohortTag", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const cohort = await storage.updateCohort(req.params.cohortTag, updates);
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error updating cohort" });
    }
  });

  app.post("/api/admin/cohorts/:cohortTag/teams", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const { team_ids } = req.body;
      if (!Array.isArray(team_ids)) {
        return res.status(400).json({ message: "team_ids must be an array" });
      }
      
      const teams = await storage.assignTeamsToCohort(team_ids, req.params.cohortTag);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error assigning teams to cohort" });
    }
  });

  app.get("/api/admin/cohorts/:cohortTag/teams_status", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const teams = await storage.getTeamsByCohort(req.params.cohortTag);
      const votes = await storage.getVotesByCohort(req.params.cohortTag);
      
      const teamStatus = teams.map(team => ({
        ...team,
        hasSubmitted: !!team.submittedWebsiteUrl,
        hasVoted: votes.some(vote => vote.votingTeamId === team.id)
      }));
      
      res.json(teamStatus);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team status" });
    }
  });

  // Showcase and voting endpoints
  app.get("/api/showcase/:cohortTag", async (req, res) => {
    try {
      const teams = await storage.getSubmittedTeamsByCohort(req.params.cohortTag);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching showcase" });
    }
  });

  app.post("/api/showcase/:cohortTag/vote", async (req, res) => {
    try {
      const { votes, voting_team_id } = req.body;
      
      if (!Array.isArray(votes) || votes.length !== 3) {
        return res.status(400).json({ message: "Must provide exactly 3 votes" });
      }
      
      // Validate cohort exists and voting is open
      const cohort = await storage.getCohortByTag(req.params.cohortTag);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      if (!cohort.votingOpen) {
        return res.status(400).json({ message: "Voting is not open for this cohort" });
      }
      
      // Validate voting team is in cohort
      const votingTeam = await storage.getTeamById(voting_team_id);
      if (!votingTeam || votingTeam.cohortTag !== req.params.cohortTag) {
        return res.status(400).json({ message: "Team not found in this cohort" });
      }
      
      // Check if team already voted
      const existingVotes = await storage.getVotesByTeam(req.params.cohortTag, voting_team_id);
      if (existingVotes.length > 0) {
        return res.status(400).json({ message: "Team has already voted" });
      }
      
      // Validate vote structure
      const ranks = votes.map(v => v.rank);
      if (!ranks.includes(1) || !ranks.includes(2) || !ranks.includes(3)) {
        return res.status(400).json({ message: "Must include ranks 1, 2, and 3" });
      }
      
      // Prevent self-voting
      if (votes.some(v => v.voted_for_team_id === voting_team_id)) {
        return res.status(400).json({ message: "Cannot vote for your own team" });
      }
      
      const voteData = votes.map(vote => ({
        cohortTag: req.params.cohortTag,
        votingTeamId: voting_team_id,
        votedForTeamId: vote.voted_for_team_id,
        rank: vote.rank
      }));
      
      const submittedVotes = await storage.submitVotes(voteData);
      res.json(submittedVotes);
    } catch (error) {
      res.status(500).json({ message: "Error submitting votes" });
    }
  });

  app.get("/api/showcase/:cohortTag/results", async (req, res) => {
    try {
      const results = await storage.getVotingResults(req.params.cohortTag);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching results" });
    }
  });

  // Admin CSV export (protected)
  app.get("/api/admin/export", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      const csvRows = [
        'Team Code,Team Name,Current Phase,Cohort,Website URL,Created At,Updated At'
      ];
      
      for (const team of teams) {
        csvRows.push(
          `${team.code},${team.name},${team.currentPhase},${team.cohortTag || ''},${team.submittedWebsiteUrl || ''},${team.createdAt?.toISOString()},${team.updatedAt?.toISOString()}`
        );
      }
      
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="teams-export.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Error exporting data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
