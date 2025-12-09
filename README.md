# RinkLink

A comprehensive hockey team and tournament management platform built with Angular, NestJS, and Ionic. This monorepo application provides web and mobile interfaces for managing hockey leagues, teams, games, and tournaments.

## 🏒 Features

- **Multi-Platform Support**: Web (Angular), Mobile (Ionic/Capacitor for iOS & Android)
- **Team Management**: Create and manage hockey teams, rosters, and associations
- **League Organization**: Manage leagues, divisions, and standings
- **Tournament System**: Tournament creation, scheduling, and tracking
- **Game Scheduling**: Schedule games, track scores, and manage game details
- **User Authentication**: Secure user authentication with Supabase
- **Real-time Messaging**: Team and tournament communication via Twilio
- **AI Integration**: OpenAI integration for intelligent features
- **Payment Processing**: Stripe integration for payments
- **ETL Pipeline**: Automated data import for tournaments, leagues, and rankings

## 🏗️ Architecture

This is an Nx monorepo with the following structure:

### Applications

- **`apps/api`**: NestJS REST API backend with Swagger documentation
- **`apps/web`**: Angular web application
- **`apps/mobile`**: Ionic/Angular mobile application (iOS & Android)
- **`apps/mobile-e2e`**: Cypress end-to-end tests for mobile app
- **`tournament-etl`**: ETL service for importing tournament data

### Libraries

- **`libs/shared/data-access`**: Shared data access layer and API clients
- **`libs/shared/ui`**: Shared UI components
- **`libs/shared/utilities`**: Shared utility functions
- **`libs/shared/test`**: Shared test utilities

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)
- iOS development: Xcode and CocoaPods
- Android development: Android Studio and Android SDK

### Installation

```bash
# Install dependencies
npm install

# Setup Capacitor for mobile
npm run mobile:sync
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 🛠️ Development

### Running Applications

```bash
# Start API server (http://localhost:3000)
npm run start:api

# Start web application (http://localhost:4200)
npm run start:web

# Start mobile application
npm run start:mobile

# Open mobile in native IDE
npm run mobile:android  # Android Studio
npm run mobile:ios      # Xcode
```

### Building for Production

```bash
# Build API
npm run build:api

# Build web application
npm run build:web

# Build mobile application
npm run build:mobile

# Build tournament ETL
npm run build:tournament-etl
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific app
nx test api
nx test web
nx test mobile
```

### Linting

```bash
# Lint all projects
npm run lint

# Lint specific project
nx lint api
```

## 📦 Docker Support

The project includes Docker configurations for containerized deployment:

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up
```

## 🔧 ETL Operations

The tournament ETL service supports importing data from external sources:

```bash
# Import leagues
npm run etl:leagues

# Import organizations
npm run etl:organizations

# Import rankings
npm run etl:rankings
```

## 📊 Bundle Analysis

Analyze bundle sizes for optimization:

```bash
# Analyze web bundle
npm run analyze:web

# Analyze mobile bundle
npm run analyze:mobile

# Check bundle sizes
npm run size:web
npm run size:mobile
```

## 🏗️ Nx Commands

```bash
# Visualize project dependencies
npm run graph

# Run affected commands (only changed projects)
npm run affected:build
npm run affected:test
npm run affected:lint

# Show all available targets
nx show project <project-name>
```

## 🧪 API Documentation

When the API is running, Swagger documentation is available at:
```
http://localhost:3000/api
```

## 📱 Mobile Development

### Sync Capacitor

After making changes to mobile app or installing new plugins:

```bash
npm run mobile:sync
```

### Platform-Specific Development

```bash
# Open Android in Android Studio
npm run mobile:android

# Open iOS in Xcode
npm run mobile:ios
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT

## 🛠️ Tech Stack

- **Frontend**: Angular 20, Ionic 8, PrimeNG
- **Backend**: NestJS 11, Express
- **Database**: Supabase (PostgreSQL)
- **Mobile**: Capacitor 7
- **Build Tool**: Nx 22
- **Testing**: Jest, Cypress
- **API Documentation**: Swagger/OpenAPI
- **Cloud Services**: OpenAI, Stripe, Twilio
- **Containerization**: Docker

## 📞 Support

For issues and questions, please create an issue in the repository.