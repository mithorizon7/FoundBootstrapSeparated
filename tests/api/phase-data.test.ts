import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from '../../server/routes';
import { generateTestTeamData, generateTestPhaseData } from '../setup';

describe('Phase Data API', () => {
  let app: express.Express;
  let agent: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Add session middleware for authentication tests
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    await registerRoutes(app);
    agent = request.agent(app);
  });

  describe('POST /api/phase-data', () => {
    it('should save phase data for authenticated team', async () => {
      // First create and login as a team
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      // Now save phase data
      const phaseData = generateTestPhaseData(createResponse.body.id, 1);
      
      const response = await agent
        .post('/api/phase-data')
        .send(phaseData)
        .expect(200);

      expect(response.body).toMatchObject({
        teamId: createResponse.body.id,
        phaseNumber: 1,
        data: phaseData.data,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should reject phase data from unauthenticated requests', async () => {
      const phaseData = generateTestPhaseData(999, 1);
      
      const response = await request(app)
        .post('/api/phase-data')
        .send(phaseData)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized - No team session');
    });

    it('should validate phase data structure', async () => {
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      // Invalid phase data
      const response = await agent
        .post('/api/phase-data')
        .send({
          teamId: 'invalid', // should be number
          phaseNumber: 'invalid', // should be number
          data: 'invalid', // should be object
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid request data');
    });

    it('should validate phase number range', async () => {
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      // Invalid phase number
      const phaseData = generateTestPhaseData(createResponse.body.id, 999);
      
      const response = await agent
        .post('/api/phase-data')
        .send(phaseData)
        .expect(400);

      expect(response.body.message).toBe('Invalid request data');
    });
  });

  describe('GET /api/phase-data/:teamId/:phaseNumber', () => {
    it('should retrieve phase data for valid team and phase', async () => {
      // Create and authenticate team
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      // Save phase data
      const phaseData = generateTestPhaseData(createResponse.body.id, 2);
      await agent.post('/api/phase-data').send(phaseData);

      // Retrieve phase data
      const response = await agent
        .get(`/api/phase-data/${createResponse.body.id}/2`)
        .expect(200);

      expect(response.body.data).toEqual(phaseData.data);
      expect(response.body.teamId).toBe(createResponse.body.id);
      expect(response.body.phaseNumber).toBe(2);
    });

    it('should return 404 for non-existent phase data', async () => {
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      const response = await agent
        .get(`/api/phase-data/${createResponse.body.id}/3`)
        .expect(404);

      expect(response.body.message).toBe('Phase data not found');
    });

    it('should require authentication for phase data access', async () => {
      const response = await request(app)
        .get('/api/phase-data/1/1')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized - No team session');
    });
  });

  describe('GET /api/phase-data/:teamId', () => {
    it('should retrieve all phase data for authenticated team', async () => {
      // Create and authenticate team
      const testTeam = generateTestTeamData();
      const createResponse = await agent
        .post('/api/teams')
        .send(testTeam);

      await agent
        .post('/api/auth/team/login')
        .send({ access_token: createResponse.body.accessToken });

      // Save multiple phase data entries
      const phase1Data = generateTestPhaseData(createResponse.body.id, 1);
      const phase2Data = generateTestPhaseData(createResponse.body.id, 2);
      
      await agent.post('/api/phase-data').send(phase1Data);
      await agent.post('/api/phase-data').send(phase2Data);

      // Retrieve all phase data
      const response = await agent
        .get(`/api/phase-data/${createResponse.body.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const phases = response.body.map((p: any) => p.phaseNumber).sort();
      expect(phases).toContain(1);
      expect(phases).toContain(2);
    });
  });
});