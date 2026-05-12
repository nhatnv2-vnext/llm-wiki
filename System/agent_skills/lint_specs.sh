#!/usr/bin/env bash
# lint_specs.sh — Kiểm tra mọi file .md trong 02_Wiki/ có frontmatter chuẩn không.
# Theo quy tắc trong System/CLAUDE.md mục 3.2.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WIKI_DIR="$VAULT_ROOT/02_Wiki"

REQUIRED_KEYS=("title" "type" "source" "status" "last_synced")
EXIT_CODE=0

echo "🔍 Linting wiki files in: $WIKI_DIR"

while IFS= read -r -d '' file; do
  # Bỏ qua output auto-generated và template Obsidian.
  case "$file" in
    *"/05_Code_Graph/"*) continue ;;
    *"/_Templates/"*) continue ;;
  esac

  # Lấy 20 dòng đầu để check frontmatter
  header="$(head -n 20 "$file")"

  if ! echo "$header" | grep -q "^---$"; then
    echo "❌ Missing frontmatter: $file"
    EXIT_CODE=1
    continue
  fi

  for key in "${REQUIRED_KEYS[@]}"; do
    if ! echo "$header" | grep -q "^${key}:"; then
      echo "⚠️  Missing key '${key}' in: $file"
      EXIT_CODE=1
    fi
  done
done < <(find "$WIKI_DIR" -type f -name "*.md" -print0)

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All wiki files pass lint."
fi

exit $EXIT_CODE
