# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy source files
COPY server.ts ./
COPY apchuSize.ts ./
COPY emoji.ts ./
COPY vip-list.ts ./
COPY storage/ ./storage/

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy compiled JavaScript files from builder
COPY --from=builder /app/*.js ./
COPY --from=builder /app/storage/ ./storage/

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the Express server port
EXPOSE 8080

# Health check (pings the Express server)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
