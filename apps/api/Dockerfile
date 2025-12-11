# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy root files needed for Nx
COPY nx.json tsconfig.base.json ./
COPY jest.config.js jest.preset.js ./

# Copy package files and install all dependencies
COPY package*.json ./
COPY apps/api ./apps/api
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Build the application
RUN npx nx build api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy the built application from builder stage
COPY --from=builder /app/dist/apps/api ./

# Install only production dependencies
RUN npm ci --omit=dev --prefer-offline --no-audit

EXPOSE 3000

CMD ["node", "main.js"]