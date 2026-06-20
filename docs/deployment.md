# Triển khai & Vận hành Web App

Web app (`apps/web`) hiển thị Wiki dưới dạng website với tính năng RAG search.
Tài liệu này gom toàn bộ phần cấu hình môi trường, đăng nhập, chạy Docker và
ingestion. Để bắt đầu nhanh, xem [README](../README.md).

## Yêu cầu

- Docker & Docker Compose v2.1+
- **Google API Key** — dùng cho cả embedding (`gemini-embedding-001`) và sinh
  câu trả lời (`gemini-2.5-flash` qua Vercel AI SDK).

## Cấu hình môi trường

Env khai báo ở **một nơi duy nhất**: `.env.local` ở gốc monorepo. Compose,
local dev và script ingest đều đọc chung file này.

```bash
cp .env.example .env.local      # local
cp .env.example .env.staging    # staging
cp .env.example .env.production # production
```

Các biến chính (xem [`.env.example`](../.env.example)):

```env
GOOGLE_API_KEY=your-google-api-key-here
# Chỉ cần cho chạy local/ingest ngoài Docker (Docker tự ghi đè 2 biến này):
WIKI_ROOT_PATH=/absolute/path/to/My_Project_Vault/02_Wiki
LANCEDB_PATH=.lancedb
```

> 💡 `pnpm onboard` (xem README) tự tạo `.env.local`, sinh `SESSION_SECRET` và
> điền `WIKI_ROOT_PATH` giúp bạn.

### Đăng nhập: `SESSION_SECRET` + `AUTH_USERS`

Web app yêu cầu đăng nhập (email + mật khẩu). Thêm 2 biến vào `.env.local`.

**1. `SESSION_SECRET`** — khóa ký JWT phiên (chuỗi ngẫu nhiên ≥ 32 ký tự):

```bash
openssl rand -base64 32
```

**2. `AUTH_USERS`** — danh sách user, mỗi user là cặp `email:bcryptHash`. Sinh
hash bằng script (không lưu plaintext):

```bash
cd apps/web
npm run hash-password -- 'mat-khau-cua-ban' email@example.com
# hoặc chạy không tham số để nhập mật khẩu tương tác (ẩn ký tự):
npm run hash-password
```

Nhiều user thì nối các cặp bằng **dấu phẩy** trên cùng một dòng:

```env
AUTH_USERS=admin@example.com:$2b$10$abc...,user2@example.com:$2b$10$xyz...
```

> ⚠️ Hash bcrypt chứa ký tự `$`. Khi **dán vào `.env.local`** để nguyên (không
> bọc nháy). Khi truyền mật khẩu qua shell ở lệnh `hash-password`, bọc **nháy
> đơn** `'...'` để shell không nội suy `$`.
>
> Sửa `.env.local` xong phải **restart** dev server / `docker compose restart`
> để nạp lại env.

## Chạy bằng Docker

```bash
docker compose --env-file .env.local up --build       # local
docker compose --env-file .env.staging up --build      # staging
docker compose --env-file .env.production up --build    # production
```

**Mỗi lần** container khởi động, `entrypoint.sh` tự động:

1. Chạy ingestion pipeline — đọc toàn bộ `02_Wiki/`, embedding và lưu vào LanceDB.
2. Khởi động Next.js server tại `http://localhost:3000`.

Từ lần 2 trở đi, ingestion chỉ re-embed file đã thay đổi (incremental) nên
restart rất nhanh.

> **Docker KHÔNG dùng `npm run build-index`.** Để image runtime gọn và không phụ
> thuộc `tsx`/pnpm, ingestion được đóng gói khác:
> - Lúc **build image**: `esbuild` bundle `scripts/ingest-rag.ts` thành
>   `ingest-rag.mjs`, đặt cùng `node_modules` riêng trong thư mục `/ingest`.
> - Lúc **container chạy**: `entrypoint.sh` gọi `node /ingest/ingest-rag.mjs` rồi
>   mới khởi động Next.js (`node server.js`).
>
> Cả hai đường dùng chung file nguồn `scripts/ingest-rag.ts` nên logic
> incremental giống hệt — chỉ khác cách đóng gói & thời điểm chạy. Trong Docker,
> env do Compose bơm sẵn vào `process.env`, không đọc từ `.env.local`.

## Chạy ingestion thủ công (ngoài Docker)

`build-index` đọc toàn bộ `02_Wiki/`, embedding qua Google rồi lưu vào LanceDB.
Chạy từ **gốc monorepo** hoặc từ `apps/web` (kết quả như nhau):

```bash
npm run build-index               # incremental — chỉ re-embed file đã thay đổi
npm run build-index -- --force    # reset & re-index toàn bộ
npm run view-index                # xem nhanh nội dung index đã build
```

> Lần đầu chạy có thể mất vài phút (gọi Google Embedding API cho mọi chunk). Các
> lần sau incremental nên rất nhanh.

## API RAG

| Endpoint           | Mô tả                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `POST /api/search` | Nhận `{ query }` → trả Top-5 chunk liên quan (`text_content` + `file_path`), đã dedupe.                          |
| `POST /api/chat`   | Nhận `{ query }` → **stream** (SSE) câu trả lời Markdown bám ngữ cảnh wiki, kèm `sources` trong message metadata. |

Cả hai có guardrails: chặn prompt injection / từ độc hại / query quá dài, che
PII, và từ chối câu hỏi ngoài phạm vi wiki (`outOfScope`). `/api/chat` chỉ trả
lời dựa trên context nội bộ, không bịa kiến thức ngoài.
