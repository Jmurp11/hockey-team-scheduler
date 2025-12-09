# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and Nx config
COPY package*.json ./
COPY nx.json tsconfig.base.json ./

# Install all dependencies for building
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY tournament-etl/ ./tournament-etl/

# Build the application and generate optimized package.json
RUN npx nx build tournament-etl
RUN npx nx create-package-json tournament-etl

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy the optimized package.json and install production dependencies
COPY --from=builder /app/dist/tournament-etl/package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy built application
COPY --from=builder /app/dist/tournament-etl ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (if needed for any web server functionality)
EXPOSE 3000

# Default command - can be overridden when running the container
CMD ["node", "run-etl.js"]
