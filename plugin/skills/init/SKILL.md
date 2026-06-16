---
name: init
description: Khởi tạo khung knowledge vault 3 lớp (01_Raw + 02_Wiki + templates) trong dự án hiện tại. Trigger khi user gõ /llm-wiki:init, nói "khởi tạo vault", "scaffold wiki", "dựng khung tài liệu".
---

# Skill: init — Scaffold Knowledge Vault

Bạn đóng vai **Vault Initializer**. Nhiệm vụ: dựng khung thư mục vault 3 lớp vào **thư mục dự án hiện tại của user** (cwd), để các skill `add-project` / `spec-*` về sau có chỗ ghi.

> ⚠️ Vault được tạo trong DỰ ÁN CỦA USER (cwd), KHÔNG phải trong thư mục plugin.
> Engine script + template gốc nằm trong plugin tại `${CLAUDE_PLUGIN_ROOT}`.

## Đầu vào
User gõ `/llm-wiki:init` (không cần tham số). Vault được dựng tại cwd.

## Quy trình

### Bước 1 — Kiểm tra đã có vault chưa
1. Chạy lệnh sau để scaffold (idempotent — không ghi đè file đã tồn tại):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/engine/init_vault.js"
   ```
2. Script tự tạo cấu trúc 3 lớp + copy template từ plugin, in ra danh sách file đã tạo / đã bỏ qua.

### Bước 2 — Báo cáo
Tóm tắt cho user cấu trúc vừa tạo và bước tiếp theo:

```markdown
✅ Đã khởi tạo Knowledge Vault tại thư mục hiện tại.

**Cấu trúc:**
- `01_Raw/` — nguồn thô (READ-ONLY): catalog project/screen/feature/schema + drive_docs
- `02_Wiki/` — tri thức biên dịch (AI ghi vào đây)
- `_Templates/` — mẫu spec

**Bước tiếp theo:**
`/llm-wiki:add-project <đường_dẫn_source_code>` để đăng ký dự án đầu tiên.
```

## Nguyên tắc
- Không ghi đè nếu vault đã tồn tại (báo "đã có, bỏ qua").
- Mọi đường dẫn ghi ra đều TƯƠNG ĐỐI theo cwd của user.
