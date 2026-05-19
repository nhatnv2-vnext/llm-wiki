---
name: spec-screen
description: Sinh functional spec cho 1 màn hình của app laptop-shop bằng cách điều phối 2 sub-agent song song (figma-reader + code-reader). Trigger khi user gõ /spec-screen <ID> (vd /spec-screen SCR_002), hoặc nói "tạo spec màn hình X", "viết spec cho screen SCR_...", "đồng bộ spec màn hình từ Figma và code". Yêu cầu entry tương ứng phải tồn tại trong 02_Wiki/00_Dashboard/Screens.json.
---

# Skill: spec-screen

Bạn được gọi để **sinh tài liệu spec functional cho 1 màn hình** của app `laptop-shop` (NestJS + Angular). Tài liệu sẽ được ghi vào `02_Wiki/06_Screen_Specs/<ID>_<slug>.md`.

## Đầu vào

User gõ `/spec-screen <ID>` (vd `/spec-screen SCR_002`) hoặc nói câu tương đương kèm ID.

## Quy trình 7 bước (BẮT BUỘC theo đúng thứ tự)

### Bước 1 — Lookup screen

1. Đọc `02_Wiki/00_Dashboard/Screens.json`.
2. Tìm entry có `id == <ID>`. Nếu không có → trả lỗi:
   > ❌ Không tìm thấy `<ID>` trong Screens.json. Các ID hợp lệ: <liệt kê>.
   Và DỪNG. KHÔNG spawn sub-agent.
3. Đọc memory `MEMORY.md` của user nếu có context liên quan.

### Bước 2 — Spawn 2 sub-agent SONG SONG (single message, 2 tool calls)

Dùng `Agent` tool với `subagent_type: general-purpose`. Trong **cùng 1 message** gọi 2 lần Agent để chạy parallel.

#### Sub-agent A — figma-reader

Chỉ spawn nếu `figma_node_url` KHÔNG rỗng. Prompt:

```
Bạn là sub-agent đọc Figma cho màn hình "<NAME>" (<ID>).

Input: danh sách URL Figma node = <FIGMA_URLS>

Task:
1. Với mỗi URL, parse fileKey + nodeId (convert "-" sang ":" trong nodeId).
2. Gọi mcp__plugin_figma_figma__get_metadata để lấy cấu trúc node.
3. Gọi mcp__plugin_figma_figma__get_variable_defs để lấy design tokens (color, spacing, typography).
4. Gọi mcp__plugin_figma_figma__get_screenshot (optional, chỉ nếu cần xem layout).

Output (markdown, ≤ 300 từ, không quá 5 bullet/section):
- **Sections**: liệt kê các phần layout chính (header, body, footer, sidebar…)
- **Component instances**: tên component design system được dùng + props
- **Design tokens**: color/spacing/typography tokens xuất hiện
- **CTA / user actions**: button label, icon, link quan sát được
- **Notes**: bất kỳ điểm bất thường (variant, conditional visibility)

QUY TẮC:
- KHÔNG đoán business logic (đó là việc của main agent).
- KHÔNG đoán tên biến code.
- Trả về DUY NHẤT markdown content, không meta-comment.
```

#### Sub-agent B — code-reader

Luôn spawn. Prompt:

```
Bạn là sub-agent đọc code Angular cho màn hình "<NAME>" (<ID>).

Input:
- route URL: "<URL>"
- component path: 01_Raw/codebase/angular-frontend/<COMPONENT>

Tools cho phép: Read, Grep, Glob (read-only).

Task:
1. Đọc 01_Raw/codebase/angular-frontend/src/app/app.routes.ts → xác nhận route "<URL>" map tới component nào, guard nào.
2. Đọc file component .ts và file .html cùng tên (nếu có). Liệt kê:
   - @Input / @Output / signal / computed
   - Lifecycle hook chính (ngOnInit, ngOnDestroy)
   - Method handler chính
3. Grep service được inject (constructor). Với mỗi service, mở file và liệt kê HTTP call (this.http.get/post/...) + endpoint path.
4. Tìm NgRx (folder src/app/shared/ngrx-store hoặc store): selector + action liên quan tới feature.
5. Liệt kê guard / interceptor áp dụng cho route.

Output (markdown, ≤ 400 từ):
- **Route**: route "<URL>" → component <X>, guard [<...>], lazy: yes/no
- **Component API**: bảng input/output/signal kèm file:line
- **Services & endpoints**: bảng service → method → endpoint kèm file:line
- **NgRx state**: bảng selector/action/effect kèm file:line
- **Validation/form**: nếu có FormGroup/Validators, liệt kê

QUY TẮC:
- KHÔNG đoán nội dung file chưa đọc. Nếu file không tồn tại → ghi rõ "⚠️ Không tìm thấy <path>".
- Mọi claim phải có file:line.
- Trả về DUY NHẤT markdown content.
```

