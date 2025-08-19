import { describe, it, expect } from 'vitest';
import { 
  insertTeamSchema,
  insertPhaseDataSchema,
  insertCohortSchema,
  teamLoginSchema,
  updateTeamPhaseSchema,
  updateTeamAvatarSchema,
  updateTeamWebsiteSchema
} from '../../shared/schema';

describe('Schema Validation', () => {
  describe('insertTeamSchema', () => {
    it('should validate valid team data', () => {
      const validData = {
        name: 'Test Team',
        code: 'TEST123'
      };
      
      const result = insertTeamSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Team');
        expect(result.data.code).toBe('TEST123');
      }
    });

    it('should validate with optional fields', () => {
      const validData = {
        name: 'Test Team',
        code: 'TEST123',
        accessToken: 'token123',
        avatarIcon: 'alien.svg',
        cohortTag: 'cohort1',
        currentPhase: 2,
        submittedWebsiteUrl: 'https://example.com'
      };
      
      const result = insertTeamSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessToken).toBe('token123');
        expect(result.data.currentPhase).toBe(2);
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'Test Team'
        // Missing code
      };
      
      const result = insertTeamSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toContain('code');
      }
    });

    it('should reject invalid data types', () => {
      const invalidData = {
        name: 123, // should be string
        code: 'TEST123'
      };
      
      const result = insertTeamSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject empty required strings', () => {
      const invalidData = {
        name: '',
        code: 'TEST123'
      };
      
      const result = insertTeamSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('insertPhaseDataSchema', () => {
    it('should validate valid phase data', () => {
      const validData = {
        teamId: 1,
        phaseNumber: 2,
        data: { key: 'value', nested: { data: true } },
        completedAt: null
      };
      
      const result = insertPhaseDataSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.teamId).toBe(1);
        expect(result.data.phaseNumber).toBe(2);
        expect(result.data.data).toEqual({ key: 'value', nested: { data: true } });
      }
    });

    it('should validate with completedAt timestamp', () => {
      const validData = {
        teamId: 1,
        phaseNumber: 1,
        data: {},
        completedAt: new Date()
      };
      
      const result = insertPhaseDataSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid team ID', () => {
      const invalidData = {
        teamId: 'invalid', // should be number
        phaseNumber: 1,
        data: {}
      };
      
      const result = insertPhaseDataSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should reject invalid phase number', () => {
      const invalidData = {
        teamId: 1,
        phaseNumber: 'invalid', // should be number
        data: {}
      };
      
      const result = insertPhaseDataSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('teamLoginSchema', () => {
    it('should validate valid access token', () => {
      const validData = {
        access_token: 'TEAM123_1234567890_abcdef'
      };
      
      const result = teamLoginSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject empty access token', () => {
      const invalidData = {
        access_token: ''
      };
      
      const result = teamLoginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Access token is required');
      }
    });

    it('should reject missing access token', () => {
      const invalidData = {};
      
      const result = teamLoginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('updateTeamPhaseSchema', () => {
    it('should validate valid phase number', () => {
      const validData = {
        currentPhase: 3
      };
      
      const result = updateTeamPhaseSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject phase number below minimum', () => {
      const invalidData = {
        currentPhase: 0
      };
      
      const result = updateTeamPhaseSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should reject phase number above maximum', () => {
      const invalidData = {
        currentPhase: 99
      };
      
      const result = updateTeamPhaseSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should reject non-integer phase number', () => {
      const invalidData = {
        currentPhase: 1.5
      };
      
      const result = updateTeamPhaseSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('updateTeamAvatarSchema', () => {
    it('should validate valid avatar icon', () => {
      const validData = {
        avatarIcon: 'alien-ship.svg'
      };
      
      const result = updateTeamAvatarSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject empty avatar icon', () => {
      const invalidData = {
        avatarIcon: ''
      };
      
      const result = updateTeamAvatarSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('updateTeamWebsiteSchema', () => {
    it('should validate valid website URL', () => {
      const validData = {
        websiteUrl: 'https://example.com'
      };
      
      const result = updateTeamWebsiteSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should validate null website URL', () => {
      const validData = {
        websiteUrl: null
      };
      
      const result = updateTeamWebsiteSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should transform empty string to null', () => {
      const data = {
        websiteUrl: ''
      };
      
      const result = updateTeamWebsiteSchema.safeParse(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.websiteUrl).toBe(null);
      }
    });

    it('should transform whitespace-only string to null', () => {
      const data = {
        websiteUrl: '   '
      };
      
      const result = updateTeamWebsiteSchema.safeParse(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.websiteUrl).toBe(null);
      }
    });
  });

  describe('insertCohortSchema', () => {
    it('should validate valid cohort data', () => {
      const validData = {
        tag: 'cohort-2024-spring',
        name: 'Spring 2024 Cohort',
        description: 'Spring semester cohort for 2024'
      };
      
      const result = insertCohortSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should validate with optional fields', () => {
      const validData = {
        tag: 'test-cohort',
        name: 'Test Cohort',
        submissionsOpen: false,
        competitionEnabled: true,
        votingOpen: true,
        resultsVisible: false,
        archived: true
      };
      
      const result = insertCohortSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competitionEnabled).toBe(true);
        expect(result.data.archived).toBe(true);
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'Test Cohort'
        // Missing tag
      };
      
      const result = insertCohortSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });
  });
});