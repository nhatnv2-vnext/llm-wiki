---
title: Screen Specs Index
type: dashboard
source:
  - 02_Wiki/00_Dashboard/Screens.json
status: draft
last_synced: 2026-05-19
tags: [screen-spec, moc]
---

# 📱 Screen Specs

Thư mục chứa **functional spec cho từng màn hình** của app `laptop-shop` (Angular frontend).

## Cách tạo / cập nhật

1. Mở Claude Code tại CWD = vault root.
2. Đảm bảo entry tồn tại trong [Screens.json](../00_Dashboard/Screens.json) (id, name, url, component, figma_node_url, related_apis).
3. Gõ `/spec-screen <ID>` (vd `/spec-screen SCR_002`).
4. Skill `spec-screen` (`.claude/skills/spec-screen/SKILL.md`) sẽ:
   - Spawn sub-agent `figma-reader` (đọc Figma qua MCP)
   - Spawn sub-agent `code-reader` (đọc Angular component + service + NgRx)
   - Merge kết quả vào template `_Templates/screen_spec_template.md`
   - Ghi file `<ID>_<slug>.md` vào thư mục này
   - Update `status` + `last_synced` trong `Screens.json`

## Quy ước file

- Tên file: `<ID>_<Snake_Case_Name>.md` (vd `SCR_002_Products_Search.md`)
- Frontmatter `type: screen-spec`, tag bắt buộc `screen-spec` + `<id>` (lowercase)

## Liên kết
- [[Index]]
- [[Frontend_Overview]]
