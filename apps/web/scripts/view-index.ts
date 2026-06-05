#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as lancedb from "@lancedb/lancedb";

async function loadEnvLocal() {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".env.local",
  );
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (k && !(k in process.env)) process.env[k] = v;
    }
  } catch {}
}

async function main() {
  await loadEnvLocal();

  const lancedbPath = path.resolve(process.env.LANCEDB_PATH?.trim() || ".lancedb");
  const db = await lancedb.connect(lancedbPath);
  const tables = await db.tableNames();

  if (!tables.includes("wiki_chunks")) {
    console.log("Bảng wiki_chunks chưa tồn tại. Hãy chạy: npm run build-index");
    process.exit(0);
  }

  const table = await db.openTable("wiki_chunks");
  const total = await table.countRows();

  console.log(`\nLanceDB : ${lancedbPath}`);
  console.log(`Tổng chunks: ${total}\n`);

  const all = await table.query().select(["file_path", "heading", "text_content"]).toArray();

  const byFile = new Map<string, typeof all>();
  for (const row of all) {
    const fp = row.file_path as string;
    if (!byFile.has(fp)) byFile.set(fp, []);
    byFile.get(fp)!.push(row);
  }

  for (const [filePath, chunks] of [...byFile.entries()].sort()) {
    console.log(`[${filePath}]  (${chunks.length} chunks)`);
    for (const chunk of chunks) {
      const heading = chunk.heading ? `## ${chunk.heading}` : "(intro)";
      const preview = (chunk.text_content as string).slice(0, 80).replace(/\n/g, " ");
      console.log(`  ${heading}`);
      console.log(`  └─ ${preview}...`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error("LỖI:", err);
  process.exit(1);
});
