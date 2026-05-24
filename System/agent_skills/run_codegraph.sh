#!/usr/bin/env bash
# run_codegraph.sh — Chạy CodeGraph (@colbymchenry/codegraph, MIT) lên codebase ở 01_Raw,
# sinh `.md` skill per area sang 02_Wiki/05_Code_Graph.
#
# Yêu cầu: CLI `codegraph` đã cài global:
#   npm install -g @colbymchenry/codegraph
#
# Cách dùng:
#   bash run_codegraph.sh                  # quét toàn bộ subprojects trong 01_Raw/codebase/
#   bash run_codegraph.sh <project_name>   # chỉ quét 1 project
#
# Output:
#   - Index nội bộ CodeGraph: <project>/.codegraph/codegraph.db (SQLite, .gitignored)
#   - Skill markdown: 02_Wiki/05_Code_Graph/<project>/<area>/SKILL.md
#   - README per project: 02_Wiki/05_Code_Graph/<project>/README.md

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEBASE_DIR="$VAULT_ROOT/01_Raw/codebase"
WIKI_OUT="$VAULT_ROOT/02_Wiki/05_Code_Graph"

if ! command -v codegraph >/dev/null 2>&1; then
  echo "❌ Chưa cài CLI 'codegraph'."
  echo "   Cài: npm install -g @colbymchenry/codegraph"
  exit 1
fi

mkdir -p "$WIKI_OUT"

# Tìm "src root" của project: thử src/, src/app/, hoặc fallback root project
detect_src_root() {
  local proj="$1"
  for candidate in "src/app" "src" "lib" "."; do
    if [ -d "$proj/$candidate" ] && [ "$(find "$proj/$candidate" -maxdepth 2 -name '*.ts' -o -name '*.js' -o -name '*.py' -o -name '*.go' 2>/dev/null | head -1)" ]; then
      echo "$candidate"
      return
    fi
  done
  echo "."
}

# Liệt kê "areas" = thư mục con cấp 1 dưới src root (mô phỏng grouping GitNexus)
list_areas() {
  local proj="$1"
  local src_root="$2"
  find "$proj/$src_root" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort
}

# Compose SKILL.md cho 1 area
build_area_skill() {
  local proj_path="$1"
  local proj_name="$2"
  local src_root="$3"
  local area="$4"
  local area_path="$src_root/$area"
  local out_dir="$WIKI_OUT/$proj_name/$area"
  local out_file="$out_dir/SKILL.md"

  mkdir -p "$out_dir"

  # Đếm file trong area (qua codegraph files)
  local file_count
  file_count=$(codegraph files -p "$proj_path" --filter "$area_path" --json 2>/dev/null \
    | jq '[.[] | select(.path | startswith("'"$area_path"'/"))] | length' 2>/dev/null || echo "0")

  # Gọi context với task chuẩn hoá
  local ctx
  ctx=$(codegraph context "Explain the $area area: main components, entry points, key symbols" \
    -p "$proj_path" --no-code -n 30 2>&1 || echo "_(context query failed)_")

  # Render markdown với frontmatter Obsidian-friendly
  cat > "$out_file" <<EOF
---
name: $area
description: "Skill for the $area area of $proj_name ($file_count files indexed)."
type: architecture
source:
  - 01_Raw/codebase/$proj_name/$area_path
status: draft
last_synced: $(date +%Y-%m-%d)
tags:
  - code-graph
  - codegraph
  - $proj_name
  - $area
---

# $area · $proj_name

> Sinh tự động bởi \`codegraph context\` từ index \`.codegraph/codegraph.db\`.
> Re-run: \`npm --prefix System run code-graph\`.

**Vị trí:** \`01_Raw/codebase/$proj_name/$area_path\` — $file_count file indexed.

$ctx

## Khám phá sâu hơn

- Query symbol cụ thể: \`codegraph query "<name>" -p 01_Raw/codebase/$proj_name\`
- Tìm callers: \`codegraph callers <symbol> -p 01_Raw/codebase/$proj_name\`
- Impact analysis: \`codegraph impact <symbol> -p 01_Raw/codebase/$proj_name\`
- Live MCP query trong Claude Code: \`npm --prefix System run code-graph:mcp\`

## Liên kết
- [[README]] — Index project $proj_name
- [[Index]] — Dashboard chính
EOF
}

# Build README cho 1 project
build_project_readme() {
  local proj_path="$1"
  local proj_name="$2"
  local src_root="$3"
  local out_dir="$WIKI_OUT/$proj_name"
  local readme="$out_dir/README.md"

  # Liệt kê wikilink cho từng area
  local area_links=""
  while IFS= read -r area; do
    [ -z "$area" ] && continue
    area_links="${area_links}- [[${area}/SKILL|${area}]]"$'\n'
  done < <(list_areas "$proj_path" "$src_root")

  cat > "$readme" <<EOF
---
title: Code Graph — $proj_name
type: architecture
source:
  - 01_Raw/codebase/$proj_name
status: draft
last_synced: $(date +%Y-%m-%d)
tags:
  - code-graph
  - codegraph
  - $proj_name
---

# Code Graph: $proj_name

Sinh bởi \`codegraph index\` + \`codegraph context\` (@colbymchenry/codegraph, MIT).
Index nội bộ: \`01_Raw/codebase/$proj_name/.codegraph/\` (SQLite, gitignored).
Src root: \`$src_root\`.

## Skill files (per area)
$area_links
## Re-index
\`\`\`bash
npm --prefix System run code-graph             # toàn bộ projects
npm --prefix System run code-graph -- $proj_name  # chỉ project này (qua run_codegraph.sh arg)
\`\`\`

## Liên kết
- [[Index]] — Dashboard chính
EOF
}

run_one() {
  local proj_path="$1"
  local proj_name
  proj_name="$(basename "$proj_path")"
  local out_dir="$WIKI_OUT/$proj_name"

  echo "📊 Analyzing: $proj_name"
  echo "   src: $proj_path"

  # 1. Init + index (idempotent: nếu đã có .codegraph thì init no-op, index sync)
  (
    cd "$proj_path"
    [ -d ".codegraph" ] || codegraph init . >/dev/null 2>&1
    codegraph index -q 2>&1 | tail -3
  ) || {
    echo "⚠️  codegraph index thất bại cho $proj_name"
    return 1
  }

  # 2. Detect src root + list areas
  local src_root
  src_root="$(detect_src_root "$proj_path")"
  echo "   src_root: $src_root"

  # Reset output folder để tránh stale
  rm -rf "$out_dir"
  mkdir -p "$out_dir"

  # 3. Build skill per area
  local count=0
  while IFS= read -r area; do
    [ -z "$area" ] && continue
    echo "   → area: $area"
    build_area_skill "$proj_path" "$proj_name" "$src_root" "$area"
    count=$((count + 1))
  done < <(list_areas "$proj_path" "$src_root")

  # 4. Build project README
  build_project_readme "$proj_path" "$proj_name" "$src_root"

  echo "   ✅ $count area(s) → $WIKI_OUT/$proj_name/"
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
