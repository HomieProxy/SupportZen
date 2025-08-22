# Dockerfile
# Use an official Node.js runtime as a parent image (Alpine for smaller size)
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Set NODE_ENV to production to ensure Next.js runs in production mode
# and npm installs only production dependencies.
ENV NODE_ENV=production

# Copy package.json and package-lock.json (if available) first.
# This leverages Docker's layer caching. If these files haven't changed,
# Docker won't re-run npm install unless necessary.
# The release artifact created by the workflow only has package.json.
COPY package.json ./

# Install production dependencies.
# --omit=dev is the modern equivalent of --production.
RUN npm install --omit=dev

# Copy the rest of the application files from the build context.
# This includes the .next folder (build output), public folder (if exists),
# and next.config.js or next.config.mjs (if exists), etc.
# The .dockerignore file will prevent unnecessary files from being copied.
COPY . .

# Expose the port Next.js runs on by default (3000)
EXPOSE 3100

# Define the command to run the app.
# `npm start` will execute `next start` as defined in your package.json.
CMD ["npm", "start"]
