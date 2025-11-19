# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build stage - install all dependencies and build
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --omit=dev && npm cache clean --force

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
# Remove dev dependencies and test files before build
RUN rm -rf test/ src/**/*.spec.ts
RUN npm run build

# Production stage - minimal runtime image
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/package*.json ./

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check (lightweight)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/main"]
