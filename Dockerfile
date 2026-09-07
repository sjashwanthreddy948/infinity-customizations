# Multi-stage production build for Infinity Customizations
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy application source
COPY . .

# Compile server and bundle client
RUN npm run build:server
RUN npm run build:client

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root package
COPY package.json ./

# Copy server build and dependencies
COPY server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist

# Copy client dist bundle
COPY --from=builder /app/client/dist ./client/dist

# Copy SQL schema for initialization
COPY server/src/db/schema.sql ./server/src/db/schema.sql

# Create persistent uploads directory
RUN mkdir -p /app/server/uploads

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
