---
name: spec-feature
description: Sinh functional/API spec đầy đủ (Contract + Source of Truth + Business Rules + Edge Cases) cho 1 module/tính năng Backend. Trigger khi user gõ /llm-wiki:spec-feature <ID> (vd /llm-wiki:spec-feature FEA_001), nói "tạo spec API cho tính năng X", "đặc tả backend module". Yêu cầu entry phải tồn tại trong 01_Raw/features/Features.json của vault hiện tại.
---

# Skill: spec-feature

Bạn được gọi để **sinh tài liệu đặc tả Backend (API/Logic)** cho 1 feature/module. Tài liệu ghi vào `02_Wiki/04_API_Specs/<ID>_<slug>.md` **trong vault của dự án hiện tại (cwd)**.

Tài liệu phải đủ 4 section bắt buộc: **Contract / Source of Truth / Business Rules / Edge Cases**. Đây không phải tóm tắt code — đây là hợp đồng API dùng để test và review.

> ⚠️ Mọi đường dẫn `01_Raw/`, `02_Wiki/` là TƯƠNG ĐỐI theo cwd (vault của user).
> Nếu chưa có vault → hướng dẫn chạy `/llm-wiki:init` trước.

## Đầu vào
User gõ `/llm-wiki:spec-feature <ID>` (vd `/llm-wiki:spec-feature FEA_001`).

## Quy trình

### Bước 1 — Lookup feature + resolve project path
1. Đọc `01_Raw/features/Features.json`. Tìm entry `id == <ID>`. Không có → DỪNG:
   > ❌ Không tìm thấy `<ID>` trong Features.json. ID hợp lệ: <liệt kê>.
2. Đọc `01_Raw/codebase/projects.json` → entry `name == <feature.project>` và `active == true` → lấy `local_path`. Không có → DỪNG.

### Bước 2 — Đọc code (CodeGraph MCP ưu tiên, fallback Read/Grep)
Nếu MCP CodeGraph sẵn sàng, dùng `mcp__codegraph__*` để lần theo controller → service → repository. Nếu không, dùng Read/Grep/Glob (read-only) tại `<local_path>`.

Với feature, trích xuất (mọi claim kèm `file:line`):
- **Endpoints**: method | path | auth | controller:line
- **DTOs**: field | type | validation | required | file:line
- **Business Rules**: rule + file:line
- **DB Interactions**: bảng | thao tác | điều kiện
- **Error Cases**: exception | điều kiện | HTTP code

> Với codebase lớn, có thể spawn sub-agent code-reader (general-purpose, read-only) để tiết kiệm context — không bắt buộc cho POC.

### Bước 3 — Đọc template
Đọc `02_Wiki/_Templates/feature_spec_template.md` (do `/llm-wiki:init` copy vào).

### Bước 4 — Tổng hợp 4 section
Điền template theo dữ liệu code thực tế:
1. **Contract** — endpoint table + request/response schema từ DTO.
2. **Source of Truth** — bảng `file:line` cho controller/service/repository/DTO.
3. **Business Rules** — rule từ code, mỗi rule kèm `file:line`.
4. **Edge Cases** — error cases + coverage gap (nếu có test).

Không suy luận được → ghi `> ⚠️ Cần human review`, KHÔNG bịa.

### Bước 5 — Ghi file (có Archiving)
- Slugify `name` (bỏ dấu tiếng Việt → Snake_Case_Capital).
- Path: `02_Wiki/04_API_Specs/<ID>_<Slug>.md`.
- Nếu file đã tồn tại: archive trước —
  `mkdir -p 02_Wiki/_Archive/04_API_Specs` rồi
  `mv` file cũ sang `_Archive/04_API_Specs/<ID>_<Slug>_v<YYYYMMDD_HHMMSS>.md`.
- Ghi nội dung mới.

### Bước 6 — Update Features.json
Sửa entry: `status="draft"`, `last_synced=<hôm nay>`, và `api_endpoints` = danh sách thực tế từ code.

### Cuối cùng — Output
```markdown
✅ Đã sinh spec backend cho **<NAME>** (`<ID>`).

📄 [[04_API_Specs/<ID>_<Slug>|<NAME>]]

**Highlight:** <số endpoint>, <số rule> business rules.
**Cần human review:** <logic phức tạp / coverage gap>.
```

## Ràng buộc
- KHÔNG sửa `01_Raw/` (trừ `status`/`last_synced`/`api_endpoints` trong Features.json).
- KHÔNG bịa endpoint/rule/field. Chưa xác minh → `⚠️`.
- Đủ 4 section bắt buộc.
