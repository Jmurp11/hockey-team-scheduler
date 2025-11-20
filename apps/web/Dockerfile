# Use Node.js 20 Alpine for building
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files first for better caching
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy only necessary NX config files
COPY jest.config.js jest.preset.js ./

# Install dependencies with optimization flags
RUN npm ci --prefer-offline --no-audit

# Copy shared libraries (required by web app)
COPY libs/ ./libs/

# Copy web app source
COPY apps/web/ ./apps/web/

# Build the Angular application
RUN npm run build:web

# Production stage with Nginx
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S angular && \
    adduser -S angular -u 1001

# Copy built Angular app to Nginx html directory
COPY --from=build --chown=angular:angular /app/dist/apps/web/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY --chown=angular:angular apps/web/nginx.conf /etc/nginx/nginx.conf

# Change ownership of the nginx directories
RUN chown -R angular:angular /usr/share/nginx/html && \
    chown -R angular:angular /var/cache/nginx && \
    chown -R angular:angular /var/log/nginx && \
    chown -R angular:angular /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R angular:angular /var/run/nginx.pid

# Switch to non-root user
USER angular

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
