#!/usr/bin/env tsx
/**
 * scripts/ingest-rag.ts
 *
 * Incremental ingestion pipeline: chỉ re-embed file đã thay đổi (theo content hash).
 * Lưu vào bảng wiki_chunks trong LanceDB, upsert theo file_path.
 *
 * Chạy: npm run build-index
 * Force full re-index: npm run build-index -- --force
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as lancedb from "@lancedb/lancedb";
import { Field, FixedSizeList, Float32, Schema, Utf8 } from "apache-arrow";

// ---------------------------------------------------------------------------
// Load .env.local khi chạy script (không qua Next.js loader)
// ---------------------------------------------------------------------------

async function loadEnvLocal(): Promise<void> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(scriptDir, "..", ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env.local không bắt buộc
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WIKI_CHUNKS_TABLE = "wiki_chunks";
const MANIFEST_FILENAME = "ingest-manifest.json";
const EMBEDDING_DIM = 768;
const BATCH_SIZE = 100;
const MIN_CHUNK_LENGTH = 50;
const MAX_CHUNK_LENGTH = 2000;
const IGNORED_DIRS = new Set(["_Archive", "_Templates"]);
const IGNORED_FILES = new Set(["SKILL.md"]);
const IVF_MIN_ROWS = 256;

function getConfig() {
  const wikiRoot = process.env.WIKI_ROOT_PATH?.trim();
  if (!wikiRoot)
    throw new Error(
      "Thiếu biến môi trường WIKI_ROOT_PATH.\n" +
        "Hãy tạo .env.local hoặc set biến trước khi chạy build-index.",
    );

  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (!googleKey)
    throw new Error(
      "Thiếu biến môi trường GOOGLE_API_KEY.\n" +
        "Hãy thêm GOOGLE_API_KEY vào .env.local.",
    );

  const lancedbPath = path.resolve(
    process.env.LANCEDB_PATH?.trim() || ".lancedb",
  );
  const forceFullReindex = process.argv.includes("--force");

  return {
    wikiRoot: path.resolve(wikiRoot),
    lancedbPath,
    googleKey,
    forceFullReindex,
  };
}

// ---------------------------------------------------------------------------
// Manifest — lưu content hash của từng file để detect thay đổi
// ---------------------------------------------------------------------------

type Manifest = Record<string, string>; // file_path → sha256 (16 hex chars)

async function loadManifest(manifestPath: string): Promise<Manifest> {
  try {
    const raw = await fs.readFile(manifestPath, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return {};
  }
}

async function saveManifest(
  manifestPath: string,
  manifest: Manifest,
): Promise<void> {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// LanceDB schema
// ---------------------------------------------------------------------------

const wikiChunksSchema = new Schema([
  new Field("id", new Utf8(), false),
  new Field("text_content", new Utf8(), false),
  new Field("file_path", new Utf8(), false),
  new Field("heading", new Utf8(), false),
  new Field(
    "vector",
    new FixedSizeList(EMBEDDING_DIM, new Field("item", new Float32(), true)),
    false,
  ),
]);

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      results.push(...(await collectMarkdownFiles(path.join(dir, entry.name))));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      if (!IGNORED_FILES.has(entry.name))
        results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function toFilePath(absPath: string, wikiRoot: string): string {
  return path
    .relative(wikiRoot, absPath)
    .split(path.sep)
    .join("/")
    .replace(/\.md$/, "");
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

type RawChunk = {
  id: string;
  text_content: string;
  file_path: string;
  heading: string;
};

function chunkByHeading(content: string, filePath: string): RawChunk[] {
  const chunks: RawChunk[] = [];
  const sections = content.split(/^(?=##\s)/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section.trim()) continue;

    let heading = "";
    let text: string;

    const headingMatch = section.match(/^##\s+(.+?)(?:\r?\n|$)/);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      text = section.slice(headingMatch[0].length).trim();
    } else {
      text = section.trim();
    }

    if (text.length < MIN_CHUNK_LENGTH) continue;
    if (text.length > MAX_CHUNK_LENGTH) text = text.slice(0, MAX_CHUNK_LENGTH);

    chunks.push({ id: `${filePath}#${i}`, text_content: text, file_path: filePath, heading });
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Google Embedding API
// ---------------------------------------------------------------------------

const EMBED_MODEL = "models/gemini-embedding-001";
const EMBED_CONCURRENCY = 5;

type EmbedContentResponse = { embedding: { values: number[] } };

async function embedOne(text: string, googleKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${EMBED_MODEL}:embedContent?key=${googleKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google Embedding API lỗi ${res.status}: ${errBody}`);
  }

  return ((await res.json()) as EmbedContentResponse).embedding.values;
}

async function embedBatch(
  texts: string[],
  googleKey: string,
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);
  const queue = texts.map((t, i) => ({ text: t, idx: i }));

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      results[item.idx] = await embedOne(item.text, googleKey);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(EMBED_CONCURRENCY, texts.length) }, worker),
  );
  return results;
}

// ---------------------------------------------------------------------------
// LanceDB helpers
// ---------------------------------------------------------------------------

async function openOrCreateTable(db: lancedb.Connection): Promise<lancedb.Table> {
  const names = await db.tableNames();
  if (names.includes(WIKI_CHUNKS_TABLE)) return db.openTable(WIKI_CHUNKS_TABLE);
  return db.createEmptyTable(WIKI_CHUNKS_TABLE, wikiChunksSchema);
}

async function deleteChunksByFilePaths(
  table: lancedb.Table,
  filePaths: string[],
): Promise<void> {
  if (filePaths.length === 0) return;
  const inList = filePaths
    .map((fp) => `'${fp.replace(/'/g, "''")}'`)
    .join(", ");
  await table.delete(`file_path IN (${inList})`);
}

async function maybeCreateIndex(
  table: lancedb.Table,
  totalRows: number,
): Promise<void> {
  if (totalRows < IVF_MIN_ROWS) {
    console.log(
      `[ingest] Bỏ qua IVF-PQ index (${totalRows} < ${IVF_MIN_ROWS} rows) — dùng brute-force scan.`,
    );
    return;
  }
  await table.createIndex("vector", {
    config: lancedb.Index.ivfPq({ numPartitions: 2, numSubVectors: 16 }),
    replace: true,
  });
  console.log("[ingest] Đã tạo/cập nhật vector index (IVF-PQ).");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function ingest(): Promise<void> {
  await loadEnvLocal();
  const { wikiRoot, lancedbPath, googleKey, forceFullReindex } = getConfig();
  const manifestPath = path.join(lancedbPath, MANIFEST_FILENAME);

  console.log(`[ingest] WIKI_ROOT_PATH : ${wikiRoot}`);
  console.log(`[ingest] LANCEDB_PATH   : ${lancedbPath}`);
  if (forceFullReindex) console.log("[ingest] --force: bỏ qua manifest, re-index toàn bộ.");

  // 1. Thu thập tất cả file hiện tại
  const allAbsPaths = await collectMarkdownFiles(wikiRoot);
  console.log(`[ingest] Tìm thấy ${allAbsPaths.length} file .md`);

  // 2. Load manifest, detect thay đổi
  const manifest: Manifest = forceFullReindex ? {} : await loadManifest(manifestPath);
  const currentFilePaths = new Set<string>();

  type FileEntry = { absPath: string; filePath: string; content: string };
  const toProcess: FileEntry[] = [];

  for (const absPath of allAbsPaths) {
    const content = await fs.readFile(absPath, "utf-8");
    const filePath = toFilePath(absPath, wikiRoot);
    currentFilePaths.add(filePath);

    const hash = hashContent(content);
    if (manifest[filePath] === hash) continue; // không thay đổi

    toProcess.push({ absPath, filePath, content });
    manifest[filePath] = hash;
  }

  // File bị xoá khỏi wiki nhưng còn trong manifest
  const deletedFilePaths = Object.keys(manifest).filter(
    (fp) => !currentFilePaths.has(fp),
  );
  for (const fp of deletedFilePaths) delete manifest[fp];

  const hasChanges = toProcess.length > 0 || deletedFilePaths.length > 0;

  if (!hasChanges) {
    console.log("✓ Không có thay đổi nào. Bỏ qua embedding, LanceDB giữ nguyên.");
    return;
  }

  console.log(
    `[ingest] Thay đổi: ${toProcess.length} file cần re-index, ${deletedFilePaths.length} file bị xoá.`,
  );

  // 3. Chunking chỉ các file thay đổi
  const rawChunks: RawChunk[] = toProcess.flatMap(({ content, filePath }) =>
    chunkByHeading(content, filePath),
  );
  console.log(`[ingest] ${rawChunks.length} chunk mới cần embed.`);

  // 4. Embedding
  const allVectors: number[][] = [];
  if (rawChunks.length > 0) {
    console.log(`[ingest] Embedding ${rawChunks.length} chunk (batch ${BATCH_SIZE})...`);

    for (let start = 0; start < rawChunks.length; start += BATCH_SIZE) {
      const batch = rawChunks.slice(start, start + BATCH_SIZE);
      const batchNum = Math.floor(start / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rawChunks.length / BATCH_SIZE);
      process.stdout.write(
        `\r  batch ${batchNum}/${totalBatches} (${start + batch.length}/${rawChunks.length} chunk)`,
      );

      const vectors = await embedBatch(batch.map((c) => c.text_content), googleKey);
      allVectors.push(...vectors);

      if (start + BATCH_SIZE < rawChunks.length)
        await new Promise((r) => setTimeout(r, 500));
    }
    console.log("\n[ingest] Embedding hoàn tất.");
  }

  // 5. Upsert vào LanceDB
  const db = await lancedb.connect(lancedbPath);
  const table = await openOrCreateTable(db);

  // Xoá chunks cũ của file thay đổi + file bị xoá
  const filesToDelete = [
    ...toProcess.map((f) => f.filePath),
    ...deletedFilePaths,
  ];
  await deleteChunksByFilePaths(table, filesToDelete);
  if (filesToDelete.length > 0)
    console.log(`[ingest] Đã xoá chunks cũ cho ${filesToDelete.length} file.`);

  // Thêm chunks mới
  if (rawChunks.length > 0) {
    const records = rawChunks.map((chunk, i) => ({ ...chunk, vector: allVectors[i] }));
    await table.add(records);
    console.log(`[ingest] Đã thêm ${records.length} chunk mới vào "${WIKI_CHUNKS_TABLE}".`);
  }

  // 6. Index ANN (dựa trên tổng số rows trong bảng)
  const totalRows = await table.countRows();
  await maybeCreateIndex(table, totalRows);

  // 7. Lưu manifest
  await saveManifest(manifestPath, manifest);
  console.log(`[ingest] Manifest đã lưu (${Object.keys(manifest).length} file tracked).`);

  console.log(
    `\n✓ Hoàn thành: +${rawChunks.length} chunk added, -${deletedFilePaths.length} file removed. Tổng: ${totalRows} chunk trong LanceDB.`,
  );
}

ingest().catch((err) => {
  console.error("[ingest] LỖI:", err);
  process.exit(1);
});
