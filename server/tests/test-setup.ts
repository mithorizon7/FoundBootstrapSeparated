import express, { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { createServer, Server } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import bcrypt from 'bcrypt';

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
  
  // Configure passport for testing
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Setup passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      return done(null, { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      });
    } catch (error) {
      return done(error);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
  
  // Register all routes
  const server = await registerRoutes(app);
  
  return { app, server };
}