# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RinkLink is a hockey team and tournament management platform built as an Nx monorepo with three main applications:
- **API** (NestJS) - REST backend with Swagger docs at `/api/docs`
- **Web** (Angular 20) - Web application with PrimeNG UI and zoneless change detection
- **Mobile** (Ionic/Capacitor) - iOS and Android mobile app

## Common Commands

### Development
```bash
npm run start:api       # Start API on port 3000
npm run start:web       # Start web app on port 4200
npm run start:mobile    # Start mobile dev server
```

### Building
```bash
npm run build:api       # Build API for production
npm run build:web       # Build web app for production
npm run build:mobile    # Build mobile app
```

### Testing & Linting
```bash
npm test                # Run all tests
npm run lint            # Lint all projects
nx test api             # Test specific project
nx lint web             # Lint specific project
```

### Mobile Development
```bash
npm run mobile:sync     # Sync Capacitor after dependency changes
npm run mobile:android  # Open Android Studio
npm run mobile:ios      # Open Xcode
```

### ETL Operations
```bash
npm run etl:start       # Start ETL service
npm run etl:leagues     # Import leagues data
npm run etl:organizations
npm run etl:rankings
```

### Analysis
```bash
npm run analyze:web     # Bundle analysis for web
npm run analyze:mobile  # Bundle analysis for mobile
npm run graph           # Visualize dependency graph
```

## Architecture

### Monorepo Structure
```
apps/
  api/              # NestJS REST API
  web/              # Angular web application
  mobile/           # Ionic/Angular mobile app
  mobile-e2e/       # Cypress E2E tests
libs/shared/
  data-access/      # API clients & Supabase services
  ui/               # Shared UI components
  utilities/        # Validators & utility functions
  test/             # Test utilities
tournament-etl/     # Data import service for tournaments
```

### Shared Library Imports
Use the `@hockey-team-scheduler/` prefix for shared libraries:
```typescript
import { TeamsService } from '@hockey-team-scheduler/shared-data-access';
import { SomeComponent } from '@hockey-team-scheduler/shared-ui';
import { passwordValidator } from '@hockey-team-scheduler/shared-utilities';
```

### Key Services in Data Access Layer
- `SupabaseService` - Database client
- `AuthService` - Authentication
- `TeamsService`, `LeaguesService`, `TournamentsService` - Domain services
- `DashboardService`, `ScheduleService`, `AddGameService` - Feature services
- `MessagesService` - Twilio messaging
- `OpenAiService` - AI integration

### API Module Structure
NestJS modules are feature-based: Auth, Teams, Leagues, Games, Tournaments, Rink, User, Dashboard, Message, Email, OpenAi, Associations.

## Technology Stack

- **Frontend:** Angular 20 (zoneless), Ionic 8, Capacitor 7, PrimeNG 20
- **Backend:** NestJS 11, Express
- **Database:** Supabase (PostgreSQL)
- **External Services:** Twilio (messaging), OpenAI, Stripe (payments)
- **Build:** Nx 22, TypeScript 5.9, SWC
- **Testing:** Jest 30, Cypress 15

## Build Configuration

### Bundle Size Budgets
- Web: 1.2MB warning, 1.5MB error
- Mobile: 1.5MB warning, 2.5MB error

### SCSS Include Paths
Styles are shared via include paths: `libs/shared/ui/src/lib/scss`, `libs`

## CI/CD Pipeline

GitHub Actions workflow on main branch:
1. Lint and test
2. Build affected projects
3. Semantic release versioning
4. Docker build and push to Docker Hub
5. Deploy to DigitalOcean via SSH

## Environment Variables

Required environment variables (create `.env` file):
```
SUPABASE_URL
SUPABASE_KEY
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_SERVICE_ROLE
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_ENDPOINT_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE
NODE_ENV
PORT
```
