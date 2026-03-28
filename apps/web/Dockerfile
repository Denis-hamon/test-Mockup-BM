# LegalConnect — Multi-stage Next.js production build
# Build context must be monorepo root (for pnpm workspace resolution)
# Requires output: "standalone" in next.config.ts

# --- Stage 1: Base ---
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS deps

# Copy workspace structure files first (better cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/widget/package.json ./apps/widget/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/crypto/package.json ./packages/crypto/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/email/package.json ./packages/email/package.json

RUN pnpm install --frozen-lockfile

# --- Stage 3: Builder ---
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/widget/node_modules ./apps/widget/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/crypto/node_modules ./packages/crypto/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/email/node_modules ./packages/email/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @legalconnect/web build

# --- Stage 4: Runner ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
