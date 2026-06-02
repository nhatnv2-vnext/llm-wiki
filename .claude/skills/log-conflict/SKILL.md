---
name: log-conflict
description: Ghi nhận một báo cáo xung đột giữa tài liệu đặc tả (PRD) và mã nguồn thực tế (hoặc giữa Wiki và code) vào bảng trong 02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md. Trigger khi user gõ /log-conflict, nói "ghi nhận xung đột", "log conflict này", "code khác với tài liệu", "PRD không khớp code", hoặc khi một skill khác (spec-business/spec-feature/spec-screen/spec-database) phát hiện điểm lệch cần lưu lại.
---

# Skill: log-conflict

Bạn được gọi để **ghi nhận một (hoặc nhiều) xung đột** giữa tài liệu và code vào nhật ký `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`. Đây là file **append-only** (chỉ thêm dòng, không ghi đè lịch sử).

Theo luật vàng của Vault: AI **ghi nhận** xung đột chứ KHÔNG tự ý sửa code hay PRD. Skill này chính là cơ chế thực thi luật đó.

## Đầu vào

User gõ `/log-conflict` kèm mô tả, hoặc một skill khác chuyển sang khi phát hiện điểm lệch.
Nếu mô tả chưa đủ rõ, hỏi user ngắn gọn để lấp 4 trường: **ID/Module**, **Mô tả xung đột** (nguồn-A nói gì vs nguồn-B làm gì), **Nguồn** (PRD/code/file:line), **Người ghi nhận**.

## Quy trình 4 bước (BẮT BUỘC)

### Bước 1 — Đảm bảo file tồn tại đúng chuẩn

Đọc `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`.
- Nếu **chưa tồn tại** → tạo mới với frontmatter + header bảng:

```markdown
---
title: "Báo cáo xung đột tri thức"
type: log
source:
  - System/agent_skills/ingest_codebase.js
status: draft
last_synced: "<YYYY-MM-DD>"
tags:
  - conflict-report
  - logs
  - audit
---

# 🛑 Báo cáo Xung đột (Conflict Reports)

> File append-only. Mỗi dòng là một điểm lệch giữa tài liệu đặc tả (PRD) và mã nguồn thực tế. AI chỉ ghi nhận, KHÔNG tự sửa.

| Ngày | ID / Module | Mô tả xung đột | Nguồn (PRD ↔ Code) | Trạng thái | Người ghi nhận |
|------|-------------|----------------|--------------------|------------|----------------|
```

- Nếu **đã tồn tại** nhưng thiếu header bảng → bổ sung header (không xóa nội dung cũ).

### Bước 2 — Chuẩn hóa dòng xung đột

Với mỗi xung đột, dựng 1 hàng bảng với các cột:
- **Ngày**: hôm nay `YYYY-MM-DD`.
- **ID / Module**: mã feature/screen/schema liên quan (vd `FEA_005`, `SCR_002`, hoặc tên module).
- **Mô tả xung đột**: nêu rõ *PRD/tài liệu nói A* vs *code thực tế làm B*. Cụ thể, tránh mơ hồ.
- **Nguồn (PRD ↔ Code)**: trích nguồn 2 phía, kèm `file:line` của code nếu có.
- **Trạng thái**: mặc định `Open`. (Các giá trị: `Open` | `In Progress` | `Resolved`).
- **Người ghi nhận**: `AI Agent` nếu do skill phát hiện, hoặc tên user nếu user cung cấp.

### Bước 3 — Append vào bảng (KHÔNG archive, KHÔNG ghi đè)

- Thêm (các) dòng mới vào **cuối bảng**. Giữ nguyên mọi dòng cũ — đây là log lịch sử.
- Vì là append-only, **KHÔNG** thực hiện bước archive sang `_Archive/` (khác với các skill spec).
- Cập nhật `last_synced` trong frontmatter thành ngày hôm nay.

> Nếu user yêu cầu **đổi trạng thái** một xung đột đã có (vd `Open` → `Resolved`) thì sửa đúng ô Trạng thái của dòng đó tại chỗ — đây là ngoại lệ hợp lệ duy nhất với nguyên tắc append-only.

### Bước 4 — Trả output cho user

```markdown
✅ Đã ghi nhận <N> xung đột vào [[07_Tasks_&_Logs/Conflict_Reports|Conflict Reports]].

**Tóm tắt:**
- `<ID>` — <mô tả ngắn> → trạng thái `Open`

👉 Nhắc: AI chỉ ghi nhận. Việc sửa code/PRD cần do người quyết định.
```

## Ràng buộc

- KHÔNG sửa code hay file trong `01_Raw/`. Skill này chỉ ghi vào `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`.
- File là append-only: KHÔNG xóa/ghi đè dòng cũ (trừ việc đổi ô Trạng thái khi user yêu cầu). KHÔNG archive.
- Mỗi xung đột phải nêu được CẢ HAI phía (tài liệu nói gì ↔ code làm gì). Nếu chỉ có một phía → hỏi user bổ sung thay vì đoán.
- Giữ đúng cấu trúc bảng để các script audit/thống kê đọc được.

## Ví dụ

> User: `/log-conflict PRD checkout ghi giảm 10% cho đơn > 1tr nhưng code OrderService đang để 5%`
>
> 1. Mở `Conflict_Reports.md` (tạo mới nếu chưa có).
> 2. Dựng dòng: Ngày=2026-06-02, ID=`FEA_005`, Mô tả="PRD: giảm 10% đơn >1tr ↔ Code: hardcode 5%", Nguồn="Checkout_PRD.md ↔ order.service.ts:88", Trạng thái=`Open`, Người ghi nhận=`AI Agent`.
> 3. Append vào cuối bảng, cập nhật last_synced.
> 4. Báo đã ghi 1 xung đột + nhắc không tự sửa.
