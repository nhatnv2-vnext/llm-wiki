import fs from "node:fs";

import * as lancedb from "@lancedb/lancedb";

import { LANCEDB_PATH, WIKI_CHUNKS_TABLE } from "./config.js";

/**
 * Truy cập READ-ONLY vào LanceDB (index do apps/web/scripts/ingest-rag.ts ghi).
 * Khác apps/web/lib/vectordb.ts: KHÔNG tạo bảng — chỉ probe; trả null nếu
 * index chưa tồn tại để tool tự degrade với message hướng dẫn.
 */

let connectionPromise: Promise<lancedb.Connection> | null = null;

function getConnection(): Promise<lancedb.Connection> {
  if (!connectionPromise) {
    connectionPromise = lancedb.connect(LANCEDB_PATH);
  }
  return connectionPromise;
}

/** Mở bảng wiki_chunks nếu có; null nếu chưa được ingest. */
export async function tryGetTable(): Promise<lancedb.Table | null> {
  if (!fs.existsSync(LANCEDB_PATH)) return null;
  try {
    const db = await getConnection();
    const names = await db.tableNames();
    if (!names.includes(WIKI_CHUNKS_TABLE)) return null;
    return await db.openTable(WIKI_CHUNKS_TABLE);
  } catch (err) {
    console.error("[mcp] Không mở được LanceDB:", err);
    return null;
  }
}
