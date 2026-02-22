# Stage 1: build frontend and prepare production dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: single runtime container (frontend + API)
FROM node:20-alpine AS app
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json ./
COPY server ./server
COPY data ./data
EXPOSE 8080
CMD ["node", "server/index.mjs"]
