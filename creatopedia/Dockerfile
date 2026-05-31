# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .yarnrc.yml* ./
RUN \
  if [ -f yarn.lock ]; then corepack enable yarn && yarn install --immutable; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG INSTAGRAM_ACCESS_TOKEN
ARG NEXT_PUBLIC_BASE_DOMAIN
ARG CRON_SECRET
ARG INSTAGRAM_APP_ID
ARG INSTAGRAM_APP_SECRET
ARG INSTAGRAM_CLIENT_ID
ARG INSTAGRAM_CLIENT_SECRET
ARG INSTAGRAM_REDIRECT_URI
ARG TOKEN_ENCRYPTION_KEY

# Set environment variables for the build process
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV INSTAGRAM_ACCESS_TOKEN=$INSTAGRAM_ACCESS_TOKEN
ENV NEXT_PUBLIC_BASE_DOMAIN=$NEXT_PUBLIC_BASE_DOMAIN
ENV CRON_SECRET=$CRON_SECRET
ENV INSTAGRAM_APP_ID=$INSTAGRAM_APP_ID
ENV INSTAGRAM_APP_SECRET=$INSTAGRAM_APP_SECRET
ENV INSTAGRAM_CLIENT_ID=$INSTAGRAM_CLIENT_ID
ENV INSTAGRAM_CLIENT_SECRET=$INSTAGRAM_CLIENT_SECRET
ENV INSTAGRAM_REDIRECT_URI=$INSTAGRAM_REDIRECT_URI
ENV TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then corepack enable yarn && yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
