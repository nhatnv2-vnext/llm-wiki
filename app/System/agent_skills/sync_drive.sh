#!/usr/bin/env bash
# sync_drive.sh — Kéo tài liệu mới nhất từ Google Drive về 01_Raw/drive_docs/.
# Yêu cầu: rclone đã cấu hình remote tên `gdrive` trỏ tới folder dự án.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$VAULT_ROOT/01_Raw/drive_docs"
REMOTE="${DRIVE_REMOTE:-gdrive:MyProjectDocs}"

echo "☁️  Syncing from $REMOTE → $DEST"

if ! command -v rclone >/dev/null 2>&1; then
  echo "❌ rclone không có sẵn. Cài: brew install rclone && rclone config"
  exit 1
fi

rclone sync "$REMOTE" "$DEST" \
  --progress \
  --exclude '.DS_Store' \
  --exclude '~$*'

echo "✅ Drive sync complete."
