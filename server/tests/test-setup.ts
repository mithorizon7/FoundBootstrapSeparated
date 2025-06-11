import express, { Express } from 'express';
import session from 'express-session';
import { createServer, Server } from 'http';
import { registerRoutes } from '../routes';

export async function createTestApp(): Promise<{ app: Express; server: Server }> {
  const app = express();
  
  // Essential middleware for testing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Session middleware for authentication
  app.use(session({
    secret: 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP in tests
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Register all routes
  const server = await registerRoutes(app);
  
  return { app, server };
}