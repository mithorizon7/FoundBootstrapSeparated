# Alien Team Tracker

## Overview

This is a full-stack web application built with Express.js backend and React frontend, using TypeScript throughout. The app appears to be designed for tracking teams with alien-themed icons and user management functionality. It features a modern stack with authentication, database integration, and a component-based UI built with shadcn/ui components.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **TailwindCSS** for styling with custom design system
- **shadcn/ui** component library for consistent UI components
- **TanStack Query** for server state management and data fetching
- **React Hook Form** with Zod resolvers for form validation

### Backend Architecture
- **Express.js** server with TypeScript
- **Session-based authentication** using express-session
- **bcrypt** for password hashing
- **Drizzle ORM** for database operations with PostgreSQL dialect
- RESTful API architecture

### Database
- **PostgreSQL** database (configured for Neon serverless)
- **Drizzle ORM** for type-safe database operations
- Database schema defined in `shared/schema.ts`
- Migrations managed through Drizzle Kit

## Key Components

### Authentication System
- Session-based authentication with secure session management
- Password hashing using bcrypt
- Session secret configured via environment variables

### Team Icon System
- Rich collection of 30+ alien-themed SVG icons located in `team_icons/`
- Icons include various alien characters, spaceships, space equipment, and sci-fi themed elements
- Organized for team identification and visual appeal

### Shared Type System
- Common types and schemas shared between frontend and backend
- Located in `shared/` directory for type consistency across the stack

### UI Components
- Comprehensive component library using shadcn/ui
- Radix UI primitives for accessibility
- Custom styling with TailwindCSS
- Responsive design with mobile-first approach

## Data Flow

1. **Client Requests**: React frontend makes API calls using TanStack Query
2. **Authentication**: Express middleware validates sessions
3. **Database Operations**: Drizzle ORM handles type-safe database queries
4. **Response Handling**: Structured JSON responses with proper error handling
5. **State Management**: TanStack Query manages server state caching and synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database driver
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **canvas-confetti**: UI enhancement effects

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- Replit-based development with integrated PostgreSQL
- Hot reload enabled for both client and server
- Development server runs on port 5000

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- Session secrets and database URLs configured via environment variables
- Replit-specific configurations for deployment and scaling
- Autoscale deployment target configured

## Changelog

- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.