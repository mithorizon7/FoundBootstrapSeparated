# Applied GenAI Lab Platform

## Overview

This is a full-stack web application, built with Express.js (TypeScript) and React (TypeScript), designed as an interactive GenAI lab. It features eight independent activities that guide individual professionals in developing concepts through structured stages using AI-assisted methodologies. The platform supports individual session management, cross-device persistence, and instructor oversight. Its vision is to provide a versatile and modern lab for GenAI-assisted development, supporting both individual use and cohort-based learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Major Updates (August 2025)

### Individual Session Transformation Complete ✅ - Production Quality Review Completed
- **Security Enhancement**: Added `ensureAuthenticatedTeam` middleware to all sensitive backend routes (`/api/teams/:id/phase`, `/api/teams/:id/avatar`, `/api/teams/:teamId/website`, `/api/phase-data`, `/api/phase-data/:teamId/:phaseNumber/complete`)
- **Cryptographic Security**: Upgraded session code generation from weak Math.random() to crypto.getRandomValues() for production-grade security
- **Privacy Messaging**: Added clear "Keep your session code private" warnings in session creation flow
- **Access Control**: Implemented participant-only data access controls ensuring users can only modify their own session data
- **UI Language Update**: Completed comprehensive transformation from team-based to session/participant language throughout frontend:
  - Updated NavigationHeader component interface (`Team` → `Participant`)
  - Updated function names (`handleTeamSelected` → `handleSessionSelected`)  
  - Updated variable names (`teamModalOpen` → `sessionModalOpen`)
  - Updated comments and UI text to reflect individual session paradigm
  - Enhanced welcome messaging with "No account needed" guidance
- **Non-Linear Navigation**: Enhanced navigation to support atomized activities - all phases accessible in any order with clear completion indicators
- **Admin Panel Updates**: Updated all administrative language from "teams" to "participants" and "individual sessions" 
- **Documentation Updates**: Completely updated README.md to reflect individual session paradigm instead of team collaboration
- **Production Testing**: Completed comprehensive testing of authentication, data isolation, cross-participant security, and session persistence
- **Backend Security**: Enhanced route protection to prevent cross-participant data access - verified participants cannot modify others' data
- **Session Resumption**: Preserved easy 4-letter code access - users can still resume sessions on any device without complications
- **Architecture Integrity**: Successfully maintained existing team-based database structure while adapting UI and security for individual use
- **Production Quality Enhancements**: Added participant attention highlighting in admin dashboard (red highlighting for participants who haven't submitted when voting is open), completed comprehensive comment updates from team to session semantics, verified phase completion tracking functionality
- **Branding Update**: Updated platform name from "Business Development Toolkit" to "Applied GenAI Lab" throughout the application, including navigation header, home page, modal dialogs, and documentation
- **Phase Completion Tracking**: Implemented comprehensive phase completion system using `completedAt` timestamps - participants now properly mark individual phases as completed when proceeding, enabling detailed progress analytics

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for building and development
- **TailwindCSS** for styling
- **shadcn/ui** for consistent UI components
- **TanStack Query** for server state management
- **React Hook Form** with Zod for form validation

### Backend Architecture
- **Express.js** with TypeScript
- **Session-based authentication**
- **bcrypt** for password hashing
- **Drizzle ORM** for PostgreSQL database operations
- RESTful API design

### Database
- **PostgreSQL** (configured for Neon serverless)
- **Drizzle ORM** for type-safe operations
- Schema defined in `shared/schema.ts`

### Key Components
- **Authentication System**: Secure session-based authentication.
- **Session Icon System**: 30+ alien-themed SVG icons for session identification.
- **Shared Type System**: Common types and schemas in `shared/` for consistency.
- **UI Components**: Comprehensive shadcn/ui library with Radix UI primitives and responsive TailwindCSS styling.

### System Design Choices
- **Atomized Activities**: All eight bootcamp activities are designed as standalone, independent modules, completable in any order without dependencies.
- **Individual Session Management**: Fully transformed from team-based to individual professional session management, supporting solo work, cross-device persistence via session codes, and maintaining administrative oversight. UI language and internal variable names reflect this individual paradigm.
- **Competition Toggle System**: Implemented a cohort-level system allowing administrators to enable/disable competitive features (voting, results) per cohort. Defaults to disabled for non-competitive showcase use cases.
- **Enhanced Security**: Added authentication middleware to all sensitive backend routes ensuring participants can only modify their own session data (phase progress, avatars, website submissions).
- **UI Language Consistency**: Completed comprehensive update from team-based to session/participant language throughout the entire frontend interface.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database driver.
- **@tanstack/react-query**: Server state management.
- **@hookform/resolvers**: Form validation integration.
- **canvas-confetti**: UI enhancement effects.

### Development Tools
- **Drizzle Kit**: Database migration and schema management.
- **esbuild**: Server-side bundling.
- **tsx**: TypeScript execution for development.