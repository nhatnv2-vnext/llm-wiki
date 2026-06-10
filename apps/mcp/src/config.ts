import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Cấu hình cho MCP server.
 *
 * KHÁC với apps/web/lib/load-root-env.ts: env được resolve theo VỊ TRÍ FILE
 * (import.meta.url), KHÔNG theo process.cwd() — vì MCP server có thể được
 * Claude Code spawn từ một repo khác (cwd = repo đó). Biến đã có sẵn trong
 * process.env luôn thắng giá trị trong .env.local.
 *
 * Các hằng số bên dưới PHẢI giữ đồng bộ với apps/web/lib/config.ts
 * (table, dim, model, threshold) — query vector chỉ so sánh được với index
 * khi cùng model/chiều.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url)); // apps/mcp/src
export const REPO_ROOT = path.resolve(HERE, "..", "..", ".."); // monorepo root

/** Parse .env.local đơn giản (KEY=VALUE, bỏ comment/dòng trống). */
function loadRootEnv(): void {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Bỏ cặp quote bao quanh nếu có.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // process.env có sẵn luôn thắng (Docker/client config inject được).
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadRootEnv();

/**
 * Đường dẫn tuyệt đối tới thư mục gốc wiki (02_Wiki).
 * Fallback <repoRoot>/02_Wiki — vault sống trong chính repo này nên
 * zero-config `claude mcp add` vẫn chạy được khi thiếu .env.local.
 */
function readWikiRootPath(): string {
  const raw = process.env.WIKI_ROOT_PATH?.trim();
  if (raw) return path.resolve(raw);
  return path.join(REPO_ROOT, "02_Wiki");
}

export const WIKI_ROOT_PATH = readWikiRootPath();

/** Đường dẫn LanceDB. Mặc định <repoRoot>/.lancedb (apps/web ghi index ở đó). */
function readLanceDbPath(): string {
  const raw = process.env.LANCEDB_PATH?.trim();
  if (raw) return path.resolve(raw);
  return path.join(REPO_ROOT, ".lancedb");
}

export const LANCEDB_PATH = readLanceDbPath();

// --- Hằng số RAG — keep in sync với apps/web/lib/config.ts ------------------

/** Tên bảng chunks trong LanceDB. */
export const WIKI_CHUNKS_TABLE = "wiki_chunks";

/** Số chiều vector embedding. */
export const EMBEDDING_DIM = 768;

/** Model embedding của Google — PHẢI khớp scripts/ingest-rag.ts. */
export const EMBED_MODEL = "models/gemini-embedding-001";

/** Số chunk Top-K mặc định cho search_wiki. */
export const RETRIEVE_TOP_K = 5;

/** Ngưỡng _distance tối đa để coi chunk là liên quan. */
export const RELEVANCE_DISTANCE_THRESHOLD = 0.3;

/** Google API key (cho embedding). Trả null thay vì ném lỗi — tool tự degrade. */
export function readGoogleApiKey(): string | null {
  const key = process.env.GOOGLE_API_KEY?.trim();
  return key && key !== "" ? key : null;
}
