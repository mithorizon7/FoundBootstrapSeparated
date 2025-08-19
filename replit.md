# Startup Bootcamp Platform

## Overview

This is a full-stack web application built with Express.js backend and React frontend, using TypeScript throughout. The platform is designed as an interactive startup bootcamp with eight distinct activities that help teams develop their business concepts through structured development stages. It features a modern stack with authentication, database integration, and a component-based UI built with shadcn/ui components.

## Current Project Status: Atomization in Progress

**Objective**: Transform the eight interconnected bootcamp activities into standalone, independent modules that can be completed in any order without dependencies on previous phases.

**Progress**: Phase 1 & 2 atomization completed (January 19, 2025)

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

### Documentation System
- **`docs/atomization-guide.md`**: Comprehensive reference guide for phase atomization methodology
- **`configs/README.md`**: Phase configuration documentation and atomization reminders
- **`replit.md`**: Main project documentation and architecture overview

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

## Atomization Plan & Progress

⚠️ **IMPORTANT FOR DEVELOPERS**: Always reference `docs/atomization-guide.md` before starting any phase atomization work. This comprehensive guide contains all methodology, patterns, and checklists needed for consistent atomization.

### Phase 1 - Market Research (✓ COMPLETED)
**Changes Made:**
- Removed sequential language from intro, tooltips, and decision box content
- Updated language from "before we design" to "gain strategic insights"
- Removed references to "foundation of your strategy" and "forms the basis"
- Updated help text to focus on analysis rather than launch preparation
- Modified expectedOutput to emphasize standalone value rather than Phase 2 preparation
- All cross-phase dependencies eliminated

### Phase 2 - Competitor Matrix Construction (✓ COMPLETED)
**Changes Made:**
- Added company_name and sector fields to replace phase1 dependencies
- Updated promptTemplate to use local {{company_name}} and {{sector}} instead of phase1 references
- Made market research file upload optional instead of requiring Phase 1 PDF
- Removed sequential language from intro, decision box, and step-by-step flow
- Updated expectedOutput to be standalone without Phase 3 references
- Generalized all Phase 1 specific references to be more generic

### Phase 3 - Background Research (✓ COMPLETED)
**Changes Made:**
- Added company_name, sector, target_region, and core_benefit fields to replace cross-phase dependencies
- Updated promptTemplate to use local fields instead of phase1/phase2 references
- Removed sequential language from intro and step-by-step flow
- Updated step references from "Phase 1 details" to "company details and core benefit"
- Changed "proceed to Phase 4" to "continue with other activities"
- Updated expectedOutput to focus on standalone value rather than Phase 4 preparation
- All cross-phase dependencies eliminated

### Phases 4-8 - Remaining Work
**Next Steps:**
- Phase 4: Add company_name field, update unmet need help text
- Phase 5: Add chosen concept details fields
- Phase 6: Add brand color fields and concept description fields
- Phase 7: Remove dependencies on previous phases, add required context fields
- Phase 8: Add all consolidated fields (company_name, brand_adjectives, concept details)

### Navigation Updates Required
- Remove progress indicators and sequential language from UI
- Ensure all phase links are accessible regardless of progress
- Update button text from "Phase X of Y" to "Activity X"

## Changelog

- January 19, 2025: Phase 1 atomization completed - removed all sequential dependencies
- June 25, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.