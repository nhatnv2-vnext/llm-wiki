#!/usr/bin/env node
/**
 * archive_prd.js — Versioning & auto-archive cho tài liệu PRD (GĐ4.1).
 *
 * Convention: PRD đặt tên theo `PRD_v{N}.pdf` (N là số nguyên dương),
 * ví dụ `PRD_v1.pdf`, `PRD_v2.pdf`. Bản "current" là version cao nhất.
 *
 * Khi xuất hiện bản mới (vd `PRD_v3.pdf`), mọi bản cũ hơn (`PRD_v1.pdf`,
 * `PRD_v2.pdf`) được MOVE vào `01_Raw/drive_docs/archive/` — KHÔNG xóa,
 * để diffing engine (#13) so khớp. File parsed tương ứng trong
 * `01_Raw/drive_docs/parsed/PRD_v{N}.md` cũng được archive cùng.
 *
 * Bản current được nhận diện qua file con trỏ `archive/.current`
 * (ghi tên file PRD version cao nhất hiện tại).
 *
 * Chạy SAU bước `sync-drive`. Idempotent — chạy lại khi không có bản mới
 * sẽ không thay đổi gì.
 *
 * Usage: node agent_skills/archive_prd.js [--dry-run]
 */
const fs = require('node:fs');
const path = require('node:path');

// Script ở apps/System/agent_skills -> lên 3 cấp tới gốc vault (nơi chứa 01_Raw).
const VAULT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DRIVE_DOCS = path.join(VAULT_ROOT, '01_Raw', 'drive_docs');
const PARSED_DIR = path.join(DRIVE_DOCS, 'parsed');
const ARCHIVE_DIR = path.join(DRIVE_DOCS, 'archive');
const CURRENT_PTR = path.join(ARCHIVE_DIR, '.current');

const DRY_RUN = process.argv.includes('--dry-run');

// Khớp `PRD_v{N}.pdf` (không phân biệt hoa/thường), bắt số version.
const PRD_RE = /^PRD_v(\d+)\.pdf$/i;

function rel(p) {
  return path.relative(VAULT_ROOT, p);
}

/** Liệt kê các bản PRD ở thư mục gốc drive_docs, sắp xếp theo version. */
function listPrdVersions(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && PRD_RE.test(e.name))
    .map((e) => ({ name: e.name, version: Number(e.name.match(PRD_RE)[1]) }))
    .sort((a, b) => a.version - b.version);
}

function move(src, dest) {
  if (DRY_RUN) {
    console.log(`   [dry-run] move ${rel(src)} → ${rel(dest)}`);
    return;
  }
  fs.renameSync(src, dest);
  console.log(`   📦 ${rel(src)} → ${rel(dest)}`);
}

function main() {
  if (!fs.existsSync(DRIVE_DOCS)) {
    console.error(`❌ Không tìm thấy ${rel(DRIVE_DOCS)}. Chạy sync-drive trước.`);
    process.exit(1);
  }

  const versions = listPrdVersions(DRIVE_DOCS);

  if (versions.length === 0) {
    console.log('ℹ️  Không có file PRD nào theo convention PRD_v{N}.pdf — bỏ qua.');
    return;
  }

  const current = versions[versions.length - 1];
  const older = versions.slice(0, -1);

  console.log(`📄 PRD current: ${current.name} (v${current.version})`);

  if (older.length === 0) {
    console.log('✅ Chỉ có 1 version — không cần archive.');
  } else {
    if (!DRY_RUN) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    console.log(`🗂️  Archiving ${older.length} bản cũ vào ${rel(ARCHIVE_DIR)}/`);

    for (const v of older) {
      // PDF gốc
      move(path.join(DRIVE_DOCS, v.name), path.join(ARCHIVE_DIR, v.name));

      // File parsed tương ứng (nếu có): parsed/PRD_v{N}.md
      const parsedName = v.name.replace(/\.pdf$/i, '.md');
      const parsedSrc = path.join(PARSED_DIR, parsedName);
      if (fs.existsSync(parsedSrc)) {
        move(parsedSrc, path.join(ARCHIVE_DIR, parsedName));
      }
    }
  }

  // Ghi con trỏ "current" để các bước sau / diffing engine xác định bản hiện hành.
  if (DRY_RUN) {
    console.log(`   [dry-run] write ${rel(CURRENT_PTR)} = ${current.name}`);
  } else {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    fs.writeFileSync(CURRENT_PTR, `${current.name}\n`, 'utf8');
  }

  console.log('✅ Archive PRD complete.');
}

main();
