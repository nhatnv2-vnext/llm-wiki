# llm-wiki — Claude Code Plugin (POC)

Đóng gói **engine sinh & bảo trì knowledge vault 3 lớp** thành Claude Code plugin, để **bất kỳ dự án nào cài vào dùng ngay** — không cần clone repo, không cần server.

> POC này gồm 3 skill cốt lõi thể hiện trọn vòng đời: `init` → `add-project` → `spec-feature`.
> Bản đầy đủ (14 skill: scan-project, plan-wiki, spec-screen/database/architecture/business, cross-link, ask-vault, …) sẽ port sau khi mô hình được xác nhận.

## Cài đặt

```bash
# Thêm marketplace từ git repo
claude plugin marketplace add nhatnv2-vnext/llm-wiki

# Cài plugin
claude plugin install llm-wiki
```

Hoặc test local (dev) không cần cài:
```bash
claude --plugin-dir /đường_dẫn/tới/plugin
```

## Dùng trong một dự án bất kỳ

```bash
cd /dự-án-của-bạn

/llm-wiki:init                       # dựng khung 01_Raw + 02_Wiki + templates
/llm-wiki:add-project .              # đăng ký dự án hiện tại (phân tích tech stack)
/llm-wiki:spec-feature FEA_001       # sinh API spec từ code (sau khi có Features.json)
```

## Cấu trúc plugin

```
plugin/
├── .claude-plugin/
│   ├── plugin.json         # manifest
│   └── marketplace.json    # để claude plugin marketplace add
├── skills/                 # các skill, namespace /llm-wiki:<name>
│   ├── init/SKILL.md
│   ├── add-project/SKILL.md
│   └── spec-feature/SKILL.md
├── engine/                 # script Node chạy bởi skill
│   └── init_vault.js       # gọi qua ${CLAUDE_PLUGIN_ROOT}/engine/init_vault.js
├── templates/              # mẫu spec, init copy vào 02_Wiki/_Templates/
│   └── feature_spec_template.md
├── .mcp.json               # bundle MCP: codegraph + figma
└── README.md
```

## Nguyên tắc thiết kế (để portable)

- **Vault = cwd của user**, không phải thư mục plugin. Mọi skill ghi `01_Raw/`, `02_Wiki/` tương đối theo cwd.
- **Engine script đi theo plugin**, skill gọi qua `${CLAUDE_PLUGIN_ROOT}` (Claude Code tự set) — không phụ thuộc cwd.
- **MCP bundled**: codegraph (code traversal) + figma (đọc design). `figma` cần env `FIGMA_API_KEY` của user.
- Tôn trọng ranh giới lớp: `01_Raw/` READ-ONLY (trừ metadata), wiki sinh ở `02_Wiki/`.
