import bcrypt from 'bcrypt';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Check if admin user already exists using Drizzle ORM
    const existingAdmin = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, 'davedxn@mit.edu'),
        eq(users.role, 'admin')
      ))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with hashed password
    const password = 'mithorizon';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert using Drizzle ORM
    await db.insert(users).values({
      username: 'davedxn@mit.edu',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully');
    console.log('Username: davedxn@mit.edu');
    console.log('Password: mithorizon');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();