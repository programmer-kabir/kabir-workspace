# ==============================================================================
# StreamVault Production Container Image
# Multi-stage Dockerfile for high-performance media processing & Node.js backend
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules if required
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies if needed for build)
RUN npm ci

# Copy source files
COPY . .

# Prune dev dependencies for production image
RUN npm prune --production

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install system utilities needed by yt-dlp & media processing
# - python3: Required execution environment for yt-dlp
# - curl, ca-certificates: Required for secure HTTPS extraction
# - ffmpeg: Fallback system ffmpeg (in addition to ffmpeg-static)
RUN apk add --no-cache \
    python3 \
    curl \
    ca-certificates \
    ffmpeg \
    tzdata

# Fetch official yt-dlp standalone binary for Linux
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set production environment flags
ENV NODE_ENV=production \
    PORT=5000 \
    DB_ENGINE=mongodb \
    YT_DLP_PATH=/usr/local/bin/yt-dlp

# Create non-root user and persistent directories
RUN mkdir -p /app/data /app/downloads /app/temp && \
    chown -R node:node /app

# Copy production node_modules and application code from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/src ./src

# Switch to non-root user for maximum security
USER node

# Expose backend API port
EXPOSE 5000

# Health check to ensure zero-downtime container orchestrators detect ready state
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Graceful process startup
CMD ["node", "src/server.js"]
