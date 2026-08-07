# One-shot schema/seed runner for the local Docker stack.
#
# Not a long-running service: docker-compose.yml starts this once, waits for it
# to exit 0, and only then boots the api-gateway. Re-running is safe — migrate.js
# tracks applied versions in schema_migrations and the seed SQL is ON CONFLICT
# idempotent.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY scripts ./scripts
COPY migrations ./migrations
COPY seeds ./seeds

RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app

USER appuser

# DATABASE_URL comes from the environment; scripts/migrate.js falls back to
# database/.env, which is deliberately not copied into the image.
CMD ["node", "scripts/migrate.js"]
