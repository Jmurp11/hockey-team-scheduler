# Use Node.js 20 Alpine as base image for smaller size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Install tsx globally for TypeScript execution
RUN npm install -g tsx

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (if needed for any web server functionality)
EXPOSE 3000

# Default command - can be overridden when running the container
CMD ["tsx", "src/tournaments.ts"]
