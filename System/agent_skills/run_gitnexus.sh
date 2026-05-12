#!/usr/bin/env bash
# run_gitnexus.sh — Chạy GitNexus lên codebase ở 01_Raw, đồng bộ output Markdown sang 02_Wiki/05_Code_Graph.
#
# Yêu cầu: CLI `gitnexus` đã cài global một lần:
#   sudo npm install -g gitnexus
#
# Cách dùng:
#   bash run_gitnexus.sh                  # quét toàn bộ subprojects trong 01_Raw/codebase/
#   bash run_gitnexus.sh <project_name>   # chỉ quét 1 project
#
# Output:
#   - Index nội bộ của GitNexus: <project>/.gitnexus/ (giữ nguyên trong code target)
#   - Skill markdown (đầu ra wiki): <project>/.claude/skills/generated/*.md → copy về 02_Wiki/05_Code_Graph/<project>/

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEBASE_DIR="$VAULT_ROOT/01_Raw/codebase"
WIKI_OUT="$VAULT_ROOT/02_Wiki/05_Code_Graph"

if ! command -v gitnexus >/dev/null 2>&1; then
  echo "❌ Chưa cài CLI 'gitnexus'."
  echo "   Cài 1 lần (yêu cầu sudo): sudo npm install -g gitnexus"
  exit 1
fi

mkdir -p "$WIKI_OUT"

run_one() {
  local proj_path="$1"
  local proj_name
  proj_name="$(basename "$proj_path")"
  local out_dir="$WIKI_OUT/$proj_name"

  echo "📊 Analyzing: $proj_name"
  echo "   src: $proj_path"

  # --skills sinh ra .claude/skills/generated/*.md (đây là output markdown chính).
  # Embeddings off by default (chạy nhanh) — bật bằng GITNEXUS_EMBEDDINGS=1.
  local extra_flags=""
  [ "${GITNEXUS_EMBEDDINGS:-0}" = "1" ] && extra_flags="--embeddings"

  ( cd "$proj_path" && gitnexus analyze --skills --skip-agents-md $extra_flags ) || {
    echo "⚠️  gitnexus analyze thất bại cho $proj_name"
    return 1
  }

  # Đồng bộ output markdown sang wiki
  local src_skills="$proj_path/.claude/skills/generated"
  if [ -d "$src_skills" ]; then
    rm -rf "$out_dir"
    mkdir -p "$out_dir"
    rsync -a --include='*/' --include='*.md' --exclude='*' "$src_skills/" "$out_dir/"
    echo "   ✅ Markdown copied → $(realpath --relative-to="$VAULT_ROOT" "$out_dir" 2>/dev/null || echo "$out_dir")"
  else
    echo "   ⚠️  Không tìm thấy $src_skills (gitnexus có sinh skills không?)"
  fi

  # Tạo index trang README cho project trong wiki
  cat > "$out_dir/README.md" <<EOF
---
title: Code Graph — $proj_name
type: architecture
source:
  - 01_Raw/codebase/$proj_name
status: draft
last_synced: $(date +%Y-%m-%d)
tags: [code-graph, gitnexus, $proj_name]
---

# Code Graph: $proj_name

Sinh bởi \`gitnexus analyze --skills\` lên \`01_Raw/codebase/$proj_name\`.

## Skill files
$(find "$out_dir" -maxdepth 2 -type f -name '*.md' ! -name 'README.md' | sed "s|$out_dir/|- [[|" | sed 's|\.md$|]]|' | sort)

## Liên kết
- Index nội bộ (LadybugDB): \`01_Raw/codebase/$proj_name/.gitnexus/\`
- Dashboard chính: [[Index]]
EOF
}

if [ "${1:-}" != "" ]; then
  TARGET="$CODEBASE_DIR/$1"
  [ -d "$TARGET" ] || { echo "❌ Không tìm thấy $TARGET"; exit 1; }
  run_one "$TARGET"
else
  found=0
  for proj in "$CODEBASE_DIR"/*/; do
    [ -d "$proj" ] || continue
    [ "$(basename "$proj")" = ".gitkeep" ] && continue
    # Bỏ qua nếu chưa có code thật
    if [ -z "$(find "$proj" -maxdepth 2 -type f ! -name '.gitkeep' -print -quit)" ]; then
      echo "⏭  Bỏ qua $(basename "$proj") (chưa mount code)"
      continue
    fi
    run_one "${proj%/}"
    found=$((found+1))
  done
  [ $found -eq 0 ] && echo "📭 Chưa có project nào trong $CODEBASE_DIR. Mount code bằng git submodule trước."
fi

echo "✅ Done."
