# Development Dockerfile for API (Dockerfile inside apps/api/)
FROM node:20-alpine AS dev

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy root files needed for Nx
COPY nx.json tsconfig.base.json ./
COPY jest.config.js jest.preset.js ./

# Build and generate optimized package.json first
COPY package*.json ./
COPY libs ./libs
COPY apps/api ./apps/api
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps
RUN npx nx build api
RUN npx nx create-package-json api

# Install only production dependencies for the API
WORKDIR /app/dist/apps/api
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy the built application
COPY --from=0 /app/dist/apps/api .

EXPOSE 3000

CMD ["node", "main.js"]