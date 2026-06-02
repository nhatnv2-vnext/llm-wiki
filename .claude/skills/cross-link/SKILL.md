---
name: cross-link
description: Tự động rà soát toàn bộ các file Markdown trong Wiki và tạo/cập nhật các Wikilinks giữa chúng (liên kết chéo). Trigger khi user gõ /cross-link.
---

# Skill: cross-link

Bạn được gọi để thực hiện nhiệm vụ **Liên kết Tri thức (Knowledge Graphing)**. Mục tiêu là biến Wiki từ các trang rời rạc thành một mạng lưới liên kết (Obsidian-style wikilinks `[[Link]]`).

## Đầu vào
User gõ `/cross-link`.

## Quy trình 3 bước

### Bước 1 — Lấy danh sách thực thể (Entities)
1. Đọc lại `Index.md` (hoặc quét trực tiếp các thư mục `02_Wiki/02_Design/`, `02_Wiki/04_API_Specs/`, `02_Wiki/05_Database/`) để lên danh sách các file Markdown hiện có.
2. Từ danh sách này, trích xuất "Từ khóa" (Keywords). Ví dụ: file là `SCR_002_San_Pham.md` thì từ khóa là "Sản phẩm", "SCR_002". File là `db_users.md` thì từ khóa là "bảng users", "users schema".

### Bước 2 — Quét và Nhúng Links (Embedding Links)
1. Lặp qua từng file `.md` trong thư mục `02_Wiki/` (bỏ qua `_Archive/` và `Index.md`).
2. Với mỗi file, đọc nội dung hiện tại.
3. Tìm kiếm các đoạn text khớp với "Từ khóa" của các thực thể khác (ưu tiên các từ khóa dài hoặc có tính đặc trưng).
4. Thay thế text đó bằng Wikilink. Ví dụ: đổi chữ `gọi API cập nhật giỏ hàng` thành `gọi API [[04_API_Specs/FEA_012_Cap_Nhat_Gio_Hang|cập nhật giỏ hàng]]`. Hoặc nếu nhắc tới `bảng orders`, đổi thành `[[05_Database/orders|bảng orders]]`.
5. Đảm bảo không tạo link đệ quy (link trỏ lại chính file đó) và không làm hỏng cấu trúc Markdown (bảng, code blocks).

### Bước 3 — Cập nhật file
1. Lưu lại các thay đổi vào file tương ứng.
2. Tổng hợp số lượng link được tạo ra.

### Cuối cùng — Trả output
```markdown
✅ Quá trình **Cross-link** hoàn tất.

**Kết quả:**
- Đã quét `<N>` files.
- Tạo mới/Cập nhật `<M>` wikilinks.

Wiki của bạn giờ đã trở thành một Graph liên kết thực sự! Bạn có thể mở Graph View trong Obsidian để chiêm ngưỡng kết quả.
```
