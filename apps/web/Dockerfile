# -----------------------------
# Build Stage (Angular with Nx)
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json nx.json tsconfig.base.json ./
RUN npm ci --prefer-offline --no-audit

COPY libs/ ./libs/
COPY apps/web/ ./apps/web/
COPY eslint.config.js ./

RUN npx nx build web --configuration=production


# -----------------------------------
# Production Stage (Nginx, Non-Root)
# -----------------------------------
FROM nginx:alpine AS production

# Optional: Brotli module for better compression
# RUN apk add --no-cache nginx-mod-http-brotli

# Remove default server config
RUN rm -f /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S angular && \
  adduser -S angular -u 1001

# Fix permissions
RUN mkdir -p /var/cache/nginx /var/run /tmp && \
  chown -R angular:angular /var/cache/nginx /var/run /var/log/nginx /tmp

# Copy Angular build
COPY --from=build /app/dist/apps/web/browser /usr/share/nginx/html

# Copy custom nginx.conf
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/nginx.conf

USER angular

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]