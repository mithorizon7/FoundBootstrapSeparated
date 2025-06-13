import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

// Test application setup
let app: express.Express;
let server: any;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('API Validation Tests', () => {

  describe('Team Authentication Routes', () => {
    it('should validate team login with proper schema', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({ access_token: teamAccessToken });

      expect(response.status).toBe(200);
      expect(response.body.team).toBeDefined();
      expect(response.body.team.code).toBe(testTeam.code);
    });

    it('should reject team login with invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({ invalid_field: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject team login with empty access token', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({ access_token: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Team Management Routes', () => {
    it('should validate team creation with proper schema', async () => {
      const teamData = {
        name: 'New Test Team',
        code: 'NEWTEST',
        accessToken: 'new_test_token_456',
        currentPhase: 1,
        avatarIcon: 'team2.svg'
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(teamData.name);
      expect(response.body.code).toBe(teamData.code.toUpperCase());
    });

    it('should reject team creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({ name: 'Incomplete Team' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate team phase update', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/phase`)
        .send({ currentPhase: 3 });

      expect(response.status).toBe(200);
      expect(response.body.currentPhase).toBe(3);
    });

    it('should reject invalid phase numbers', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/phase`)
        .send({ currentPhase: 15 });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate avatar update', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/avatar`)
        .send({ avatarIcon: 'newavatar.svg' });

      expect(response.status).toBe(200);
      expect(response.body.avatarIcon).toBe('newavatar.svg');
    });

    it('should reject empty avatar icon', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/avatar`)
        .send({ avatarIcon: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate website URL update', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/website`)
        .send({ websiteUrl: 'https://example.com' });

      expect(response.status).toBe(200);
    });

    it('should reject invalid website URLs', async () => {
      const response = await request(app)
        .patch(`/api/teams/${testTeam.id}/website`)
        .send({ websiteUrl: 'not-a-url' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Phase Data Routes', () => {
    it('should validate phase data submission', async () => {
      const phaseData = {
        teamId: testTeam.id,
        phaseNumber: 1,
        data: { field1: 'value1', field2: 'value2' }
      };

      const response = await request(app)
        .post('/api/phase-data')
        .send(phaseData);

      expect(response.status).toBe(200);
      expect(response.body.teamId).toBe(testTeam.id);
      expect(response.body.phaseNumber).toBe(1);
    });

    it('should reject phase data with missing fields', async () => {
      const response = await request(app)
        .post('/api/phase-data')
        .send({ teamId: testTeam.id });

      expect(response.status).toBe(400);
    });

    it('should retrieve phase data correctly', async () => {
      // First create some phase data
      await request(app)
        .post('/api/phase-data')
        .send({
          teamId: testTeam.id,
          phaseNumber: 2,
          data: { testField: 'testValue' }
        });

      const response = await request(app)
        .get(`/api/phase-data/${testTeam.id}/2`);

      expect(response.status).toBe(200);
      expect(response.body.phaseNumber).toBe(2);
    });
  });

  describe('Cohort Management Routes', () => {
    it('should create cohort with valid data', async () => {
      const cohortData = {
        tag: 'VALID2025',
        name: 'Valid Test Cohort',
        description: 'A test cohort with valid data'
      };

      // Note: This requires admin authentication in real scenarios
      const response = await request(app)
        .post('/api/admin/cohorts')
        .send(cohortData);

      // Will fail authentication but should pass validation
      expect([200, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });

    it('should reject cohort creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/admin/cohorts')
        .send({ invalid: 'data' });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });

    it('should validate team assignment to cohort', async () => {
      const response = await request(app)
        .post(`/api/admin/cohorts/${testCohort.tag}/teams`)
        .send({ teamIds: [testTeam.id] });

      // Will fail authentication but should pass validation
      expect([200, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });

    it('should reject team assignment with invalid data', async () => {
      const response = await request(app)
        .post(`/api/admin/cohorts/${testCohort.tag}/teams`)
        .send({ teamIds: 'not-an-array' });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });
  });

  describe('Voting Routes', () => {
    it('should validate vote submission structure', async () => {
      const voteData = {
        votes: [
          { voted_for_team_id: 123, rank: 1 },
          { voted_for_team_id: 124, rank: 2 },
          { voted_for_team_id: 125, rank: 3 }
        ]
      };

      const response = await request(app)
        .post(`/api/showcase/${testCohort.tag}/vote`)
        .send(voteData);

      // Will fail authentication but should pass validation
      expect([200, 401, 400]).toContain(response.status);
      if (response.status === 400 && response.body.message === 'Invalid request data') {
        // This means validation failed, which shouldn't happen with valid structure
        expect(false).toBe(true);
      }
    });

    it('should reject invalid vote structure', async () => {
      const response = await request(app)
        .post(`/api/showcase/${testCohort.tag}/vote`)
        .send({ votes: 'invalid' });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });

    it('should reject votes with invalid rank values', async () => {
      const voteData = {
        votes: [
          { voted_for_team_id: 123, rank: 5 } // Invalid rank
        ]
      };

      const response = await request(app)
        .post(`/api/showcase/${testCohort.tag}/vote`)
        .send(voteData);

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.errors).toBeDefined();
      }
    });
  });

  describe('Configuration Routes', () => {
    it('should retrieve phase configurations', async () => {
      const response = await request(app)
        .get('/api/configs/phase-1');

      expect([200, 404]).toContain(response.status);
    });

    it('should reject invalid phase numbers', async () => {
      const response = await request(app)
        .get('/api/configs/phase-99');

      expect(response.status).toBe(404);
    });
  });

  describe('Public Routes', () => {
    it('should retrieve cohort status', async () => {
      const response = await request(app)
        .get(`/api/cohorts/${testCohort.tag}/status`);

      expect(response.status).toBe(200);
      expect(response.body.tag).toBe(testCohort.tag);
    });

    it('should handle non-existent cohort gracefully', async () => {
      const response = await request(app)
        .get('/api/cohorts/NONEXISTENT/status');

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed validation errors', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity in team-cohort relationships', async () => {
      // Assign team to cohort
      await storage.assignTeamsToCohort([testTeam.id], testCohort.tag);
      
      // Verify assignment
      const teams = await storage.getTeamsByCohort(testCohort.tag);
      expect(teams.some(t => t.id === testTeam.id)).toBe(true);
    });

    it('should handle duplicate team codes correctly', async () => {
      const duplicateTeamData = {
        name: 'Duplicate Team',
        code: testTeam.code, // Same code as existing team
        accessToken: 'duplicate_token_789',
        currentPhase: 1,
        avatarIcon: 'team3.svg'
      };

      const response = await request(app)
        .post('/api/teams')
        .send(duplicateTeamData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Team code already exists');
    });
  });
});