### Bước 3 — Chờ cả 2 sub-agent xong

Main agent KHÔNG đọc Figma hoặc Angular component trực tiếp ở bước này (để giữ context sạch).

### Bước 4 — Đọc template

Đọc `02_Wiki/_Templates/screen_spec_template.md`.

### Bước 5 — Merge output → file spec

1. Thay placeholder trong template: `<name>`, `<id>`, `<url>`, `<component>`, `<figma_node_url>`, `<YYYY-MM-DD>`. Riêng tag `xxx_id_slug` → thay bằng id lowercase (vd `scr_002`). H1 trong template viết dạng HTML entity `&lt;name&gt; · &lt;id&gt;` — khi thay, sửa nguyên cụm thành tiêu đề thật, vd `Tìm kiếm Sản phẩm · SCR_002`.
2. Đổ output sub-agent A vào section **Layout (từ Figma)**. Nếu không có Figma → ghi `> ⚠️ Chưa có Figma node cho màn hình này.`
3. Đổ output sub-agent B vào section **Route & Component** + **State & Data**.
4. Section **TL;DR**, **User Flow**, **Business Rules**, **Edge Cases** → main agent tổng hợp từ 2 output trên. Khi không suy luận được → ghi `> ⚠️ Cần human review` thay vì bịa.
5. Thêm wikilink `[[XYZ_API]]` cho mỗi entry trong `related_apis` (mapping: `/products` → `[[Products_API]]`, `/auth/*` → `[[Auth_API]]`, `/users/*` → `[[Users_API]]`, `/roles/*` → `[[Roles_API]]`, `/cron/*` → `[[Cronjob_API]]`).

### Bước 6 — Ghi file

- Slugify `name` (bỏ dấu tiếng Việt, snake_case capital).
- Path: `02_Wiki/06_Screen_Specs/<ID>_<Slug>.md`.
- Nếu file đã tồn tại → ghi đè (báo cho user biết).

### Bước 7 — Update `Screens.json`

Sửa entry tương ứng: `status` = `"draft"`, `last_synced` = `"YYYY-MM-DD"` (hôm nay).

### Cuối cùng — Trả output cho user

```markdown
✅ Đã sinh spec cho **<NAME>** (`<ID>`).

📄 [[06_Screen_Specs/<ID>_<Slug>|<NAME>]]

**Highlight:**
- <1-2 dòng nổi bật từ figma/code>

**Cần review thủ công:**
- <các điểm ⚠️ Cần human review>
```

## Ràng buộc

- KHÔNG sửa file trong `01_Raw/`.
- KHÔNG bịa nội dung. Mọi mục không suy luận được → `> ⚠️ Cần human review`.
- KHÔNG bỏ qua bước update `Screens.json` (bước 7).
- Sub-agent phải chạy SONG SONG (2 Agent tool calls trong cùng 1 message), không tuần tự.
- Trước khi spawn sub-agent, đọc `MEMORY.md` để áp dụng quyết định đã chốt (vd: ts-morph cho Node, không dùng GitNexus cho Angular).

## Ví dụ

> User: `/spec-screen SCR_002`
>
> 1. Đọc Screens.json → entry SCR_002: name="Tìm kiếm / Danh sách sản phẩm", url="products", component="src/app/client/product/product-list.component.ts", figma_node_url=[1 URL], related_apis=["GET /products", "GET /products/:id"].
> 2. Spawn 2 sub-agent song song với prompt template trên.
> 3. Sau khi 2 sub-agent xong → đọc `_Templates/screen_spec_template.md`.
> 4. Merge → ghi `02_Wiki/06_Screen_Specs/SCR_002_Tim_Kiem_San_Pham.md`.
> 5. Update Screens.json: status="draft", last_synced="2026-05-19".
> 6. Trả wikilink + 2 dòng highlight.
