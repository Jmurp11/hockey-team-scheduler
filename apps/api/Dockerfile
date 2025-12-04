# Development Dockerfile for API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for hot reloading
RUN apk add --no-cache libc6-compat

# Copy root package files first for better caching
COPY ../../package*.json ./
COPY ../../nx.json ./
COPY ../../tsconfig.base.json ./

# Copy only necessary NX config files
COPY ../../jest.config.js ../../jest.preset.js ./

# Install dependencies (use npm ci for consistent builds)
# Use --prefer-offline and --no-audit for faster installs
RUN npm ci --prefer-offline --no-audit

# Copy shared libraries that API depends on
COPY ../../libs/ ./libs/

# Copy API source code
COPY . ./apps/api

# Expose port
EXPOSE 3000

# Start the API using the root package.json script
CMD ["npm", "run", "start:api"]
