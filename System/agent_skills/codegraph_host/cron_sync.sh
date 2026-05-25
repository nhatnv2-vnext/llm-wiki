#!/usr/bin/env bash
# cron_sync.sh — Re-index codebase + snapshot DB sang folder serve qua HTTP.
#
# Chạy trên MÁY ALWAYS-ON (host machine), cron mỗi 30 phút:
#   */30 * * * * /full/path/to/cron_sync.sh >> /tmp/codegraph-sync.log 2>&1
#
# Env override:
#   VAULT_ROOT=/path/to/My_Project_Vault         (default: $HOME/Documents/LLM/My_Project_Vault)
#   CODEGRAPH_SNAPSHOTS=/path/to/snapshots       (default: $HOME/codegraph-snapshots)
#   CODEGRAPH_PROJECTS="proj1 proj2"             (default: tất cả folder trong 01_Raw/codebase/)
#
# Output mỗi project:
#   $SNAPSHOTS/<proj>/codegraph.db.gz   — DB nén
#   $SNAPSHOTS/<proj>/sha               — git SHA của submodule lúc index
#   $SNAPSHOTS/<proj>/synced_at         — ISO timestamp

set -euo pipefail

VAULT_ROOT="${VAULT_ROOT:-$HOME/Documents/LLM/My_Project_Vault}"
SNAPSHOTS="${CODEGRAPH_SNAPSHOTS:-$HOME/codegraph-snapshots}"
CODEBASE_DIR="$VAULT_ROOT/01_Raw/codebase"

# Lock guard: cron mỗi 30 phút có thể overlap nếu index >5 phút.
LOCKFILE="/tmp/codegraph-sync.lock"
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "[$(date -u +%FT%TZ)] ⏭  Another sync running (lock held). Exit."
  exit 0
fi

if ! command -v codegraph >/dev/null 2>&1; then
  echo "❌ codegraph CLI not found. Install: npm install -g @colbymchenry/codegraph"
  exit 1
fi

if [ ! -d "$CODEBASE_DIR" ]; then
  echo "❌ $CODEBASE_DIR not found"
  exit 1
fi

mkdir -p "$SNAPSHOTS"

if [ -n "${CODEGRAPH_PROJECTS:-}" ]; then
  read -r -a PROJECTS <<< "$CODEGRAPH_PROJECTS"
else
  PROJECTS=()
  for d in "$CODEBASE_DIR"/*/; do
    [ -d "$d" ] || continue
    PROJECTS+=("$(basename "$d")")
  done
fi

echo "[$(date -u +%FT%TZ)] 🚀 cron_sync start — ${#PROJECTS[@]} project(s)"

for proj in "${PROJECTS[@]}"; do
  proj_dir="$CODEBASE_DIR/$proj"
  if [ ! -d "$proj_dir/.git" ]; then
    echo "⏭  $proj: not a git repo, skip"
    continue
  fi

  cd "$proj_dir"

  # Safety: nếu submodule có local change, abort (không reset, tránh mất work)
  if ! git diff --quiet HEAD 2>/dev/null; then
    echo "⚠️  $proj: local changes detected, skipping sync"
    continue
  fi

  # Fetch + reset về tracking branch
  git fetch origin --quiet 2>&1 || { echo "⚠️  $proj: git fetch failed"; continue; }
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$branch" = "HEAD" ]; then
    echo "⚠️  $proj: detached HEAD, skip reset"
  else
    git reset --hard "origin/$branch" --quiet 2>&1 || { echo "⚠️  $proj: reset failed"; continue; }
  fi

  # Init nếu chưa có index
  if [ ! -d ".codegraph" ]; then
    echo "ℹ️  $proj: first index"
    codegraph init . >/dev/null 2>&1
  fi
  codegraph sync -q 2>&1 || codegraph index -q

  # Snapshot DB → tmp → gzip → atomic rename
  out_dir="$SNAPSHOTS/$proj"
  mkdir -p "$out_dir"
  cp ".codegraph/codegraph.db" "$out_dir/codegraph.db.new"
  gzip -9 -f "$out_dir/codegraph.db.new"
  mv "$out_dir/codegraph.db.new.gz" "$out_dir/codegraph.db.gz"
  git rev-parse HEAD > "$out_dir/sha"
  date -u +%FT%TZ > "$out_dir/synced_at"

  size=$(du -h "$out_dir/codegraph.db.gz" | cut -f1)
  short_sha=$(cut -c1-8 < "$out_dir/sha")
  echo "✅ $proj: $short_sha → $size"
done

echo "[$(date -u +%FT%TZ)] 🏁 cron_sync done"
