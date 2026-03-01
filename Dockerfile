# Base image official Node.js 20 slim (lightweight)
FROM node:20-slim

# Install android-tools-adb, a system dependency strictly required to run ADB commands
RUN apt-get update && apt-get install -y --no-install-recommends \
    android-tools-adb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY tsconfig.json .
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Keep only production dependencies to reduce image size
RUN npm ci --omit=dev

# Verify ADB is installed properly
RUN adb version

# Expose API port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
