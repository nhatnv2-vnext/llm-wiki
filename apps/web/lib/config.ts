import "server-only";

import path from "node:path";

/**
 * Cấu hình phía server. KHÔNG import file này từ Client Component —
 * `server-only` sẽ ném lỗi build nếu vô tình bị bundle ra client,
 * tránh lộ đường dẫn filesystem tuyệt đối ra phía người dùng.
 */

function readWikiRootPath(): string {
  const raw = process.env.WIKI_ROOT_PATH;

  if (!raw || raw.trim() === "") {
    throw new Error(
      "Thiếu biến môi trường WIKI_ROOT_PATH. " +
        "Hãy tạo file .env.local (tham khảo .env.example) và trỏ nó tới " +
        "đường dẫn tuyệt đối của thư mục 02_Wiki trong Obsidian vault.",
    );
  }

  const resolved = path.resolve(raw.trim());

  if (!path.isAbsolute(resolved)) {
    throw new Error(
      `WIKI_ROOT_PATH phải là đường dẫn tuyệt đối, nhận được: "${raw}".`,
    );
  }

  return resolved;
}

/** Đường dẫn tuyệt đối tới thư mục gốc của wiki (02_Wiki). */
export const WIKI_ROOT_PATH = readWikiRootPath();

/**
 * Đường dẫn thư mục LanceDB (vector DB local).
 * Lấy từ LANCEDB_PATH; mặc định `.lancedb/` trong thư mục chạy app.
 */
function readLanceDbPath(): string {
  const raw = process.env.LANCEDB_PATH?.trim();
  const base = raw && raw !== "" ? raw : ".lancedb";
  return path.resolve(base);
}

/** Đường dẫn tuyệt đối tới thư mục LanceDB. */
export const LANCEDB_PATH = readLanceDbPath();

/** Tên bảng chunks dùng cho RAG. */
export const WIKI_CHUNKS_TABLE = "wiki_chunks";

/** Số chiều vector — khớp model embedding text-embedding-004 của Google. */
export const EMBEDDING_DIM = 768;
