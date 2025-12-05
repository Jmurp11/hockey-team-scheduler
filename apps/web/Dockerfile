# -----------------------------
# Build Stage (Angular with Nx)
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy root-level manifests for caching
COPY package*.json nx.json tsconfig.base.json ./
COPY jest.config.js jest.preset.js ./

# Install dependencies once (cached unless package.json changes)
RUN npm ci --prefer-offline --no-audit

# Copy only necessary files for Nx build
COPY libs/ ./libs/
COPY apps/web/ ./apps/web/
COPY eslint.config.js ./
# nx.json and tsconfig.base.json already copied above

# Build Angular app using Nx
RUN npx nx build web --configuration=production
# If you prefer: RUN npm run build:web


# -----------------------------------
# Production Stage (Nginx, Non-Root)
# -----------------------------------
FROM nginx:alpine AS production

# Create non-root nginx user
RUN addgroup -g 1001 -S angular && \
  adduser -S angular -u 1001

# Copy Angular build output
COPY --from=build --chown=angular:angular \
  /app/dist/apps/web/browser \
  /usr/share/nginx/html

# Copy app-specific nginx.conf located in apps/web/
COPY --chown=angular:angular \
  apps/web/nginx.conf \
  /etc/nginx/nginx.conf

# Permissions needed for non-root nginx
RUN mkdir -p /var/cache/nginx /var/run && \
  chown -R angular:angular /var/cache/nginx /var/run /var/log/nginx

USER angular

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]