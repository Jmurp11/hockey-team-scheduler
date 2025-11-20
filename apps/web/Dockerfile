# Use Node.js 20 Alpine for building
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --silent 

# Copy shared libraries (required by web app)
COPY libs/ ./libs/

# Copy web app source and required config files
COPY apps/web/ ./apps/web/
COPY tsconfig.base.json ./

# Build the Angular application
RUN npm run build:web

# Production stage with Nginx
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S angular
RUN adduser -S angular -u 1001

# Copy built Angular app to Nginx html directory
COPY --from=build /app/dist/apps/web/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Change ownership of the nginx directories
RUN chown -R angular:angular /usr/share/nginx/html
RUN chown -R angular:angular /var/cache/nginx
RUN chown -R angular:angular /var/log/nginx
RUN chown -R angular:angular /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R angular:angular /var/run/nginx.pid

# Switch to non-root user
USER angular

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
