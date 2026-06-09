---
name: check-update
description: Kiểm tra sự thay đổi của mã nguồn và tài liệu trong 01_Raw/drive_docs. Cập nhật WikiState.json và cảnh báo user các màn hình/tính năng cần update. Trigger khi user gõ /check-update.
---

# Skill: check-update

Bạn được gọi để đóng vai trò như một **Living Documentation Tracker**. Nhiệm vụ của bạn là quét và tìm ra sự thay đổi giữa hệ thống file hiện tại (code và docs) so với lần cập nhật cuối cùng lưu trong `WikiState.json`.

## Đầu vào
User gõ `/check-update`.

## Quy trình 3 bước

### Bước 1 — Lấy thông tin trạng thái cũ
1. Đọc file `.claude/state/WikiState.json` để lấy ra danh sách các `source_files` và `doc_files` đã được lưu trữ kèm theo `mtime` (thời gian sửa đổi cuối) của chúng.
2. Nếu file không tồn tại, báo lỗi: `❌ Chưa có file trạng thái WikiState.json. Vui lòng chạy /plan-wiki trước.`

### Bước 2 — Quét hệ thống file hiện tại
1. Dùng lệnh phù hợp để lấy thời gian sửa đổi (mtime) mới nhất của các file trong `01_Raw/drive_docs` và các file mã nguồn liên kết trong `WikiState.json`.
2. So sánh `mtime` hiện tại với `mtime` lưu trong JSON.
3. Nhận diện danh sách các file **Bị thay đổi (Changed)** hoặc **Thêm mới (New)**.

### Bước 3 — Cập nhật State và Cảnh báo
1. Duyệt qua danh sách các ID (`FEA_XXX`, `SCR_XXX`) trong `WikiState.json`.
2. Nếu ID nào có tham chiếu đến file thuộc danh sách "Bị thay đổi", chuyển `status` của ID đó thành `needs_update`.
3. Ghi lại nội dung vào `.claude/state/WikiState.json`.
4. Cập nhật lại file `02_Wiki/00_Overview/Index.md`: Đổi các prefix `[x]` hoặc `[ ]` tương ứng thành `[~]` cho các ID bị ảnh hưởng.

### Cuối cùng — Trả output
```markdown
⚠️ **Hoàn tất kiểm tra cập nhật:**

**Các file thay đổi:**
- `src/user.controller.ts`
- `01_Raw/drive_docs/User_Requirements.md`

**Các trang Wiki cần cập nhật (Đã đánh dấu `[~]` trong Index):**
- `FEA_001` (bị ảnh hưởng bởi `user.controller.ts`)
- `SCR_005` (bị ảnh hưởng bởi `User_Requirements.md`)

Bạn có thể chạy lệnh `/update-wiki <ID>` để cập nhật tài liệu mà không làm mất ghi chú cũ!
```
