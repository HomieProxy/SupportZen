# 1. Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install SQLite
RUN apk add --no-cache sqlite

# You may need to disable the `next telemetry` during build.
# You can do this by setting the NEXT_TELEMETRY_DISABLED environment variable to 1.
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Set the user to a non-root user for security
USER node

# In a production environment, you would typically mount a volume 
# to persist the SQLite database file across container restarts.
# e.g., docker run -v /path/on/host:/app/data ...
# For this example, we'll create the data directory inside the container.
RUN mkdir -p /app/data
ENV DATABASE_URL=file:/app/data/sqlite.db

CMD ["npm", "start", "-p", "3000"]
