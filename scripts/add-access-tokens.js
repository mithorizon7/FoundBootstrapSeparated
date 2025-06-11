import { db } from '../server/db.ts';
import { teams } from '../shared/schema.ts';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function addAccessTokens() {
  try {
    console.log('Adding access_token column to teams table...');
    
    // First, add the column as nullable
    await db.execute(sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS access_token TEXT`);
    
    // Get all existing teams without access tokens
    const existingTeams = await db.select().from(teams).where(sql`access_token IS NULL`);
    
    console.log(`Found ${existingTeams.length} teams without access tokens`);
    
    // Generate unique tokens for existing teams
    for (const team of existingTeams) {
      const accessToken = randomUUID();
      await db.update(teams)
        .set({ accessToken })
        .where(sql`id = ${team.id}`);
      console.log(`Generated token for team ${team.code}: ${accessToken}`);
    }
    
    // Now make the column NOT NULL and add unique constraint
    await db.execute(sql`ALTER TABLE teams ALTER COLUMN access_token SET NOT NULL`);
    await db.execute(sql`ALTER TABLE teams ADD CONSTRAINT teams_access_token_unique UNIQUE (access_token)`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addAccessTokens();