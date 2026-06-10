---
name: update-wiki
description: Cập nhật nội dung Wiki cũ dựa trên mã nguồn và tài liệu mới (Living Documentation). Kế thừa và giữ nguyên các ghi chú thủ công. Trigger khi user gõ /update-wiki <ID>.
---

# Skill: update-wiki

Bạn được gọi để đóng vai trò như một **Living Documentation Updater**. Nhiệm vụ của bạn là nhận vào một `<ID>` (ví dụ `FEA_001`), đọc tài liệu Wiki cũ và so sánh với Code/Docs mới nhất để cập nhật bổ sung một cách thông minh, không ghi đè mất thông tin cũ.

## Đầu vào
User gõ `/update-wiki <ID>`.

## Quy trình 4 bước

### Bước 1 — Lấy thông tin từ State
1. Đọc file `.claude/state/WikiState.json`.
2. Tìm entry có key `ID` bằng `<ID>` mà user truyền vào. Nếu không thấy, báo lỗi.
3. Lấy ra danh sách `source_files` và `doc_files` tương ứng.
4. Xác định đường dẫn file Wiki hiện tại của ID này (nằm trong `02_Wiki/04_API_Specs/` hoặc `02_Wiki/02_Design/`).

### Bước 2 — Đọc Dữ liệu (Cũ & Mới)
1. Đọc nội dung file Wiki cũ.
2. Đọc nội dung mã nguồn mới nhất từ các đường dẫn `source_files`.
3. Đọc nội dung tài liệu mới nhất từ các đường dẫn `doc_files`.

### Bước 3 — Đối chiếu và Trộn nội dung (Merge)
Hãy sử dụng logic sau để viết lại nội dung:
1. **Tìm sự khác biệt:** So sánh cấu trúc hàm, API endpoints, hoặc UI components trong file code/doc mới so với những gì đã viết trong file Wiki cũ.
2. **Cập nhật (Update):** Chỉ thay đổi/cập nhật những chỗ bị sai lệch (ví dụ: API thêm parameter mới, React component đổi tên props).
3. **Bảo tồn (Preserve):** GIỮ NGUYÊN các văn bản, ghi chú, định dạng, bảng biểu mà user đã cố tình viết thủ công vào file Wiki cũ. TUYỆT ĐỐI không được xoá mất giải thích nghiệp vụ cũ (trừ khi nó mâu thuẫn trực tiếp với code mới).

### Bước 4 — Ghi file và Cập nhật State
1. Ghi đè nội dung mới đã trộn vào file Wiki cũ. Khuyến nghị tạo file backup `_Archive/` trước khi ghi đè nếu cần thiết.
2. Cập nhật lại thời gian `mtime` của các file (từ `source_files` và `doc_files`) vào `WikiState.json`.
3. Đổi `status` của ID này từ `needs_update` sang `generated`.
4. Cập nhật lại file `02_Wiki/00_Overview/Index.md`: Đổi prefix của mục này từ `[~]` thành `[x]`.

### Cuối cùng — Trả output
```markdown
✅ **Đã cập nhật thành công Wiki cho `<ID>`!**

- Đã hợp nhất các thay đổi mới nhất từ Code/Docs vào tài liệu cũ.
- Trạng thái trong `Index.md` đã được đổi sang `[x]`.
- Bạn có thể xem thay đổi tại file: `[[Đường dẫn Wiki]]`
```
