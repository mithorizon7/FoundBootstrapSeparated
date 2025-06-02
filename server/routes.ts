import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertPhaseDataSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Admin CSV export
  app.get("/api/admin/export", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      const csvRows = [
        'Team Code,Team Name,Current Phase,Created At,Updated At'
      ];
      
      for (const team of teams) {
        csvRows.push(
          `${team.code},${team.name},${team.currentPhase},${team.createdAt?.toISOString()},${team.updatedAt?.toISOString()}`
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
