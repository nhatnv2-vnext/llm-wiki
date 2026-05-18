#!/usr/bin/env bash
# zip_for_gitnexus.sh — Đóng gói codebase thành ZIP để upload lên gitnexus.vercel.app.
#
# Output: /tmp/<project>-gitnexus.zip
# Loại trừ: node_modules, dist, .git, .gitnexus, .env, dump.rdb, .DS_Store
#
# Usage:
#   bash zip_for_gitnexus.sh                # zip tất cả project trong 01_Raw/codebase/
#   bash zip_for_gitnexus.sh <project>      # zip 1 project

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEBASE_DIR="$VAULT_ROOT/01_Raw/codebase"
OUT_DIR="${TMPDIR:-/tmp}"

EXCLUDES=(
  "*/node_modules/*"
  "*/dist/*"
  "*/.next/*"
  "*/.angular/*"
  "*/.git/*"
  "*/.gitnexus/*"
  "*/coverage/*"
  "*/dump.rdb"
  "*/.env"
  "*/.env.*"
  "*/.DS_Store"
  "*/build/*"
  "*/out/*"
)

zip_one() {
  local proj="$1"
  local out="$OUT_DIR/${proj}-gitnexus.zip"
  rm -f "$out"

  local exclude_args=()
  for pattern in "${EXCLUDES[@]}"; do
    exclude_args+=(-x "${proj}/${pattern#*/}")
  done

  ( cd "$CODEBASE_DIR" && zip -rq "$out" "$proj" "${exclude_args[@]}" )
  printf "✅ %s → %s (%s)\n" "$proj" "$out" "$(du -h "$out" | cut -f1)"
}

if [ "${1:-}" != "" ]; then
  TARGET="$CODEBASE_DIR/$1"
  [ -d "$TARGET" ] || { echo "❌ Không tìm thấy $TARGET"; exit 1; }
  zip_one "$1"
else
  for proj in "$CODEBASE_DIR"/*/; do
    name="$(basename "$proj")"
    [ "$name" = ".gitkeep" ] && continue
    [ -d "$proj" ] || continue
    zip_one "$name"
  done
fi

echo
echo "🌐 Upload tại: https://gitnexus.vercel.app"
