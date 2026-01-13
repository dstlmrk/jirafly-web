# Dockerfile.dev for Jirafly Web Application (Development)
# Includes devDependencies for hot reload with nodemon

FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=development \
    PORT=3000

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy application source (will be overridden by volume mount)
COPY src ./src

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]
