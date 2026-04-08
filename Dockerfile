FROM node:20-bookworm-slim AS base

ARG NPM_REGISTRY=https://registry.npmjs.org/

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
ENV CI=1

RUN npm config set registry "${NPM_REGISTRY}" \
	&& npm install -g pnpm@10.33.0

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

ARG GLM_MODEL=glm-4-flash
ARG E2B_API_KEY=
ARG NEON_AUTH_BASE_URL=
ARG NEON_AUTH_COOKIE_SECRET=
ARG CLOUDFLARE_ACCOUNT_ID=
ARG R2_ACCESS_KEY_ID=
ARG R2_SECRET_ACCESS_KEY=

ENV GLM_MODEL=${GLM_MODEL}
ENV E2B_API_KEY=${E2B_API_KEY}
ENV NEON_AUTH_BASE_URL=${NEON_AUTH_BASE_URL}
ENV NEON_AUTH_COOKIE_SECRET=${NEON_AUTH_COOKIE_SECRET}
ENV CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
ENV R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
ENV R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
