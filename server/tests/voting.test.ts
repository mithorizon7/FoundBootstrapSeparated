import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from './test-setup';
import { storage } from '../storage';
import { db } from '../db';
import { teams, cohorts, users, votes } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

let app: Express;
let server: any;

// Test data constants
const TEST_COHORT_TAG = 'TEST_COHORT';
const TEST_ADMIN = {
  username: 'test_admin',
  password: 'test_password_123'
};

const TEST_TEAMS = [
  { name: 'TeamA', code: 'TEAM_A_CODE', accessToken: 'test_token_team_a_12345' },
  { name: 'TeamB', code: 'TEAM_B_CODE', accessToken: 'test_token_team_b_12345' },
  { name: 'TeamC', code: 'TEAM_C_CODE', accessToken: 'test_token_team_c_12345' },
  { name: 'TeamD', code: 'TEAM_D_CODE', accessToken: 'test_token_team_d_12345' }
];

// Helper function to get session cookie
function extractSessionCookie(response: any): string {
  const setCookieHeader = response.headers['set-cookie'];
  if (!setCookieHeader) return '';
  
  const sessionCookie = setCookieHeader.find((cookie: string) => 
    cookie.startsWith('connect.sid=')
  );
  
  return sessionCookie ? sessionCookie.split(';')[0] : '';
}

// Helper function to login as admin
async function loginAsAdmin(): Promise<string> {
  const response = await request(app)
    .post('/api/auth/admin/login')
    .send({
      username: TEST_ADMIN.username,
      password: TEST_ADMIN.password
    });
  
  expect(response.status).toBe(200);
  return extractSessionCookie(response);
}

// Helper function to login as team
async function loginAsTeam(accessToken: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/team/login')
    .send({ access_token: accessToken });
  
  expect(response.status).toBe(200);
  return extractSessionCookie(response);
}

beforeAll(async () => {
  // Setup Express app for testing
  const testSetup = await createTestApp();
  app = testSetup.app;
  server = testSetup.server;
  
  // Clean up any existing test data
  await db.delete(votes).where(eq(votes.cohortTag, TEST_COHORT_TAG));
  await db.delete(teams).where(eq(teams.cohortTag, TEST_COHORT_TAG));
  await db.delete(cohorts).where(eq(cohorts.tag, TEST_COHORT_TAG));
  await db.delete(users).where(eq(users.username, TEST_ADMIN.username));
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 10);
  await storage.createUser({
    username: TEST_ADMIN.username,
    password: hashedPassword,
    role: 'admin'
  });
  
  // Create test cohort
  await storage.createCohort({
    tag: TEST_COHORT_TAG,
    name: 'Test Cohort',
    description: 'Test cohort for integration tests',
    votingOpen: false,
    resultsVisible: false
  });
  
  // Create test teams
  for (const teamData of TEST_TEAMS) {
    await storage.createTeam({
      name: teamData.name,
      code: teamData.code,
      accessToken: teamData.accessToken,
      currentPhase: 8, // All teams at submission phase
      cohortTag: TEST_COHORT_TAG
    });
  }
});

afterAll(async () => {
  // Clean up test data
  await db.delete(votes).where(eq(votes.cohortTag, TEST_COHORT_TAG));
  await db.delete(teams).where(eq(teams.cohortTag, TEST_COHORT_TAG));
  await db.delete(cohorts).where(eq(cohorts.tag, TEST_COHORT_TAG));
  await db.delete(users).where(eq(users.username, TEST_ADMIN.username));
  
  // Close server
  if (server) {
    server.close();
  }
});

describe('Suite 1: Team Authentication & Session Management', () => {
  it('Test 1.1: Successful Login with Token', async () => {
    const response = await request(app)
      .post('/api/auth/team/login')
      .send({ access_token: TEST_TEAMS[0].accessToken });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Team login successful');
    
    // Check that session cookie is set
    const sessionCookie = extractSessionCookie(response);
    expect(sessionCookie).toBeTruthy();
  });
  
  it('Test 1.2: Failed Login with Invalid Token', async () => {
    const response = await request(app)
      .post('/api/auth/team/login')
      .send({ access_token: 'invalid_token_12345' });
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
  
  it('Test 1.3: Successful Logout', async () => {
    // First login
    const loginResponse = await request(app)
      .post('/api/auth/team/login')
      .send({ access_token: TEST_TEAMS[0].accessToken });
    
    const sessionCookie = extractSessionCookie(loginResponse);
    
    // Then logout
    const logoutResponse = await request(app)
      .post('/api/auth/team/logout')
      .set('Cookie', sessionCookie);
    
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toHaveProperty('message', 'Team logout successful');
  });
});

describe('Suite 2: Admin Controls for Voting', () => {
  it('Test 2.1: Admin Can Open Voting', async () => {
    const adminCookie = await loginAsAdmin();
    
    const response = await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ votingOpen: true });
    
    expect(response.status).toBe(200);
    
    // Verify cohort status
    const cohort = await storage.getCohortByTag(TEST_COHORT_TAG);
    expect(cohort?.votingOpen).toBe(true);
  });
  
  it('Test 2.2: Non-Admin Cannot Open Voting', async () => {
    // Try without authentication
    const response1 = await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .send({ votingOpen: true });
    
    expect([401, 403]).toContain(response1.status);
    
    // Try with team authentication
    const teamCookie = await loginAsTeam(TEST_TEAMS[0].accessToken);
    const response2 = await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', teamCookie)
      .send({ votingOpen: true });
    
    expect([401, 403]).toContain(response2.status);
  });
  
  it('Test 2.3: Admin Can Reveal Results', async () => {
    const adminCookie = await loginAsAdmin();
    
    const response = await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ resultsVisible: true });
    
    expect(response.status).toBe(200);
    
    // Verify cohort status
    const cohort = await storage.getCohortByTag(TEST_COHORT_TAG);
    expect(cohort?.resultsVisible).toBe(true);
  });
});

