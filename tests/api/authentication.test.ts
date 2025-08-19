import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from '../../server/routes';

describe('Authentication API', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Add session middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    await registerRoutes(app);
  });

  describe('Admin Authentication', () => {
    describe('GET /api/auth/admin/status', () => {
      it('should return unauthenticated status by default', async () => {
        const response = await request(app)
          .get('/api/auth/admin/status')
          .expect(200);

        expect(response.body).toEqual({ isAuthenticated: false });
      });
    });

    describe('POST /api/auth/admin/login', () => {
      it('should reject login with incorrect credentials', async () => {
        const response = await request(app)
          .post('/api/auth/admin/login')
          .send({
            username: 'wrong',
            password: 'wrong'
          })
          .expect(401);

        expect(response.body.message).toBe('Invalid username or password');
      });

      it('should reject login with missing credentials', async () => {
        const response = await request(app)
          .post('/api/auth/admin/login')
          .send({})
          .expect(401);

        expect(response.body.message).toMatch(/Invalid|credentials/i);
      });

      it('should reject login with partial credentials', async () => {
        const response = await request(app)
          .post('/api/auth/admin/login')
          .send({ username: 'admin' })
          .expect(401);

        expect(response.body.message).toMatch(/Invalid|credentials/i);
      });
    });

    describe('POST /api/auth/admin/logout', () => {
      it('should handle logout request', async () => {
        const response = await request(app)
          .post('/api/auth/admin/logout')
          .expect(200);

        expect(response.body.message).toBe('Logout successful');
      });
    });
  });

  describe('Team Authentication', () => {
    describe('POST /api/auth/team/login', () => {
      it('should require access token', async () => {
        const response = await request(app)
          .post('/api/auth/team/login')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('Invalid request data');
        expect(response.body.errors).toBeDefined();
      });

      it('should reject empty access token', async () => {
        const response = await request(app)
          .post('/api/auth/team/login')
          .send({ access_token: '' })
          .expect(400);

        expect(response.body.message).toBe('Invalid request data');
      });

      it('should reject invalid access token format', async () => {
        const response = await request(app)
          .post('/api/auth/team/login')
          .send({ access_token: 'invalid_token_format' })
          .expect(401);

        expect(response.body.message).toBe('Invalid access token');
      });
    });

    describe('POST /api/auth/team/logout', () => {
      it('should handle team logout', async () => {
        const response = await request(app)
          .post('/api/auth/team/logout')
          .expect(200);

        expect(response.body.message).toBe('Logout successful');
      });
    });

    describe('GET /api/auth/team/status', () => {
      it('should return unauthenticated status by default', async () => {
        const response = await request(app)
          .get('/api/auth/team/status')
          .expect(200);

        expect(response.body.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Protected Routes', () => {
    it('should protect admin routes with authentication middleware', async () => {
      // Try to access admin-protected route without authentication
      const response = await request(app)
        .get('/api/admin/teams')
        .expect(401);

      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it('should protect team routes with session authentication', async () => {
      // Try to access team-protected route without session
      const response = await request(app)
        .post('/api/phase-data')
        .send({ teamId: 1, phaseNumber: 1, data: {} })
        .expect(401);

      expect(response.body.message).toBe('Unauthorized - No team session');
    });
  });
});