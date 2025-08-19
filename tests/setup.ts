import { beforeAll, afterAll, afterEach } from 'vitest';
import { storage } from '../server/storage';

// Global test setup
beforeAll(async () => {
  // Initialize test database connection if needed
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test environment
  console.log('Tearing down test environment...');
});

afterEach(async () => {
  // Clean up after each test
  // Note: In a real production environment, you'd want to use a separate test database
  // For now, we'll be careful not to affect production data
});

// Helper function to generate test data
export function generateTestTeamData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    name: `TestTeam_${timestamp}_${random}`,
    code: `T${timestamp.toString().slice(-4)}${random.slice(0,2).toUpperCase()}`,
  };
}

// Helper function to generate test phase data
export function generateTestPhaseData(teamId: number, phaseNumber: number) {
  return {
    teamId,
    phaseNumber,
    data: {
      testField: 'test value',
      timestamp: Date.now(),
      phase: phaseNumber,
    },
  };
}