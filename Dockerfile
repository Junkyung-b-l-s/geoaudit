FROM node:22-slim AS base

RUN corepack enable pnpm

# Install Chromium dependencies + tini (forwards SIGTERM so the container exits 0 on redeploy)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    tini \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["pnpm", "start"]
