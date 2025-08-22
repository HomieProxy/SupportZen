# Dockerfile for Pre-built Next.js Application

# Stage 1: Production Runner
# Use a slim Node.js image for the final container
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables for Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary pre-built files from the host
# These files will come from the unzipped artifact from the GitHub workflow
COPY --chown=nextjs:nodejs ./.next ./.next
COPY --chown=nextjs:nodejs ./package.json ./package.json

# If a 'public' folder exists in the artifact, copy it
COPY --chown=nextjs:nodejs ./public ./public

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# The command to start the application
# This assumes the start script in package.json is `next start`
CMD ["npm", "start"]
