# Docker Setup for Hockey Team Scheduler

This project includes Docker configuration for both development and production environments.

## Prerequisites

- Docker
- Docker Compose
- Environment variables file (`.env`) in the `api` directory

## Environment Variables

Create a `.env` file in the `api` directory with the following variables:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Production Deployment

### Build and run all services:

```bash
docker-compose up -d
```

### Build specific service:

```bash
# Build API only
docker-compose build api

# Build UI only
docker-compose build ui
```

### Access the application:

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000

## Development Environment

### Run development environment:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Access the development application:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000

### Development features:

- Hot reload for both frontend and backend
- Volume mounting for live code changes
- Development-optimized builds

## Docker Commands

### View running containers:

```bash
docker-compose ps
```

### View logs:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs ui
```

### Stop services:

```bash
docker-compose down
```

### Remove containers and volumes:

```bash
docker-compose down -v
```

### Rebuild containers:

```bash
docker-compose up --build
```

## Health Checks

Both services include health checks:

- **API**: Checks `/health` endpoint
- **UI**: Checks root endpoint

## Service Dependencies

- The UI service depends on the API service being healthy
- API proxy is configured in Nginx to forward `/api/` requests to the backend

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Angular)     │    │   (NestJS)      │
│   Port: 80      │───▶│   Port: 3000    │
│   Nginx         │    │   Node.js       │
└─────────────────┘    └─────────────────┘
```

## Troubleshooting

### Check container status:

```bash
docker-compose ps
```

### Check logs for errors:

```bash
docker-compose logs -f
```

### Restart a specific service:

```bash
docker-compose restart api
docker-compose restart ui
```

### Access container shell:

```bash
# API container
docker-compose exec api sh

# UI container
docker-compose exec ui sh
```
