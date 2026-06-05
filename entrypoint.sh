#!/bin/sh
set -e

echo "[entrypoint] Chạy ingestion pipeline..."
node /ingest/ingest-rag.mjs

echo "[entrypoint] Khởi động Next.js server..."
exec node /app/apps/web/server.js
