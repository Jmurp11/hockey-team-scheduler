# Development Dockerfile for API (Dockerfile inside apps/api/)
FROM node:20-alpine AS dev

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy root dependencies for caching
COPY package*.json nx.json tsconfig.base.json ./
COPY jest.config.js jest.preset.js ./

# Install all deps (dev included)
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy shared libs + full source
COPY libs ./libs
COPY apps/api ./apps/api

EXPOSE 3000

CMD ["npx", "nx", "serve", "api"]