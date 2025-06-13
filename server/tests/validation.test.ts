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

describe('Zod Validation Implementation Tests', () => {
  
  describe('Team Authentication Validation', () => {
    it('should reject team login with missing access_token', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].path).toEqual(['access_token']);
    });

    it('should reject team login with empty access_token', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({ access_token: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid access_token format', async () => {
      const response = await request(app)
        .post('/api/auth/team/login')
        .send({ access_token: 'valid_token_123' });

      // Should pass validation but fail authentication (no such token exists)
      expect(response.status).toBe(500); // Authentication failure, not validation failure
    });
  });

  describe('Team Creation Validation', () => {
    it('should reject team creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject team creation with partial data', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({ name: 'Test Team' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
    });

    it('should accept complete team data structure', async () => {
      const teamData = {
        name: 'Complete Test Team',
        code: 'COMPLETE',
        accessToken: 'complete_token_123',
        currentPhase: 1,
        avatarIcon: 'team.svg'
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData);

      // Should pass validation, might fail on business logic (duplicate code, etc.)
      expect([200, 409, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Team Phase Update Validation', () => {
    it('should reject invalid phase numbers', async () => {
      const response = await request(app)
        .patch('/api/teams/1/phase')
        .send({ currentPhase: 15 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject negative phase numbers', async () => {
      const response = await request(app)
        .patch('/api/teams/1/phase')
        .send({ currentPhase: -1 });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid phase numbers', async () => {
      const response = await request(app)
        .patch('/api/teams/1/phase')
        .send({ currentPhase: 3 });

      // Should pass validation, might fail on team not found
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Team Avatar Update Validation', () => {
    it('should reject empty avatar icon', async () => {
      const response = await request(app)
        .patch('/api/teams/1/avatar')
        .send({ avatarIcon: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing avatar icon', async () => {
      const response = await request(app)
        .patch('/api/teams/1/avatar')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid avatar icon', async () => {
      const response = await request(app)
        .patch('/api/teams/1/avatar')
        .send({ avatarIcon: 'valid-avatar.svg' });

      // Should pass validation, might fail on team not found
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Website URL Update Validation', () => {
    it('should reject invalid URLs', async () => {
      const response = await request(app)
        .patch('/api/teams/1/website')
        .send({ websiteUrl: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request data');
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid URLs', async () => {
      const response = await request(app)
        .patch('/api/teams/1/website')
        .send({ websiteUrl: 'https://example.com' });

      // Should pass validation, might fail on team not found
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });

    it('should accept empty string for website URL', async () => {
      const response = await request(app)
        .patch('/api/teams/1/website')
        .send({ websiteUrl: '' });

      // Should pass validation
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Phase Data Validation', () => {
    it('should reject phase data with missing fields', async () => {
      const response = await request(app)
        .post('/api/phase-data')
        .send({ teamId: 1 });

      expect(response.status).toBe(400);
    });

    it('should accept complete phase data', async () => {
      const phaseData = {
        teamId: 1,
        phaseNumber: 1,
        data: { field1: 'value1', field2: 'value2' }
      };

      const response = await request(app)
        .post('/api/phase-data')
        .send(phaseData);

      // Should pass validation, might fail on business logic
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid phase data');
      }
    });
  });

  describe('Cohort Management Validation', () => {
    it('should reject cohort creation with missing data', async () => {
      const response = await request(app)
        .post('/api/admin/cohorts')
        .send({});

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });

    it('should accept valid cohort data structure', async () => {
      const cohortData = {
        tag: 'VALID2025',
        name: 'Valid Test Cohort',
        description: 'A test cohort'
      };

      const response = await request(app)
        .post('/api/admin/cohorts')
        .send(cohortData);

      // Will fail on authentication but should pass validation
      expect([200, 401, 409]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Team Assignment Validation', () => {
    it('should reject invalid team IDs array', async () => {
      const response = await request(app)
        .post('/api/admin/cohorts/TEST/teams')
        .send({ teamIds: 'not-an-array' });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });

    it('should reject empty team IDs array', async () => {
      const response = await request(app)
        .post('/api/admin/cohorts/TEST/teams')
        .send({ teamIds: [] });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.errors).toBeDefined();
      }
    });

    it('should accept valid team IDs array', async () => {
      const response = await request(app)
        .post('/api/admin/cohorts/TEST/teams')
        .send({ teamIds: [1, 2, 3] });

      // Will fail on authentication but should pass validation
      expect([200, 401, 404]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).not.toBe('Invalid request data');
      }
    });
  });

  describe('Voting Validation', () => {
    it('should reject invalid vote structure', async () => {
      const response = await request(app)
        .post('/api/showcase/TEST/vote')
        .send({ votes: 'invalid' });

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request data');
      }
    });

    it('should reject votes with invalid rank values', async () => {
      const voteData = {
        votes: [
          { voted_for_team_id: 123, rank: 5 } // Invalid rank > 3
        ]
      };

      const response = await request(app)
        .post('/api/showcase/TEST/vote')
        .send(voteData);

      expect([400, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.errors).toBeDefined();
      }
    });

    it('should accept valid vote structure', async () => {
      const voteData = {
        votes: [
          { voted_for_team_id: 123, rank: 1 },
          { voted_for_team_id: 124, rank: 2 },
          { voted_for_team_id: 125, rank: 3 }
        ]
      };

      const response = await request(app)
        .post('/api/showcase/TEST/vote')
        .send(voteData);

      // Will fail on authentication/business logic but should pass validation
      expect([200, 400, 401]).toContain(response.status);
      if (response.status === 400 && response.body.message === 'Invalid request data') {
        // This would indicate validation failed, which shouldn't happen
        expect(false).toBe(true);
      }
    });
  });

  describe('Error Response Format', () => {
    it('should provide consistent error format for validation failures', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.message).toBe('Invalid request data');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should include field-specific error details', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({ name: 'Test' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
      
      // Check that errors include path information
      const hasPathInfo = response.body.errors.some((error: any) => error.path);
      expect(hasPathInfo).toBe(true);
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('message');
    });
  });
});