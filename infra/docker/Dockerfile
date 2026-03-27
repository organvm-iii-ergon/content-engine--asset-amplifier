# Stage 1: Build
FROM node:25-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./

# Copy all package.json files first for better caching
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/domain/package.json ./packages/domain/
COPY packages/logger/package.json ./packages/logger/
COPY packages/queue/package.json ./packages/queue/
COPY packages/storage/package.json ./packages/storage/
COPY services/asset-ingestion/package.json ./services/asset-ingestion/
COPY services/content-generation/package.json ./services/content-generation/
COPY services/fragment-extraction/package.json ./services/fragment-extraction/
COPY services/natural-center/package.json ./services/natural-center/
COPY services/scheduler/package.json ./services/scheduler/
COPY services/platform-adapter/package.json ./services/platform-adapter/
COPY services/analytics/package.json ./services/analytics/
COPY services/design-resizer/package.json ./services/design-resizer/
COPY services/scoring/package.json ./services/scoring/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all projects
RUN pnpm build

# Stage 2: Runtime
FROM node:25-slim AS runner
WORKDIR /app

# Install production dependencies for apps/api
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
# ... copy other package.json files needed for runtime
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
# ... etc

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
