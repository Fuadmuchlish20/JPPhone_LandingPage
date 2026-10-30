# Build context: repository root
#   docker build -f apps/device-agent/Dockerfile -t claudeemulator/device-agent .

FROM node:22-bookworm-slim AS manifests
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/device-agent/package.json apps/device-agent/

FROM manifests AS build
RUN npm ci --workspace @ce/device-agent --include-workspace-root
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/device-agent apps/device-agent
RUN npm run build -w @ce/device-agent

FROM manifests AS prod-deps
RUN npm ci --omit=dev --workspace @ce/device-agent

FROM node:22-bookworm-slim
ARG SCRCPY_VERSION=3.3.1
RUN apt-get update \
 && apt-get install -y --no-install-recommends adb e2fsprogs util-linux mount ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
# scrcpy-server version must match SCRCPY_VERSION passed to the agent at runtime
RUN mkdir -p /opt/scrcpy \
 && curl -fsSL -o /opt/scrcpy/scrcpy-server.jar \
    "https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_VERSION}/scrcpy-server-v${SCRCPY_VERSION}"
ENV NODE_ENV=production \
    SCRCPY_VERSION=${SCRCPY_VERSION} \
    SCRCPY_SERVER_PATH=/opt/scrcpy/scrcpy-server.jar
WORKDIR /app
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/device-agent/dist ./dist
CMD ["node", "dist/index.js"]
