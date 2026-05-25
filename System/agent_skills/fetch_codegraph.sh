#!/usr/bin/env bash
# fetch_codegraph.sh — Pull snapshot DB từ host về .codegraph/ local.
#
# Chạy trên MÁY DEV:
#   npm --prefix System run code-graph:fetch
#
# Env override:
#   CODEGRAPH_HOST=100.x.y.z      (Tailscale IP của máy host; bắt buộc nếu khác default)
#   CODEGRAPH_PORT=7474           (default: 7474)
#   CODEGRAPH_PROJECTS="..."      (default: tất cả folder trong 01_Raw/codebase/)
#
# Idempotent: so sha local vs remote, chỉ download khi khác.
# Atomic: tải vào /tmp → mv vào .codegraph/. Curl fail giữa chừng → DB cũ còn nguyên.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEBASE_DIR="$VAULT_ROOT/01_Raw/codebase"
HOST="${CODEGRAPH_HOST:-codegraph-host}"
PORT="${CODEGRAPH_PORT:-7474}"

if [ ! -d "$CODEBASE_DIR" ]; then
  echo "❌ $CODEBASE_DIR not found"
  exit 1
fi

if [ -n "${CODEGRAPH_PROJECTS:-}" ]; then
  read -r -a PROJECTS <<< "$CODEGRAPH_PROJECTS"
else
  PROJECTS=()
  for d in "$CODEBASE_DIR"/*/; do
    [ -d "$d" ] || continue
    PROJECTS+=("$(basename "$d")")
  done
fi

echo "↻ Fetching codegraph snapshots from $HOST:$PORT"

updated=0
skipped=0
unreachable=0

for proj in "${PROJECTS[@]}"; do
  proj_dir="$CODEBASE_DIR/$proj"
  [ -d "$proj_dir" ] || continue

  url_base="http://$HOST:$PORT/$proj"

  # Check remote
  remote_sha="$(curl -fsS --connect-timeout 5 "$url_base/sha" 2>/dev/null || true)"
  if [ -z "$remote_sha" ]; then
    echo "⚠️  $proj: host unreachable or snapshot missing, skip"
    unreachable=$((unreachable+1))
    continue
  fi

  local_sha=""
  [ -f "$proj_dir/.codegraph/.synced_sha" ] && local_sha="$(cat "$proj_dir/.codegraph/.synced_sha")"

  if [ "$remote_sha" = "$local_sha" ]; then
    short="$(printf '%s' "$remote_sha" | cut -c1-8)"
    echo "✓ $proj: already up-to-date ($short)"
    skipped=$((skipped+1))
    continue
  fi

  short_remote="$(printf '%s' "$remote_sha" | cut -c1-8)"
  short_local="$(printf '%s' "${local_sha:-none}" | cut -c1-8)"
  echo "↓ $proj: $short_local → $short_remote"

  mkdir -p "$proj_dir/.codegraph"
  tmp_gz="$(mktemp -t cg-fetch.XXXXXX).gz"
  trap 'rm -f "$tmp_gz" "${tmp_gz%.gz}" 2>/dev/null || true' EXIT

  if ! curl -fsSL --connect-timeout 10 "$url_base/codegraph.db.gz" -o "$tmp_gz"; then
    echo "  ❌ download failed, keeping existing DB"
    rm -f "$tmp_gz"
    continue
  fi

  if ! gunzip -f "$tmp_gz"; then
    echo "  ❌ gunzip failed, keeping existing DB"
    rm -f "${tmp_gz%.gz}" "$tmp_gz" 2>/dev/null || true
    continue
  fi

  mv "${tmp_gz%.gz}" "$proj_dir/.codegraph/codegraph.db"
  printf '%s' "$remote_sha" > "$proj_dir/.codegraph/.synced_sha"
  trap - EXIT
  updated=$((updated+1))
done

echo ""
echo "✅ Done. $updated updated, $skipped up-to-date, $unreachable unreachable."
