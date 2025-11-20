# Development Dockerfile for API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for hot reloading
RUN apk add --no-cache libc6-compat

# Copy root package files (needed for dependencies)
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy only the API source code and required config files
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

# Expose port
EXPOSE 3000

# Start the API using the root package.json script
CMD ["npm", "run", "start:api"]
