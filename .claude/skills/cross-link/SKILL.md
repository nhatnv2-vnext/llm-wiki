---
name: cross-link
description: Tự động rà soát toàn bộ các file Markdown trong Wiki và tạo/cập nhật các Wikilinks giữa chúng (liên kết chéo). Trigger khi user gõ /cross-link. Hỗ trợ chế độ dry-run (xem trước thay đổi mà không ghi file). KHÔNG thay thế text bên trong code block, frontmatter YAML, hay wikilink đã có.
---

# Skill: cross-link

Bạn được gọi để thực hiện nhiệm vụ **Liên kết Tri thức (Knowledge Graphing)**. Mục tiêu là biến Wiki từ các trang rời rạc thành một mạng lưới liên kết (wikilinks `[[Link]]`).

> **Nguyên tắc an toàn:** Cross-link CHỈ thêm liên kết vào text thường. KHÔNG bao giờ thay thế text bên trong: code block (```), inline code (`), frontmatter YAML (---), heading (`#`), hoặc text đã là wikilink (`[[...]]`). Vi phạm nguyên tắc này có thể làm hỏng cấu trúc wiki.

## Đầu vào

User gõ `/cross-link` hoặc `/cross-link --dry-run`.

- **Không có flag** → thực sự ghi file.
- **`--dry-run`** → CHỈ hiển thị danh sách thay thế dự kiến, hỏi xác nhận trước khi ghi.

## Quy trình 4 bước

### Bước 1 — Lấy danh sách thực thể (Entities)

1. Quét các thư mục `02_Wiki/02_Design/`, `02_Wiki/04_API_Specs/`, `02_Wiki/05_Database/`, `02_Wiki/01_Business/`, `02_Wiki/03_Architecture/`, `02_Wiki/08_ADR/` để lên danh sách file Markdown hiện có (bỏ qua `_Archive/`, `_Templates/`, `README.md`, `Index.md`).
2. Từ mỗi file, trích xuất **từ khóa** để dùng làm match:
   - Từ tên file: `SCR_002_San_Pham.md` → keywords: `SCR_002`, `Sản phẩm` (đọc frontmatter `title`)
   - Từ frontmatter `title`: trích phần slug có nghĩa (không lấy tiền tố "Đặc tả", "Schema:")
   - Ưu tiên keyword **dài và đặc trưng** (≥4 ký tự) để tránh false positive
3. Xây dựng bảng keyword → đường dẫn file đích.

### Bước 2 — Quét và tạo Links (với guard nghiêm ngặt)

Lặp qua từng file `.md` trong `02_Wiki/` (bỏ qua `_Archive/`, `_Templates/`, `README.md`, `Index.md`).

Với mỗi file:

#### A. Parse cấu trúc file — xác định vùng AN TOÀN

Chia file thành các vùng:
- **FRONTMATTER** (`---` đến `---`): **VÙNG CẤM** — không thay thế bất cứ thứ gì
- **CODE BLOCK** (``` ... ```): **VÙNG CẤM** — không thay thế bất cứ thứ gì
- **INLINE CODE** (`` ` ... ` ``): **VÙNG CẤM** — không thay thế bất cứ thứ gì
- **HEADING** (dòng bắt đầu bằng `#`): **VÙNG CẤM** — không thay thế
- **WIKILINK ĐÃ CÓ** (`[[...]]`): **VÙNG CẤM** — không wrap lồng thêm
- **TEXT THƯỜNG** (còn lại): **VÙNG AN TOÀN** — cho phép thay thế

#### B. Áp dụng thay thế (chỉ trong VÙNG AN TOÀN)

Với mỗi keyword trong bảng từ Bước 1:
1. Tìm keyword trong text thường của file đang xét (case-sensitive nếu có dấu, case-insensitive nếu không dấu).
2. **KHÔNG** thay thế nếu:
   - File đang xét CHÍNH LÀ file đích (tránh self-link)
   - Text đã nằm trong `[[...]]` (tránh nested wikilink)
   - Đây là lần xuất hiện thứ 2 trở đi trong cùng một file (1 keyword → tối đa 1 link/file)
3. Nếu hợp lệ → thay `<keyword>` bằng `[[<path>|<keyword>]]`.

#### C. Kiểm tra xem file đích có tồn tại

Trước khi thêm link, verify đường dẫn file đích thực sự tồn tại. Nếu không tồn tại → bỏ qua thay thế này (ghi log "⚠️ Skip: file đích không tồn tại").

### Bước 3 — Dry-run hoặc Ghi file

**Nếu `--dry-run`:**
1. Hiển thị danh sách thay thế dự kiến theo format:
   ```
   📄 <tên file>
     "text gốc" → "[[path|text gốc]]" (dòng <N>)
   ```
2. Hỏi: "Xác nhận ghi <M> thay đổi vào <N> files? (yes/no)"
3. Chỉ tiếp tục nếu user xác nhận "yes".

**Nếu không có flag (ghi trực tiếp):**
1. Ghi lại các file đã thay đổi.
2. Ghi log số file và số link được tạo.

### Bước 4 — Chạy audit-links để kiểm tra

Sau khi ghi file xong, thông báo user:
> 💡 Đề xuất: Chạy `cd apps/System && npm run audit-links` để phát hiện broken link mới (nếu có) sau quá trình cross-link.

### Cuối cùng — Trả output

```markdown
✅ Quá trình **Cross-link** hoàn tất.

**Kết quả:**
- Đã quét `<N>` files.
- Tạo mới/Cập nhật `<M>` wikilinks trong `<K>` files.
- Skip: `<S>` thay thế bị bỏ qua (file đích không tồn tại hoặc vùng cấm).

Wiki của bạn giờ đã trở thành một Graph liên kết thực sự! Mở graph view trên web app (`/graph`) để chiêm ngưỡng kết quả.

💡 Chạy `npm run audit-links` để verify không có broken link.
```

## Ràng buộc

- **KHÔNG** thay thế trong: code block, inline code, frontmatter, heading, wikilink đã có. Vi phạm sẽ phá vỡ rendering của wiki.
- **KHÔNG** tạo self-link (file trỏ về chính nó).
- **KHÔNG** tạo link tới file không tồn tại.
- Mỗi keyword chỉ được link **1 lần** mỗi file (đầu tiên xuất hiện).
- Luôn đề xuất chạy `audit-links` sau khi hoàn thành.
- Với file lớn (>200 dòng), xử lý cẩn thận hơn — đọc từng section để không mất ngữ cảnh vùng cấm.

