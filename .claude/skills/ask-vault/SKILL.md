---
name: ask-vault
description: Tra cứu wiki trong vault (02_Wiki/) + code-graph (02_Wiki/06_Code_Graph/) + source code (qua local_path trong 01_Raw/codebase/projects.json) để trả lời câu hỏi về dự án. Trigger khi user gõ /ask-vault, hỏi "vault có nói gì về...", "tra cứu wiki...", "module X làm gì", hoặc bất kỳ câu hỏi định tính về kiến trúc, API, schema, flow, module của dự án.
---

# Skill: ask-vault

Bạn được gọi để trả lời câu hỏi về **dự án** đã được index trong vault Obsidian.

## Quy tắc 5 bước

1. **Bắt đầu từ map.** Đọc `02_Wiki/00_Overview/Index.md` để lấy tổng quan.
   Nếu file `02_Wiki/00_Overview/Vault_Index.json` tồn tại, đọc nó trước — đó là index nhanh (title, headings, links).

2. **Định vị file liên quan.** Dựa vào câu hỏi:
   - Câu hỏi kiến trúc / flow → `02_Wiki/03_Architecture/`
   - API endpoint → `02_Wiki/04_API_Specs/`
   - Bảng / schema → `02_Wiki/05_Database/`
   - Module cụ thể (cấp code) → `02_Wiki/06_Code_Graph/<project>/<area>/SKILL.md`
   - Phát hiện code lệch spec → `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`

3. **Theo wikilink.** Mọi file wiki có section "Liên kết" hoặc link `[[...]]` ở giữa văn bản. Follow chúng để bù ngữ cảnh.

4. **Khi cần code thật:**
   - Đọc `01_Raw/codebase/projects.json` để lấy `local_path` của project liên quan.
   - Dùng `local_path` để truy cập source code (vd: `<local_path>/src/auth/auth.controller.ts`).
   - KHÔNG tìm code trong `01_Raw/codebase/<name>/` (cấu trúc cũ).
   - Đọc `01_Raw/database/schemas.json` để tìm path schema DB nếu câu hỏi liên quan đến database.

5. **Khi vault không có**, nói thẳng: "Wiki chưa có nội dung X. File gần nhất là [[Y]]." KHÔNG bịa đặt.

## Format câu trả lời

```
**Tóm tắt** (1-3 dòng)

**Chi tiết**
<nội dung, có wikilink + trích file:line>

**Nguồn**
- [[<wiki_file_1>]]
- `<local_path>/<path>:<line>` (nếu trích code)
```

## Ràng buộc

- KHÔNG sửa file trong `01_Raw/`. Nếu phát hiện code lệch spec → đề nghị user ghi vào `Conflict_Reports.md`, không tự ghi.
- KHÔNG suy luận về module nếu không tìm thấy trong vault. Trả lời "không có trong vault" thay vì đoán.
- Trích dẫn file:line khi có thể (vd: `auth.controller.ts:21`).
- Đọc memory trước khi đề xuất công cụ. Vault này đã chốt: dùng **ts-morph** cho custom AST script (Node/Angular fine-grained); dùng **CodeGraph** (`@colbymchenry/codegraph`, MIT) cho `npm run code-graph` overview — cài global, không clone source vào vault.
- Source code nằm bên ngoài vault, truy cập qua `local_path` trong `01_Raw/codebase/projects.json`.
- Database schema nằm bên ngoài vault, truy cập qua `local_path` trong `01_Raw/database/schemas.json`.

## Ví dụ

> User: "Auth flow như thế nào?"
>
> 1. Đọc `Vault_Index.json` → tìm entry có tag `auth` → `Auth_API.md` + `Frontend_Overview.md` (auth interceptor).
> 2. Đọc 2 file → tổng hợp: endpoint backend + interceptor flow frontend.
> 3. Đọc `projects.json` → project "nestjs-backend" → local_path="/Users/.../laptop-shop".
> 4. Trích `<local_path>/src/auth/auth.controller.ts:21` cho `POST /auth/login`.
> 5. Trả lời theo format trên.

> User: "Hệ thống có deploy lên k8s không?"
>
> Không có file nào trong vault đề cập k8s/Helm/Docker (chỉ có `docker-compose` trong code project, không phải spec deployment).
> Trả lời: "Wiki chưa có thông tin về deployment. File gần nhất là [[System_Overview]] nhưng cũng không nói về k8s."
