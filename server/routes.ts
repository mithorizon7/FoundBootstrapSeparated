import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { insertTeamSchema, insertPhaseDataSchema, insertCohortSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Extend session interface to include teamId
declare module 'express-session' {
  interface SessionData {
    teamId?: number;
  }
}

// Admin authentication middleware
function ensureAuthenticatedAdmin(req: Request, res: Response, next: NextFunction) {
  console.log('Auth check - isAuthenticated:', req.isAuthenticated(), 'user:', req.user ? { id: (req.user as any).id, role: (req.user as any).role } : null);
  
  if (!req.isAuthenticated()) {
    console.log('Authentication failed: not authenticated');
    return res.status(401).json({ message: 'Unauthorized - Not authenticated' });
  }
  
  if (!req.user) {
    console.log('Authentication failed: no user object');
    return res.status(401).json({ message: 'Unauthorized - No user' });
  }
  
  if ((req.user as any).role !== 'admin') {
    console.log('Authentication failed: wrong role', (req.user as any).role);
    return res.status(401).json({ message: 'Unauthorized - Invalid role' });
  }
  
  next();
}

// Team authentication middleware
function ensureAuthenticatedTeam(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !(req.session as any).teamId) {
    return res.status(401).json({ message: 'Unauthorized - No team session' });
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

  // Team authentication routes
  app.post("/api/auth/team/login", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ message: 'Access token is required' });
      }
      
      const team = await storage.getTeamByAccessToken(access_token);
      
      if (!team) {
        return res.status(401).json({ message: 'Invalid access token' });
      }
      
      // Create secure session for team
      (req.session as any).teamId = team.id;
      
      res.json({ 
        message: 'Team login successful', 
        team: { 
          id: team.id, 
          code: team.code, 
          name: team.name,
          currentPhase: team.currentPhase
        } 
      });
    } catch (error) {
      console.error('Team login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/auth/team/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ message: 'Team logout successful' });
    });
  });

  app.get("/api/auth/team/status", ensureAuthenticatedTeam, async (req, res) => {
    try {
      const teamId = (req.session as any).teamId;
      const team = await storage.getTeamById(teamId);
      if (!team) {
        // This case should be rare as ensureAuthenticatedTeam already validates the session
        return res.status(404).json({ message: "Team not found for this session." });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team status." });
    }
  });

  // Team routes
  app.post("/api/teams", async (req, res) => {
    try {
      const { name, code } = req.body;
      
      if (!name || !code) {
        return res.status(400).json({ message: "Name and code are required" });
      }
      
      // Generate unique access token for team authentication
      const accessToken = `${code}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const teamData = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        accessToken,
        currentPhase: 1
        // avatarIcon will be auto-assigned by storage layer
      };
      
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(409).json({ message: "Team code already exists" });
      }
      res.status(500).json({ message: "Error creating team" });
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

  app.patch("/api/teams/:id/avatar", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { avatarIcon } = req.body;
      
      // Validate avatar icon
      if (!avatarIcon || typeof avatarIcon !== 'string') {
        return res.status(400).json({ message: "Valid avatar icon required" });
      }
      
      // Verify team exists
      const existingTeam = await storage.getTeamById(teamId);
      if (!existingTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const team = await storage.updateTeamAvatar(teamId, avatarIcon);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error updating team avatar" });
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
      
      if (!website_url || typeof website_url !== 'string') {
        return res.status(400).json({ message: "Website URL is required" });
      }
      
      // Trim and validate the URL
      const trimmedUrl = website_url.trim();
      if (!trimmedUrl) {
        return res.status(400).json({ message: "Website URL cannot be empty" });
      }
      
      // Basic URL format validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlPattern.test(trimmedUrl)) {
        return res.status(400).json({ message: "Please enter a valid website URL" });
      }
      
      const team = await storage.updateTeamWebsite(teamId, trimmedUrl);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error updating website" });
    }
  });

  // Admin utility endpoint to clean up invalid website URLs
  app.post("/api/admin/cleanup-websites", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      // Find teams with invalid website URLs (empty strings or whitespace)
      const allTeams = await storage.getAllTeams();
      const teamsToClean = allTeams.filter(team => 
        team.submittedWebsiteUrl !== null && 
        (!team.submittedWebsiteUrl.trim() || team.submittedWebsiteUrl.trim() === '')
      );
      
      console.log(`Found ${teamsToClean.length} teams with invalid website URLs to clean up`);
      
      // Update these teams to have null website URLs
      for (const team of teamsToClean) {
        await storage.updateTeamWebsite(team.id, null);
        console.log(`Cleaned up team ${team.name} (${team.code}) - removed empty website URL`);
      }
      
      res.json({ 
        message: `Cleaned up ${teamsToClean.length} teams with invalid website URLs`,
        cleanedTeams: teamsToClean.map(t => ({ id: t.id, name: t.name, code: t.code }))
      });
    } catch (error) {
      console.error('Error cleaning up website URLs:', error);
      res.status(500).json({ message: "Error cleaning up website URLs" });
    }
  });

  // Admin cohort management endpoints
  app.post("/api/admin/cohorts", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const { tag, name, description } = req.body;
      
      if (!tag || !name) {
        return res.status(400).json({ message: "Tag and name are required" });
      }
      
      const cohortData = {
        tag: tag.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        submissionsOpen: true,
        votingOpen: false,
        resultsVisible: false
      };
      
      const cohort = await storage.createCohort(cohortData);
      res.json(cohort);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(409).json({ message: "Cohort tag already exists" });
      }
      res.status(500).json({ message: "Error creating cohort" });
    }
  });

  app.get("/api/admin/cohorts", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohorts = await storage.getActiveCohorts();
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohorts" });
    }
  });

  app.get("/api/admin/cohorts/archived", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohorts = await storage.getArchivedCohorts();
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching archived cohorts" });
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
      // Remove submissionsOpen from updates since it should always be true
      const { submissionsOpen, ...allowedUpdates } = updates;
      const cohort = await storage.updateCohort(req.params.cohortTag, allowedUpdates);
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error updating cohort" });
    }
  });

  app.post("/api/admin/cohorts/:cohortTag/archive", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohort = await storage.archiveCohort(req.params.cohortTag);
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error archiving cohort" });
    }
  });

  app.post("/api/admin/cohorts/:cohortTag/unarchive", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const cohort = await storage.unarchiveCohort(req.params.cohortTag);
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error unarchiving cohort" });
    }
  });

  app.post("/api/admin/cohorts/:cohortTag/teams", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const { team_ids } = req.body;
      console.log('Assigning teams:', team_ids, 'to cohort:', req.params.cohortTag);
      
      if (!Array.isArray(team_ids)) {
        return res.status(400).json({ message: "team_ids must be an array" });
      }
      
      const teams = await storage.assignTeamsToCohort(team_ids, req.params.cohortTag);
      console.log('Teams assigned successfully:', teams.length);
      res.json(teams);
    } catch (error: any) {
      console.error('Error assigning teams to cohort:', error);
      res.status(500).json({ message: "Error assigning teams to cohort", details: error?.message || 'Unknown error' });
    }
  });

  app.patch("/api/admin/cohorts/unassign-teams", ensureAuthenticatedAdmin, async (req, res) => {
    try {
      const { teamIds } = req.body;

      if (!Array.isArray(teamIds) || teamIds.length === 0) {
        return res.status(400).json({ message: "teamIds must be a non-empty array" });
      }

      await storage.unassignTeamsFromCohort(teamIds);
      res.status(200).json({ message: "Teams unassigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unassigning teams" });
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
      console.log(`Showcase for cohort ${req.params.cohortTag}: Found ${teams.length} submitted teams`);
      teams.forEach(team => {
        console.log(`Team ${team.name} (${team.code}): URL = "${team.submittedWebsiteUrl}"`);
      });
      res.json(teams);
    } catch (error) {
      console.error('Error fetching showcase:', error);
      res.status(500).json({ message: "Error fetching showcase" });
    }
  });

  app.post("/api/showcase/:cohortTag/vote", ensureAuthenticatedTeam, async (req, res) => {
    try {
      const { votes } = req.body;
      const voting_team_id = (req.session as any).teamId; // Get from secure session
      
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
      
      // Validate voting team has submitted their website
      if (!votingTeam.submittedWebsiteUrl || votingTeam.submittedWebsiteUrl.trim() === '') {
        return res.status(400).json({ message: "Must submit your team's website before voting" });
      }
      
      // Check if team already voted
      const existingVotes = await storage.getVotesByTeam(req.params.cohortTag, voting_team_id);
      if (existingVotes.length > 0) {
        return res.status(400).json({ message: "Team has already voted" });
      }
      
      // Get eligible teams (those with submissions, excluding voting team)
      const eligibleTeams = await storage.getSubmittedTeamsByCohort(req.params.cohortTag);
      const votableTeams = eligibleTeams.filter(team => team.id !== voting_team_id);
      const maxVotes = Math.min(3, votableTeams.length);
      
      if (maxVotes === 0) {
        return res.status(400).json({ message: "No other teams available to vote for" });
      }
      
      if (!Array.isArray(votes) || votes.length !== maxVotes) {
        return res.status(400).json({ message: `Must provide exactly ${maxVotes} vote${maxVotes > 1 ? 's' : ''}` });
      }
      
      // Validate vote structure - require ranks 1 through maxVotes
      const ranks = votes.map(v => v.rank);
      const expectedRanks = Array.from({ length: maxVotes }, (_, i) => i + 1);
      for (const expectedRank of expectedRanks) {
        if (!ranks.includes(expectedRank)) {
          return res.status(400).json({ message: `Must include rank ${expectedRank}` });
        }
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

  // Public endpoint to check cohort status
  app.get("/api/cohorts/:cohortTag/status", async (req, res) => {
    try {
      const cohort = await storage.getCohortByTag(req.params.cohortTag);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      res.json({
        tag: cohort.tag,
        name: cohort.name,
        submissionsOpen: cohort.submissionsOpen,
        votingOpen: cohort.votingOpen,
        resultsVisible: cohort.resultsVisible
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohort status" });
    }
  });

  app.get("/api/showcase/:cohortTag/results", async (req, res) => {
    try {
      // First check if results are visible for this cohort
      const cohort = await storage.getCohortByTag(req.params.cohortTag);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      if (!cohort.resultsVisible) {
        return res.status(403).json({ message: "Results are not yet available" });
      }
      
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
