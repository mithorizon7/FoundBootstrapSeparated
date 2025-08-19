import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { generateTestTeamData } from '../setup';

describe('Performance & Load Tests', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('should handle concurrent team creation', async () => {
    const startTime = Date.now();
    const promises = [];

    // Create 20 teams concurrently
    for (let i = 0; i < 20; i++) {
      const testData = generateTestTeamData();
      promises.push(
        request(app)
          .post('/api/teams')
          .send(testData)
      );
    }

    const responses = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Check that most requests succeeded
    const successfulResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    );

    expect(successfulResponses.length).toBeGreaterThan(15);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    console.log(`Created ${successfulResponses.length}/20 teams in ${duration}ms`);
  });

  it('should handle large payload efficiently', async () => {
    const testData = generateTestTeamData();
    
    // Create team first
    const teamResponse = await request(app)
      .post('/api/teams')
      .send(testData);

    expect(teamResponse.status).toBe(200);

    // Test with large phase data
    const largeData = {
      teamId: teamResponse.body.id,
      phaseNumber: 1,
      data: {
        largeArray: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `Large data item ${i}`,
          timestamp: new Date().toISOString(),
          metadata: {
            processed: false,
            priority: Math.random(),
            tags: [`tag${i}`, `category${i % 10}`]
          }
        }))
      }
    };

    const startTime = Date.now();
    
    // Note: This will fail due to authentication, but we're testing payload handling
    const response = await request(app)
      .post('/api/phase-data')
      .send(largeData);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should reject due to auth but handle the large payload quickly
    expect(response.status).toBe(401);
    expect(duration).toBeLessThan(1000); // Should process within 1 second

    console.log(`Processed large payload in ${duration}ms`);
  });

  it('should efficiently retrieve team lists', async () => {
    // Create several teams first
    const teamPromises = [];
    for (let i = 0; i < 10; i++) {
      teamPromises.push(
        request(app)
          .post('/api/teams')
          .send(generateTestTeamData())
      );
    }

    await Promise.allSettled(teamPromises);

    // Now test retrieval performance
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/teams');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(duration).toBeLessThan(500); // Should retrieve within 500ms

    console.log(`Retrieved ${response.body.length} teams in ${duration}ms`);
  });

  it('should handle rapid sequential requests', async () => {
    const results = [];
    const startTime = Date.now();

    // Make 50 rapid sequential requests
    for (let i = 0; i < 50; i++) {
      const response = await request(app)
        .get('/api/configs/phase-1')
        .timeout(2000);
      
      results.push({
        status: response.status,
        duration: Date.now() - startTime
      });

      if (response.status !== 200) break;
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const successfulRequests = results.filter(r => r.status === 200).length;

    expect(successfulRequests).toBeGreaterThan(40);
    expect(totalDuration).toBeLessThan(10000); // Should complete within 10 seconds

    console.log(`Completed ${successfulRequests}/50 sequential requests in ${totalDuration}ms`);
  });
});