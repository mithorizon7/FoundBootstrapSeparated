import bcrypt from 'bcrypt';
import { db } from '../server/db.ts';
import { users } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function createTeamAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Check if team admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, 'admin'),
        eq(users.role, 'admin')
      ))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Team admin user already exists');
      console.log('Username: admin');
      console.log('Password: team123');
      return;
    }

    // Create team admin user with simple credentials
    const password = 'team123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert using Drizzle ORM
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Team admin user created successfully');
    console.log('Username: admin');
    console.log('Password: team123');
  } catch (error) {
    console.error('Error creating team admin user:', error);
  }
}

createTeamAdmin();
