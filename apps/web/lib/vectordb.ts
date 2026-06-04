import "server-only";

import * as lancedb from "@lancedb/lancedb";
import {
  Field,
  FixedSizeList,
  Float32,
  Schema,
  Utf8,
} from "apache-arrow";

import { EMBEDDING_DIM, LANCEDB_PATH, WIKI_CHUNKS_TABLE } from "@/lib/config";

/**
 * Schema bảng `wiki_chunks`:
 *  - id            string   — khoá chunk (vd "<file_path>#<index>")
 *  - text_content  string   — nội dung chunk
 *  - file_path     string   — slug/đường dẫn file nguồn
 *  - heading       string   — heading gần nhất (có thể rỗng)
 *  - vector        float32[768] — embedding (text-embedding-004)
 */
export const wikiChunksSchema = new Schema([
  new Field("id", new Utf8(), false),
  new Field("text_content", new Utf8(), false),
  new Field("file_path", new Utf8(), false),
  new Field("heading", new Utf8(), true),
  new Field(
    "vector",
    new FixedSizeList(
      EMBEDDING_DIM,
      new Field("item", new Float32(), true),
    ),
    false,
  ),
]);

/** Kiểu một bản ghi chunk (khớp schema trên). */
export type WikiChunk = {
  id: string;
  text_content: string;
  file_path: string;
  heading?: string;
  vector: number[];
};

// Kết nối DB được cache trong memory để tái sử dụng.
let connPromise: Promise<lancedb.Connection> | null = null;

/** Mở (hoặc tạo) kết nối tới thư mục LanceDB tại LANCEDB_PATH. */
export function getConnection(): Promise<lancedb.Connection> {
  if (!connPromise) {
    connPromise = lancedb.connect(LANCEDB_PATH);
  }
  return connPromise;
}

/**
 * Tạo bảng `wiki_chunks` nếu chưa tồn tại (idempotent).
 * Trả về handle bảng.
 */
export async function createTable(): Promise<lancedb.Table> {
  const db = await getConnection();
  const names = await db.tableNames();
  if (names.includes(WIKI_CHUNKS_TABLE)) {
    return db.openTable(WIKI_CHUNKS_TABLE);
  }
  return db.createEmptyTable(WIKI_CHUNKS_TABLE, wikiChunksSchema);
}

/**
 * Lấy handle bảng `wiki_chunks` (đã tồn tại).
 * Ném lỗi nếu bảng chưa được tạo — gọi createTable() trước.
 */
export async function getTable(): Promise<lancedb.Table> {
  const db = await getConnection();
  const names = await db.tableNames();
  if (!names.includes(WIKI_CHUNKS_TABLE)) {
    throw new Error(
      `Bảng "${WIKI_CHUNKS_TABLE}" chưa tồn tại. Hãy chạy createTable() trước.`,
    );
  }
  return db.openTable(WIKI_CHUNKS_TABLE);
}
