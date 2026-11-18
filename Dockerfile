# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.14

# Install production dependencies only (runs again only when the lockfile changes).
FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:${BUN_VERSION}-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=deps /app/node_modules ./node_modules
# Copies the app (src/, plus drizzle/ and scripts/ in the Postgres variant); .dockerignore keeps tests, docs and secrets out.
COPY --chown=bun:bun . .

# The base image ships a non-root `bun` user.
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD ["bun", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/health`).then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# Exec form: bun runs as PID 1 and receives SIGTERM for graceful shutdown.
CMD ["bun", "src/index.ts"]
