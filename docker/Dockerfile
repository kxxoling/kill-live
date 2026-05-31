# Use Bun as base
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY drizzle.config.ts ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LIVEKIT_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Run lint and typecheck before build
RUN bun run lint
RUN bun run typecheck

RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Oven/bun is based on debian, so we use groupadd/useradd
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy essential files for database migrations
COPY package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/db ./db
COPY --from=builder /app/config ./config

USER nextjs

EXPOSE 3009

ENV PORT 3009
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
