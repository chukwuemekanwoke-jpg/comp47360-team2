# Build context is the REPO ROOT, not frontend/web-app/ — see docker-compose.yml.
#
# Two reasons it has to be:
#   1. The web app imports the shared RTK Query layer by relative path
#      (`../../packages/shared/src/apiSlice.ts`), so frontend/packages/shared
#      must be inside the context.
#   2. It installs from the root npm-workspaces lockfile rather than
#      frontend/web-app/package-lock.json. The root lockfile is the one CI
#      validates on every PR (ci.yml's `web` job runs `npm ci` at the root);
#      the web-app-local lockfile has drifted out of sync with its own
#      package.json and `npm ci` rejects it.
FROM node:20-alpine AS build

WORKDIR /app

# Only the manifests, so this layer is reused whenever source changes but
# dependencies don't. The two --workspace filters keep the mobile app's Expo /
# React Native tree out of the install.
COPY package.json package-lock.json ./
COPY frontend/web-app/package.json ./frontend/web-app/
COPY frontend/packages/shared/package.json ./frontend/packages/shared/
RUN npm ci \
    --workspace=frontend/web-app \
    --workspace=frontend/packages/shared \
    --include-workspace-root

COPY frontend/packages ./frontend/packages
COPY frontend/web-app ./frontend/web-app

# Baked into the bundle at build time. Defaults to a same-origin relative path
# that nginx proxies to the api-gateway, so the browser never makes a
# cross-origin request and CORS never comes into it.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build --workspace=frontend/web-app


FROM nginx:1.27-alpine

# SPA history fallback + /api reverse proxy to the api-gateway.
COPY frontend/web-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/web-app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
