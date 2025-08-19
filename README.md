# Business Development Toolkit

A full-stack web application built with Express.js backend and React frontend, designed as an interactive business development toolkit with eight independent activities that help individual professionals develop their business concepts through structured development stages.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startup-bootcamp-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Configure your database**
   - Create a PostgreSQL database
   - Update the `DATABASE_URL` in your `.env` file

5. **Initialize the database**
   ```bash
   npm run db:push
   ```

6. **Create an admin user**
   ```bash
   node scripts/create-admin.js
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt
- **UI**: TailwindCSS + shadcn/ui components
- **State Management**: TanStack Query

### Project Structure

```
├── client/                 # React frontend
│   ├── src/               # Source code
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/               # Shared types and schemas
├── configs/              # Phase configuration files
├── migrations/           # Database migrations
├── scripts/              # Utility scripts
└── team_icons/          # Team avatar assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security (Required)
SESSION_SECRET=your-secure-random-string-here

# Environment
NODE_ENV=development
```

### Database Setup

The application uses PostgreSQL with Drizzle ORM. The database schema is automatically created when you run:

```bash
npm run db:push
```

This command will:
- Create all necessary tables
- Set up proper indexes and relationships
- Initialize the schema based on `shared/schema.ts`

## 🎯 Key Features

### Atomized Bootcamp Activities

The platform contains 8 independent activities:
1. **Market Research** - Standalone market analysis
2. **Competitor Matrix** - Competitive landscape mapping
3. **Background Research** - Evidence-based research
4. **Hero Offer Ideation** - Product concept development
5. **Hero Concept Brief** - Detailed concept planning
6. **Media Factory** - Creative asset generation
7. **AI Voice Agent** - Voice interaction setup
8. **AI Website Builder** - Website creation guidance

### Competition Toggle System

- **Cohort-level competition controls** - Enable/disable voting per cohort
- **Default showcase mode** - Competition disabled by default
- **Hierarchical validation** - Prevents invalid state combinations

### Admin Features

- **Cohort management** - Create and manage participant groups
- **Participant tracking** - Monitor individual progress and submissions
- **Competition controls** - Toggle voting and results
- **Data export** - CSV export of participant data

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run check        # Type checking

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Apply schema changes
```

### Creating Admin Users

Use the provided script to create admin accounts:

```bash
node scripts/create-admin.js
```

Follow the prompts to set username and password.

### Session Management

Individual sessions can be created through the web interface by participants themselves. Admin users can monitor all sessions through the admin dashboard.

## 🚀 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```env
   NODE_ENV=production
   ```

3. **Start the server**
   ```bash
   npm run start
   ```

### Platform-Specific Notes

#### Replit Deployment
The application is pre-configured for Replit with:
- Port 5000 binding
- Trust proxy settings
- Replit-specific Vite plugins

#### Other Platforms
For deployment on other platforms, you may need to:
- Adjust the port configuration in `server/index.ts`
- Update proxy trust settings if behind a load balancer
- Modify cookie security settings for HTTPS environments

### Environment Considerations

- **DATABASE_URL**: Must point to a PostgreSQL database
- **SESSION_SECRET**: Should be a cryptographically secure random string
- **PORT**: Application runs on port 5000 (configurable in code)

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/team/login` - Session login
- `POST /api/auth/logout` - Logout

### Session Endpoints
- `GET /api/teams/:code` - Get session details by code (public)
- `PATCH /api/teams/:id/phase` - Update session progress (authenticated)
- `PATCH /api/teams/:teamId/website` - Submit website (authenticated)

### Admin Endpoints
- `GET /api/admin/cohorts` - List cohorts
- `POST /api/admin/cohorts` - Create cohort
- `PATCH /api/admin/cohorts/:tag` - Update cohort settings

## 🔒 Security

- **Session-based authentication** with secure session storage
- **Password hashing** using bcrypt
- **CSRF protection** through session configuration
- **Environment variable protection** for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity

**Build Failures**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 20+)

**Session Issues**
- Verify `SESSION_SECRET` is set
- Check cookie settings for your domain

### Getting Help

1. Check the logs in the console
2. Verify environment variables are set correctly
3. Ensure the database is accessible and schema is up to date

---

Built with ❤️ for startup education and development.