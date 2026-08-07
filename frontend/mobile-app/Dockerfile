# Expo dev server (Metro) for the React Native app — DEVELOPMENT ONLY.
#
# Unlike the other images in this stack, this one does not bake the app in. It
# ships the dependency tree and runs `expo start`; docker-compose.yml bind-mounts
# the source over it so edits hot-reload exactly as they do on the host. There
# is deliberately no production target here — shipping the app means an EAS
# build, not a container.
#
# It serves two clients at once on port 8081:
#   - a browser, via Expo's react-native-web output (the app already has
#     MapTab.web.tsx / WebMap.tsx / LocationComponent.web.tsx web variants)
#   - Expo Go or a dev client on a phone or emulator, via the Metro bundler
#
# Build context is the REPO ROOT: the app resolves the shared RTK Query layer
# through the `@shared/*` tsconfig path into frontend/packages/shared, and it
# installs from the root npm-workspaces lockfile (the one ci.yml validates).
FROM node:20-bookworm-slim

# git: some Expo/Metro tooling shells out to it.
# Debian rather than Alpine: React Native's toolchain expects glibc.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# `expo start --tunnel` — the default here, and the only mode that reaches a
# phone without knowing your LAN IP. Expo would otherwise prompt to install this
# on first use, which has nowhere to go in a non-interactive container.
RUN npm install -g @expo/ngrok@^4.1.0

# Everything below runs as the unprivileged `node` user (uid 1000, matching a
# typical Linux host user) so that the files Metro and expo-router write into
# the bind-mounted project — .expo/, .expo/types/, caches — don't come back
# root-owned on the host. Installing as `node` rather than chowning afterwards
# also skips a recursive chown over a very large node_modules.
WORKDIR /app
RUN chown node:node /app
USER node

# Manifests only, so the dependency layer survives source edits.
#
# This installs ALL workspaces rather than filtering to --workspace=mobile-app.
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node database/package.json ./database/
COPY --chown=node:node backend/api-gateway/package.json ./backend/api-gateway/
COPY --chown=node:node frontend/web-app/package.json ./frontend/web-app/
COPY --chown=node:node frontend/mobile-app/package.json ./frontend/mobile-app/
COPY --chown=node:node frontend/packages/shared/package.json ./frontend/packages/shared/
RUN npm ci

# Baked in as a fallback so the image runs standalone; docker-compose.yml
# bind-mounts over both of these for live editing.
COPY --chown=node:node frontend/packages ./frontend/packages
COPY --chown=node:node frontend/mobile-app ./frontend/mobile-app

ENV EXPO_NO_TELEMETRY=1
# Stops Expo trying to launch a browser it has no way to reach from in here.
ENV BROWSER=none

WORKDIR /app/frontend/mobile-app

EXPOSE 8081

# Tunnel mode by default: ngrok gives the phone a public URL for the bundler, so
# it works without knowing your LAN IP and even when the two devices aren't on
# the same network. The local server still listens on 8081 either way, so the
# browser preview works in both modes. docker-compose.yml overrides this command
# to make the mode configurable (EXPO_START_ARGS).
CMD ["npx", "expo", "start", "--port", "8081", "--tunnel"]
