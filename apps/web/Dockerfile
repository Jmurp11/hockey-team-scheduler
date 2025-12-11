# -----------------------------
# Build Stage (Angular with Nx)
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy root-level manifests
COPY package*.json nx.json tsconfig.base.json ./

RUN npm ci --prefer-offline --no-audit

# Copy Nx project sources
COPY libs/ ./libs/
COPY apps/web/ ./apps/web/
COPY eslint.config.js ./

# Build Angular (Nx will optimize for production)
RUN npx nx build web --configuration=production


# -----------------------------------
# Production Stage (Nginx, Non-Root)
# -----------------------------------
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S angular && \
  adduser -S angular -u 1001

# Copy Angular dist output
COPY --from=build /app/dist/apps/web/browser /usr/share/nginx/html

# Copy your custom nginx.conf
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/nginx.conf

# Fix permissions so nginx can run non-root
RUN mkdir -p /var/cache/nginx /var/run && \
  chown -R angular:angular /var/cache/nginx /var/run /var/log/nginx

USER angular

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]