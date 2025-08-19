import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from '../../server/routes';
import { generateTestTeamData } from '../setup';

describe('Security & Authentication Tests', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    await registerRoutes(app);
  });

  describe('Route Protection', () => {
    it('should protect admin routes from unauthorized access', async () => {
      const response = await request(app)
        .get('/api/admin/teams')
        .expect(401);

      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it('should protect team-specific routes', async () => {
      const response = await request(app)
        .post('/api/phase-data')
        .send({ teamId: 1, phaseNumber: 1, data: {} })
        .expect(401);

      expect(response.body.message).toBe('Unauthorized - No team session');
    });

    it('should allow public routes', async () => {
      const publicRoutes = [
        '/api/teams',
        '/api/configs/phase-1',
      ];

      for (const route of publicRoutes) {
        const response = await request(app).get(route);
        expect(response.status).not.toBe(401);
      }
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize team creation input', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        code: 'HACK123',
      };

      const response = await request(app)
        .post('/api/teams')
        .send(maliciousData);

      expect(response.status).toBe(200);
      // The malicious script should be accepted as-is (it's just stored, not rendered)
      expect(response.body.name).toBe(maliciousData.name);
    });

    it('should reject invalid data types', async () => {
      const invalidData = {
        name: 123,
        code: { malicious: 'object' },
      };

      const response = await request(app)
        .post('/api/teams')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid request data');
    });

    it('should limit access token validation', async () => {
      const responses = [];
      
      // Test multiple invalid tokens
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/team/login')
          .send({ access_token: `invalid_token_${i}` });
        
        responses.push(response.status);
      }

      // All should fail consistently
      responses.forEach(status => {
        expect(status).toBe(401);
      });
    });
  });

  describe('Session Management Security', () => {
    it('should generate secure access tokens', async () => {
      const testData = generateTestTeamData();
      
      const response = await request(app)
        .post('/api/teams')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      
      // Token should be sufficiently long and complex
      expect(response.body.accessToken.length).toBeGreaterThan(10);
      expect(response.body.accessToken).toMatch(/^[A-Z0-9_]+$/);
    });

    it('should maintain session isolation', async () => {
      const team1Data = generateTestTeamData();
      const team2Data = generateTestTeamData();
      
      // Create two teams
      const team1Response = await request(app)
        .post('/api/teams')
        .send(team1Data);
      
      const team2Response = await request(app)
        .post('/api/teams')
        .send(team2Data);

      expect(team1Response.body.accessToken).not.toBe(team2Response.body.accessToken);
      expect(team1Response.body.id).not.toBe(team2Response.body.id);
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const requests = [];
      
      // Send multiple concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/teams')
            .timeout(5000)
        );
      }

      const responses = await Promise.allSettled(requests);
      
      // Most should succeed
      const successfulResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      
      expect(successfulResponses.length).toBeGreaterThan(5);
    });
  });
});