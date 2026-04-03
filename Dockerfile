# ── Build Stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (including devDeps for linting/build)
RUN npm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# ── Runtime Stage ────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set environment to production
ENV NODE_ENV=production

# Copy built app and dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Create needed directories for volumes
RUN mkdir -p session output && chown -R appuser:appgroup /app

# Explicitly use appuser
USER appuser

# Entry point
CMD ["npm", "start"]
