---
title: "Template: Đặc tả Tính năng Backend (Feature Spec)"
type: template
status: template
tags:
  - template
  - api
  - feature
---

# <Tên Feature> · `<ID>`

## TL;DR
_(1-3 dòng: tính năng này làm gì, ai dùng, kết quả trả về)_

---

## 1. Contract (Hợp đồng API)

| Trường | Giá trị |
|--------|---------|
| **Method** | `POST / GET / PUT / PATCH / DELETE` |
| **Endpoint** | `/api/v1/<resource>` |
| **Auth** | Bearer JWT / Public / API Key |
| **Rate limit** | — |

### Request Payload
```json
{
  "field1": "string",
  "field2": 0
}
```

### Response (200 OK)
```json
{
  "data": {},
  "message": "string"
}
```

### Error Responses
| HTTP Code | Error Code | Mô tả |
|-----------|------------|-------|
| 400 | `VALIDATION_ERROR` | Input không hợp lệ |
| 401 | `UNAUTHORIZED` | Token hết hạn / thiếu |
| 403 | `FORBIDDEN` | Không đủ quyền |
| 404 | `NOT_FOUND` | Resource không tồn tại |
| 409 | `CONFLICT` | Trùng lặp dữ liệu |
| 500 | `INTERNAL_ERROR` | Lỗi server |

---

## 2. Source of Truth (Nguồn sự thật)

| Tầng | File | Dòng |
|------|------|------|
| Controller | `<local_path>/src/<module>/<name>.controller.ts` | L— |
| Service | `<local_path>/src/<module>/<name>.service.ts` | L— |
| Repository | `<local_path>/src/<module>/<name>.repository.ts` | L— |
| DTO | `<local_path>/src/<module>/dto/<name>.dto.ts` | L— |

**Catalog:** `01_Raw/features/Features.json#<ID>`

---

## 3. Business Rules (Quy tắc Nghiệp vụ)

| # | Quy tắc | Xác minh từ code |
|---|---------|-----------------|
| BR1 | <mô tả rule> | ✅ `file.ts:42` / ⚠️ chưa xác minh |
| BR2 | <mô tả rule> | ✅ `file.ts:88` |

---

## 4. Edge Cases & Error Handling

- **<Trường hợp biên 1>**: <mô tả hành vi>
- **<Trường hợp biên 2>**: <mô tả hành vi>

> ⚠️ Cần human review: <ghi những điểm AI chưa suy luận được>

---

## 5. Database Interactions

| Bảng/Model | Thao tác | Điều kiện |
|------------|---------|-----------|
| `<TableName>` | SELECT / INSERT / UPDATE / DELETE | `where <condition>` |

→ Chi tiết schema: [[05_Database/<name>_Schema|<name>]]

---

## 6. NgRx / State (nếu có liên quan FE)

| Selector / Action | File | Mô tả |
|------------------|------|-------|
| `select<Feature>` | `store/<feature>.selectors.ts` | — |
| `load<Feature>` | `store/<feature>.actions.ts` | — |

---

## Source of truth
- Code: `<local_path>/<entry>`
- PRD: `01_Raw/drive_docs/<file>` _(nếu có)_
- Schema: `01_Raw/database/schemas.json`

## Liên kết
- [[Index]]
- [[01_Business/README|Nghiệp vụ liên quan]]
- [[03_Architecture/README|Kiến trúc Hệ thống]]
- [[05_Database/README|Cơ sở dữ liệu]]
