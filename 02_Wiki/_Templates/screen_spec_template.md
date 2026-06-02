---
title: "<name>"
type: screen-spec
source:
  - "01_Raw/screens/Screens.json#<id>"
  - "local: <local_path>/<component>"
  - "figma: <figma_node_url>"
status: draft
last_synced: "<YYYY-MM-DD>"
tags:
  - screen-spec
  - xxx_id_slug
---

# &lt;name&gt; · `&lt;id&gt;`

## TL;DR
_(1-3 dòng: vai trò màn hình, user chính, kết quả mong đợi)_

## Route & Component
- **Route**: `/<url>`
- **Component**: `<component>` (project: `<project>`, local: `<local_path>`)
- **Guard**: _(authGuard / guestOnlyGuard / public)_
- **Lazy load**: _(yes/no)_

## Layout (từ Figma)
_(Bullet từ figma-reader: sections, component instance, design tokens. Đính kèm link node Figma từng phần)_

- **Header**: …
- **Body**: …
- **Footer / actions**: …

> Figma source: <figma_node_url>

## State & Data (NgRx + API)
_(Bullet từ code-reader: signal/store/selector + endpoint API gọi)_

| Loại | Tên | Mô tả |
|------|-----|-------|
| Signal | `products()` | Danh sách sản phẩm hiển thị |
| Action | `[Products] Load` | Trigger fetch |
| API | `GET /products` | Endpoint dùng |

## User Flow
1. _(bước 1: user landing)_
2. _(bước 2: tương tác)_
3. _(bước 3: kết quả/điều hướng)_

## Business Rules
- _(rule 1, kèm link tới PRD hoặc API spec)_
- _(rule 2)_

## Edge Cases & Validation
- **Empty state**: …
- **Error state**: …
- **Loading state**: …
- **Validation**: …

## Source of truth
- Component code: `<local_path>/<component>`
- Route definition: `<local_path>/src/app/app.routes.ts`
- Figma: <figma_node_url>
- API contract: _(link wiki [[XYZ_API]])_
- DB schema: xem `01_Raw/database/schemas.json`

## Liên kết
- [[Index]]
- [[Frontend_Overview]]
- [[Frontend_NgRx_Store]]
- _(link [[XYZ_API]] tương ứng `related_apis`)_
