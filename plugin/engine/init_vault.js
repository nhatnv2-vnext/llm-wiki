#!/usr/bin/env node
/**
 * init_vault.js — Scaffold khung knowledge vault 3 lớp vào THƯ MỤC DỰ ÁN của
 * user (process.cwd()), không phải vào thư mục plugin.
 *
 * - Vault root  = process.cwd()         (dự án đích của user)
 * - Plugin root = CLAUDE_PLUGIN_ROOT    (nơi chứa templates/ gốc)
 *
 * Idempotent: file/thư mục đã tồn tại → bỏ qua, không ghi đè.
 *
 * Usage: node "${CLAUDE_PLUGIN_ROOT}/engine/init_vault.js"
 */
const fs = require("node:fs");
const path = require("node:path");

const VAULT_ROOT = process.cwd();

// CLAUDE_PLUGIN_ROOT do Claude Code set khi gọi từ skill. Fallback: suy ra từ
// vị trí script (engine/ nằm cạnh templates/ trong plugin) để chạy/test tay được.
const PLUGIN_ROOT =
  process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "..");
const TEMPLATES_SRC = path.join(PLUGIN_ROOT, "templates");

// Cấu trúc thư mục cần có trong vault đích.
const DIRS = [
  "01_Raw/codebase",
  "01_Raw/screens",
  "01_Raw/features",
  "01_Raw/database",
  "01_Raw/drive_docs",
  "02_Wiki/00_Overview",
  "02_Wiki/01_Business",
  "02_Wiki/02_Design",
  "02_Wiki/03_Architecture",
  "02_Wiki/04_API_Specs",
  "02_Wiki/05_Database",
  "02_Wiki/07_Tasks_&_Logs",
  "02_Wiki/_Templates",
];

// File JSON catalog khởi tạo rỗng (key khớp với các skill đọc về sau).
const SEED_FILES = {
  "01_Raw/codebase/projects.json": { projects: [] },
  "01_Raw/screens/Screens.json": { screens: [] },
  "01_Raw/features/Features.json": { features: [] },
  "01_Raw/database/schemas.json": { schemas: [] },
};

const created = [];
const skipped = [];

function ensureDir(rel) {
  const full = path.join(VAULT_ROOT, rel);
  if (fs.existsSync(full)) {
    skipped.push(rel + "/");
    return;
  }
  fs.mkdirSync(full, { recursive: true });
  created.push(rel + "/");
}

function ensureFile(rel, content) {
  const full = path.join(VAULT_ROOT, rel);
  if (fs.existsSync(full)) {
    skipped.push(rel);
    return;
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  created.push(rel);
}

function copyTemplates() {
  if (!fs.existsSync(TEMPLATES_SRC)) return;
  for (const entry of fs.readdirSync(TEMPLATES_SRC, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const dest = path.join("02_Wiki/_Templates", entry.name);
    ensureFile(dest, fs.readFileSync(path.join(TEMPLATES_SRC, entry.name), "utf8"));
  }
}

function main() {
  console.log(`📁 Khởi tạo vault tại: ${VAULT_ROOT}`);

  for (const d of DIRS) ensureDir(d);

  for (const [rel, obj] of Object.entries(SEED_FILES)) {
    ensureFile(rel, JSON.stringify(obj, null, 2) + "\n");
  }

  // Giữ drive_docs trong git kể cả khi rỗng.
  ensureFile("01_Raw/drive_docs/.gitkeep", "");

  copyTemplates();

  console.log(`\n✅ Tạo mới: ${created.length} mục`);
  created.forEach((c) => console.log(`   + ${c}`));
  if (skipped.length) {
    console.log(`\nℹ️  Đã có (bỏ qua): ${skipped.length} mục`);
  }
}

main();
