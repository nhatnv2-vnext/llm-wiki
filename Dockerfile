# syntax=docker/dockerfile:1
# ── Stage 1: cài dependencies ──────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN corepack enable

# Copy manifest files trước để tận dụng Docker layer cache.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/System/package.json ./apps/System/

# --mount=type=cache giữ pnpm store giữa các lần build → lần 2+ rất nhanh.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    corepack prepare pnpm@10.17.1 --activate && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --frozen-lockfile

# ── Stage 2: build Next.js ──────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# WIKI_ROOT_PATH cần có giá trị tuyệt đối để vượt qua validation lúc build.
ENV WIKI_ROOT_PATH=/wiki

# Tạo thư mục /wiki rỗng để next build không bị ENOENT khi pre-render pages.
# Volume thật sẽ được mount đè lên khi container chạy.
RUN mkdir -p /wiki

# --mount=type=cache cache .next/cache giữa các lần build → rebuild nhanh hơn.
RUN --mount=type=cache,id=nextjs-cache,target=/app/apps/web/.next/cache \
    pnpm --filter web build

# Compile ingestion script thành ESM bundle.
RUN cd apps/web && npx esbuild scripts/ingest-rag.ts \
    --bundle \
    --platform=node \
    --format=esm \
    --external:@lancedb/lancedb \
    --external:apache-arrow \
    "--external:node:*" \
    --outfile=scripts/ingest-rag.mjs

# Tạo môi trường chạy riêng cho ingest script:
# script + node_modules của nó nằm trong /ingest — hoàn toàn tách khỏi /app.
# Dùng npm (không phải pnpm) để tránh symlink của pnpm virtual store.
RUN mkdir /ingest && \
    cp apps/web/scripts/ingest-rag.mjs /ingest/ingest-rag.mjs && \
    cd /ingest && \
    npm install @lancedb/lancedb apache-arrow \
        --no-save --no-audit --no-fund \
        --registry https://registry.npmmirror.com

# ── Stage 3: runtime image (nhỏ gọn) ───────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Next standalone bind theo HOSTNAME. Mặc định = tên container nên chỉ nghe
# trên interface đó → healthcheck localhost/127.0.0.1 fail. Đặt 0.0.0.0 để
# nghe mọi interface (vẫn vào được qua port mapping của Docker).
ENV HOSTNAME=0.0.0.0
ENV WIKI_ROOT_PATH=/wiki
ENV LANCEDB_PATH=/data/lancedb

RUN groupadd --system --gid 1001 nodejs && \
    useradd  --system --uid 1001 --gid nodejs --no-create-home nextjs && \
    mkdir -p /wiki /data/lancedb && \
    chown nextjs:nodejs /data/lancedb

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./apps/web/public

# /ingest chứa script + node_modules riêng — không đụng tới /app/node_modules.
COPY --from=builder --chown=nextjs:nodejs /ingest /ingest

COPY --chown=nextjs:nodejs entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000
CMD ["/entrypoint.sh"]
