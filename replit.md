# Startup Bootcamp Platform

## Overview

This is a full-stack web application, built with Express.js (TypeScript) and React (TypeScript), designed as an interactive business development toolkit. It features eight independent activities that guide individual professionals in developing business concepts through structured stages. The platform supports individual session management, cross-device persistence, and instructor oversight. Its vision is to provide a versatile and modern toolkit for business development, supporting both individual use and cohort-based learning.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Individual Session Management**: Transformed from team-based to individual professional session management, supporting solo work, cross-device persistence via session codes, and maintaining administrative oversight. UI language and internal variable names reflect this individual paradigm.
- **Competition Toggle System**: Implemented a cohort-level system allowing administrators to enable/disable competitive features (voting, results) per cohort. Defaults to disabled for non-competitive showcase use cases.

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