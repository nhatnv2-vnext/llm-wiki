import "server-only";

import path from "node:path";

import { loadRootEnv } from "@/lib/load-root-env";

/**
 * Cấu hình phía server. KHÔNG import file này từ Client Component —
 * `server-only` sẽ ném lỗi build nếu vô tình bị bundle ra client,
 * tránh lộ đường dẫn filesystem tuyệt đối ra phía người dùng.
 *
 * Env được khai báo ở MỘT nơi: My_Project_Vault/.env.local (root monorepo).
 * Nạp nó vào process.env trước khi đọc bất kỳ biến nào bên dưới.
 */
loadRootEnv();

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

/** Số chiều vector — phải khớp với chiều dùng khi ingest (scripts/ingest-rag.ts). */
export const EMBEDDING_DIM = 768;

/**
 * Model embedding của Google.
 * BẮT BUỘC khớp với model dùng trong scripts/ingest-rag.ts — vector của query
 * và vector đã index phải sinh từ cùng một model thì khoảng cách mới có nghĩa.
 */
export const EMBED_MODEL = "models/gemini-embedding-001";

/** Số chunk Top-K trả về cho mỗi truy vấn RAG. */
export const RETRIEVE_TOP_K = 5;

/** Độ dài tối đa (ký tự) cho phép của một câu query. */
export const MAX_QUERY_LENGTH = 500;

/**
 * Ngưỡng _distance (cosine) tối đa để coi một chunk là "đủ liên quan".
 * LanceDB trả _distance càng nhỏ càng giống. Nếu chunk gần nhất vẫn vượt
 * ngưỡng này → câu hỏi nằm ngoài phạm vi wiki.
 *
 * Quan sát thực tế (gemini-embedding-001, wiki hiện tại): câu trong phạm vi
 * có _distance ~0.20–0.24, câu lạc đề ~0.33+. Đặt 0.30 để tách hai nhóm.
 * LƯU Ý: ngưỡng này cần tinh chỉnh lại khi wiki lớn/đa dạng hơn — chạy vài
 * query mẫu rồi xem _distance để điều chỉnh.
 */
export const RELEVANCE_DISTANCE_THRESHOLD = 0.3;

/** Đọc Google API key phía server; ném lỗi rõ ràng nếu thiếu. */
export function readGoogleApiKey(): string {
  const key = process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Thiếu biến môi trường GOOGLE_API_KEY. " +
        "Hãy thêm GOOGLE_API_KEY vào .env.local để gọi Google Embedding API.",
    );
  }
  return key;
}
