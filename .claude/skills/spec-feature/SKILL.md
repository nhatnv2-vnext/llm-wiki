---
name: spec-feature
description: Sinh functional/API spec cho 1 module/tính năng Backend. Trigger khi user gõ /spec-feature <ID> (vd: /spec-feature FEA_001). Yêu cầu entry phải tồn tại trong 01_Raw/features/Features.json.
---

# Skill: spec-feature

Bạn được gọi để **sinh tài liệu đặc tả Backend (API/Logic)** cho 1 feature/module của hệ thống. Tài liệu sẽ được ghi vào `02_Wiki/04_API_Specs/<ID>_<slug>.md`.

## Đầu vào
User gõ `/spec-feature <ID>` (vd `/spec-feature FEA_001`).

## Quy trình 5 bước (BẮT BUỘC)

### Bước 1 — Lookup feature + resolve project path
1. Đọc `01_Raw/features/Features.json`. Tìm entry có `id == <ID>`. Nếu không có → DỪNG và báo lỗi.
2. Đọc `01_Raw/codebase/projects.json` → tìm `local_path` tương ứng với `project` của tính năng.

### Bước 2 — Phân tích Code Backend (Sử dụng Tool/Sub-agent)
Chuyển đến `local_path` và thực hiện các nhiệm vụ đọc code sau:
1. Mở file được trỏ tới bởi `controller_or_entry`.
2. Khám phá luồng logic:
   - Các API Endpoint được định nghĩa ở đây là gì? Input DTO, Output Type là gì?
   - Các Service/Usecase nào được inject/gọi từ controller này?
3. Theo dõi vào các Service/Usecase đó:
   - Liệt kê các quy tắc nghiệp vụ (Business Rules).
   - Liệt kê các Repository/DAO được sử dụng để tương tác với DB.
4. Trích xuất danh sách các Schema/Table liên quan đến tính năng này.

### Bước 3 — Chuẩn bị Nội dung (Theo Template)
Đảm bảo bạn format nội dung tìm được thành cấu trúc Markdown rõ ràng. Gợi ý cấu trúc:
- **Tên Feature**: Kèm theo `ID`.
- **Tổng quan**: Chức năng này làm gì.
- **Danh sách APIs**: Kèm URL, Method, Payload mẫu.
- **Business Logic (Quy tắc Nghiệp vụ)**: Các luồng điều kiện, validation.
- **Database Tương tác**: Các bảng/schema được dùng.

### Bước 4 — Ghi file (Có Archiving)
- Slugify tên feature (vd: `FEA_001_Quan_Ly_Nguoi_Dung.md`).
- Path: `02_Wiki/04_API_Specs/<ID>_<Slug>.md`.
- **BẮT BUỘC:** Nếu file đã tồn tại, phải thực hiện archive trước khi ghi đè (move sang `02_Wiki/_Archive/04_API_Specs/`).
- Ghi nội dung mới vào path.

### Bước 5 — Update `Features.json`
Sửa entry tương ứng trong `01_Raw/features/Features.json`: `status` = `"draft"` (hoặc `reviewed` nếu user xác nhận), `last_synced` = ngày hôm nay.

### Cuối cùng — Trả output
```markdown
✅ Đã sinh spec backend cho **<NAME>** (`<ID>`).

📄 [[04_API_Specs/<ID>_<Slug>|<NAME>]]

**Highlight:**
- <1-2 API chính hoặc luồng logic phức tạp tìm thấy>

**Cần human review:**
- <Các logic ẩn hoặc code quá phức tạp chưa phân tích rõ>
```
