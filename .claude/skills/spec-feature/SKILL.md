---
name: spec-feature
description: Sinh functional/API spec đầy đủ (Contract + Source of Truth + Business Rules + Edge Cases) cho 1 module/tính năng Backend. Trigger khi user gõ /spec-feature <ID> (vd: /spec-feature FEA_001), nói "tạo spec API cho tính năng X", "viết tài liệu API endpoint", "đặc tả backend module", "mô tả luồng xử lý service Y". Yêu cầu entry phải tồn tại trong 01_Raw/features/Features.json.
---

# Skill: spec-feature

Bạn được gọi để **sinh tài liệu đặc tả Backend (API/Logic)** cho 1 feature/module của hệ thống. Tài liệu sẽ được ghi vào `02_Wiki/04_API_Specs/<ID>_<slug>.md`.

Tài liệu phải bao gồm đủ 4 section bắt buộc theo chuẩn CLAUDE.md §3.4: **Contract / Source of Truth / Business Rules / Edge Cases**. Đây không phải là tóm tắt code — đây là hợp đồng API có thể dùng để test và review.

## Đầu vào

User gõ `/spec-feature <ID>` (vd `/spec-feature FEA_001`).

## Quy trình 7 bước (BẮT BUỘC theo đúng thứ tự)

### Bước 1 — Lookup feature + resolve project path

1. Đọc `01_Raw/features/Features.json`. Tìm entry có `id == <ID>`. Nếu không có → DỪNG và báo lỗi:
   > ❌ Không tìm thấy `<ID>` trong Features.json. Các ID hợp lệ: <liệt kê>.
2. Đọc `01_Raw/codebase/projects.json` → tìm entry có `name == <feature.project>` và `active == true`. Lấy `local_path`.
   Nếu không tìm thấy project → DỪNG:
   > ❌ Project `<feature.project>` không tồn tại hoặc inactive trong projects.json.
3. Đọc `MEMORY.md` nếu có context liên quan (ưu tiên CodeGraph vs grep).

### Bước 2 — Spawn 2 sub-agent SONG SONG (single message, 2 tool calls)

Dùng `Agent` tool với `subagent_type: general-purpose`. Trong **cùng 1 message** gọi 2 lần Agent để chạy parallel.

#### Sub-agent A — code-reader (BẮT BUỘC spawn)

Prompt (thay thế các placeholder bằng giá trị thực):

```
Bạn là sub-agent đọc code backend cho feature "<NAME>" (<ID>).

Input:
- controller_or_entry: "<CONTROLLER_OR_ENTRY>"
- project local path: <LOCAL_PATH>

Tools cho phép: mcp__codegraph__* (ưu tiên), Read, Grep, Glob (read-only).
Ưu tiên CodeGraph MCP để lần theo callers/callees thay vì đọc mò toàn bộ repo.
Nếu CodeGraph MCP chưa sẵn sàng → fallback Read + Grep + Glob.

Task:
1. Mở file controller/entry tại <LOCAL_PATH>/<CONTROLLER_OR_ENTRY>.
2. Liệt kê tất cả HTTP endpoints (method + path + decorator).
3. Với mỗi endpoint, tìm:
   - Request DTO (class với @Body(), @Query(), @Param()) + tất cả field + validation
   - Response type + HTTP status code
   - Guard/Auth (@UseGuards, @Roles, @Public)
4. Theo dõi vào Service được inject:
   - Liệt kê business rules thực tế (validation, điều kiện, công thức)
   - Liệt kê repository/DB calls (bảng nào, thao tác gì)
   - Liệt kê external service calls (queue, email, third-party)
5. Tìm error handling: các exception được throw (loại exception, điều kiện).

Output (markdown, ≤ 500 từ, mọi claim kèm file:line):
- **Endpoints**: bảng method | path | auth | controller:line
- **DTOs**: bảng field | type | validation rule | required | file:line
- **Business Rules**: danh sách rule với file:line
- **DB Interactions**: bảng bảng | thao tác | điều kiện
- **Error Cases**: bảng exception | điều kiện | HTTP code

QUY TẮC:
- KHÔNG đoán nội dung file chưa đọc. Nếu không tìm thấy → "⚠️ Không tìm thấy <path>"
- Mọi claim phải có file:line
- Trả về DUY NHẤT markdown content
```

#### Sub-agent B — test-reader (Chỉ spawn nếu có file test)

Kiểm tra nhanh xem `<LOCAL_PATH>` có file `.spec.ts` liên quan không (grep `<controller_name>.spec` hoặc `<feature>.e2e`). Chỉ spawn nếu tìm thấy:

```
Bạn là sub-agent đọc test cho feature "<NAME>" (<ID>).

Input:
- Test file pattern: <LOCAL_PATH>/test/**/<feature>*.spec.ts (hoặc .e2e.ts)
- project local path: <LOCAL_PATH>

Tools cho phép: Read, Grep, Glob (read-only).

Task:
1. Tìm và đọc các file test liên quan tới feature này.
2. Liệt kê:
   - Các happy path đang được test (describe/it block)
   - Các edge case đang được test
   - Các mock/stub được dùng (mock service, mock DB)
3. Xác định coverage gap: edge case nào KHÔNG có test?

Output (markdown, ≤ 200 từ):
- **Test cases**: danh sách scenario đang test
- **Mocked dependencies**: list dependency được mock
- **Coverage gaps**: các scenario chưa có test

QUY TẮC: Mọi claim phải có file:line. Nếu không tìm thấy file test → "⚠️ Chưa tìm thấy test file cho feature này."
```

### Bước 3 — Chờ sub-agent xong

Main agent KHÔNG đọc controller hay test trực tiếp ở bước này. Chờ output từ cả 2 sub-agent.

### Bước 4 — Đọc template

Đọc `02_Wiki/_Templates/feature_spec_template.md`.

### Bước 5 — Tổng hợp nội dung (4 section bắt buộc)

Dựa trên output sub-agent, điền vào template theo 4 section CLAUDE.md §3.4:

1. **Contract**: Endpoint table, request/response schema thực tế từ DTO.
2. **Source of Truth**: Bảng file:line cho controller, service, repository, DTO.
3. **Business Rules**: Bảng rule từ code, mỗi rule kèm file:line xác minh.
4. **Edge Cases**: Từ sub-agent B (test reader) + error cases từ sub-agent A.

Ngoài ra điền:
- **Section 5 (DB Interactions)**: Bảng bảng/model → thao tác → điều kiện. Thêm wikilink `[[05_Database/<name>_Schema]]`.
- **Section TL;DR**: 1-3 dòng tóm tắt feature.

Khi không suy luận được → ghi `> ⚠️ Cần human review` thay vì bịa.

### Bước 6 — Ghi file (Có Archiving)

- Slugify `name` (bỏ dấu tiếng Việt, Snake_Case_Capital).
- Path: `02_Wiki/04_API_Specs/<ID>_<Slug>.md`
- **BẮT BUỘC:** Nếu file đã tồn tại, archive trước khi ghi đè:
  1. Lấy timestamp hiện tại (vd: `20260609_204619`).
  2. `mkdir -p 02_Wiki/_Archive/04_API_Specs`
  3. `mv 02_Wiki/04_API_Specs/<ID>_<Slug>.md 02_Wiki/_Archive/04_API_Specs/<ID>_<Slug>_v<timestamp>.md`
- Ghi nội dung mới vào path.

### Bước 7 — Update `Features.json`

Sửa entry tương ứng trong `01_Raw/features/Features.json`:
- `status` = `"draft"` (hoặc `"reviewed"` nếu user xác nhận)
- `last_synced` = ngày hôm nay `YYYY-MM-DD`
- Nếu trích xuất được danh sách endpoint → update field `api_endpoints` với danh sách thực tế từ code.

### Cuối cùng — Trả output cho user

```markdown
✅ Đã sinh spec backend cho **<NAME>** (`<ID>`).

📄 [[04_API_Specs/<ID>_<Slug>|<NAME>]]

**Highlight:**
- <số_endpoint> endpoints: <liệt kê method + path ngắn gọn>
- <số_rule> business rules đã xác minh từ code

**Cần human review:**
- <Các logic ẩn hoặc code quá phức tạp chưa phân tích rõ>
- <Coverage gap từ test reader nếu có>
```

## Ràng buộc

- KHÔNG sửa file trong `01_Raw/` (ngoại trừ update `status`/`last_synced`/`api_endpoints` trong Features.json ở bước 7).
- KHÔNG bịa endpoint, rule, hay field DTO. Mọi thứ phải từ code thực tế. Chưa xác minh → `⚠️`.
- Sub-agent code-reader phải chạy SONG SONG với test-reader (nếu có), không tuần tự.
- Tài liệu phải đủ 4 section bắt buộc: Contract / Source of Truth / Business Rules / Edge Cases.
- Ưu tiên CodeGraph MCP cho code-reader; chỉ fallback sang Read/Grep khi MCP chưa sẵn sàng.

## Ví dụ

> User: `/spec-feature FEA_001`
>
> 1. `Features.json` → FEA_001: name="Quản lý Người dùng", project="nestjs-backend", controller_or_entry="src/users/users.controller.ts".
> 2. `projects.json` → "nestjs-backend" → local_path="/Users/you/code/laptop-shop".
> 3. Spawn code-reader + test-reader song song.
> 4. code-reader tìm: 5 endpoints (GET /users, POST /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id), DTO validation, bcrypt hash password...
> 5. test-reader tìm: 3 spec files, coverage gap = "DELETE /users/:id chưa có test".
> 6. Đọc template → điền 4 section → ghi `02_Wiki/04_API_Specs/FEA_001_Quan_Ly_Nguoi_Dung.md`.
> 7. Update Features.json: api_endpoints=['GET /users', 'POST /users'...], last_synced="2026-06-09".
> 8. Trả wikilink + highlight.