describe('Suite 3: Voting Logic and Security', () => {
  it('Test 3.1: Voting is Blocked When Closed', async () => {
    // Ensure voting is closed
    const adminCookie = await loginAsAdmin();
    await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ votingOpen: false });
    
    // Get team IDs for voting
    const teamB = await storage.getTeamByAccessToken(TEST_TEAMS[1].accessToken);
    const teamC = await storage.getTeamByAccessToken(TEST_TEAMS[2].accessToken);
    
    // Try to vote as team
    const teamCookie = await loginAsTeam(TEST_TEAMS[0].accessToken);
    const response = await request(app)
      .post(`/api/showcase/${TEST_COHORT_TAG}/vote`)
      .set('Cookie', teamCookie)
      .send({
        votes: [
          { voted_for_team_id: teamB!.id, rank: 1 },
          { voted_for_team_id: teamC!.id, rank: 2 },
          { voted_for_team_id: teamB!.id, rank: 3 }
        ]
      });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('not open');
  });
  
  it('Test 3.2: Secure Vote Submission', async () => {
    // Open voting
    const adminCookie = await loginAsAdmin();
    await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ votingOpen: true });
    
    // Get team IDs
    const teamA = await storage.getTeamByAccessToken(TEST_TEAMS[0].accessToken);
    const teamB = await storage.getTeamByAccessToken(TEST_TEAMS[1].accessToken);
    const teamC = await storage.getTeamByAccessToken(TEST_TEAMS[2].accessToken);
    const teamD = await storage.getTeamByAccessToken(TEST_TEAMS[3].accessToken);
    
    // Submit vote as TeamA (need 3 unique teams for valid vote)
    const teamCookie = await loginAsTeam(TEST_TEAMS[0].accessToken);
    const response = await request(app)
      .post(`/api/showcase/${TEST_COHORT_TAG}/vote`)
      .set('Cookie', teamCookie)
      .send({
        votes: [
          { voted_for_team_id: teamB!.id, rank: 1 },
          { voted_for_team_id: teamC!.id, rank: 2 },
          { voted_for_team_id: teamD!.id, rank: 3 }
        ]
      });
    
    expect(response.status).toBe(200);
    
    // Verify votes in database
    const votes = await storage.getVotesByTeam(TEST_COHORT_TAG, teamA!.id);
    expect(votes).toHaveLength(2);
    expect(votes.find(v => v.rank === 1)?.teamId).toBe(teamB!.id);
    expect(votes.find(v => v.rank === 2)?.teamId).toBe(teamC!.id);
  });
  
  it('Test 3.3: Prevent Self-Voting', async () => {
    // Get team IDs
    const teamA = await storage.getTeamByAccessToken(TEST_TEAMS[0].accessToken);
    const teamB = await storage.getTeamByAccessToken(TEST_TEAMS[1].accessToken);
    
    // Try to vote for self
    const teamCookie = await loginAsTeam(TEST_TEAMS[1].accessToken);
    const response = await request(app)
      .post(`/api/showcase/${TEST_COHORT_TAG}/vote`)
      .set('Cookie', teamCookie)
      .send({
        votes: [
          { teamId: teamB!.id, rank: 1 }, // Self-vote
          { teamId: teamA!.id, rank: 2 }
        ]
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Cannot vote for your own team');
  });
  
  it('Test 3.4: Prevent Duplicate Voting', async () => {
    // Get team IDs
    const teamA = await storage.getTeamByAccessToken(TEST_TEAMS[0].accessToken);
    const teamC = await storage.getTeamByAccessToken(TEST_TEAMS[2].accessToken);
    
    // Submit first vote as TeamB
    const teamCookie = await loginAsTeam(TEST_TEAMS[1].accessToken);
    const response1 = await request(app)
      .post(`/api/showcase/${TEST_COHORT_TAG}/vote`)
      .set('Cookie', teamCookie)
      .send({
        votes: [
          { teamId: teamA!.id, rank: 1 },
          { teamId: teamC!.id, rank: 2 }
        ]
      });
    
    expect(response1.status).toBe(200);
    
    // Try to vote again
    const response2 = await request(app)
      .post(`/api/showcase/${TEST_COHORT_TAG}/vote`)
      .set('Cookie', teamCookie)
      .send({
        votes: [
          { teamId: teamC!.id, rank: 1 },
          { teamId: teamA!.id, rank: 2 }
        ]
      });
    
    expect(response2.status).toBe(400);
    expect(response2.body.message).toContain('already voted');
  });
});

describe('Suite 4: Results Visibility', () => {
  it('Test 4.1: Results are Hidden by Default', async () => {
    // Ensure results are hidden
    const adminCookie = await loginAsAdmin();
    await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ resultsVisible: false });
    
    // Try to access results as team
    const teamCookie = await loginAsTeam(TEST_TEAMS[0].accessToken);
    const response = await request(app)
      .get(`/api/showcase/${TEST_COHORT_TAG}/results`)
      .set('Cookie', teamCookie);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('not yet available');
  });
  
  it('Test 4.2: Results are Visible After Reveal', async () => {
    // Reveal results
    const adminCookie = await loginAsAdmin();
    await request(app)
      .patch(`/api/admin/cohorts/${TEST_COHORT_TAG}`)
      .set('Cookie', adminCookie)
      .send({ resultsVisible: true });
    
    // Access results as team
    const teamCookie = await loginAsTeam(TEST_TEAMS[0].accessToken);
    const response = await request(app)
      .get(`/api/showcase/${TEST_COHORT_TAG}/results`)
      .set('Cookie', teamCookie);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
  });
});