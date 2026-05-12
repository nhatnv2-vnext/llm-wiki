#!/usr/bin/env node
/**
 * audit_links.js — Kiểm tra wikilink trong 02_Wiki/.
 *
 * Báo cáo:
 *   - Broken wikilinks: [[Target]] mà không tìm thấy file `Target.md` trong vault.
 *   - Orphan notes: file .md không có inbound link (trừ Index.md, README.md, file trong _Templates / 05_Code_Graph).
 *
 * Exit code:
 *   0 nếu sạch (vẫn list orphan như warning)
 *   1 nếu có broken link
 */
const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');

const SKIP_DIRS = ['_Templates', '05_Code_Graph'];
const ROOT_NOTES = new Set(['Index', 'README']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(WIKI);
const basenameSet = new Set(files.map((f) => path.basename(f, '.md')));

// Nhận diện thêm tất cả .md trong các SKIP_DIRS (vẫn cho phép link tới chúng).
function addExtra(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) addExtra(full);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      basenameSet.add(path.basename(entry.name, '.md'));
    }
  }
}
for (const d of SKIP_DIRS) addExtra(path.join(WIKI, d));

const inbound = new Map(files.map((f) => [path.basename(f, '.md'), 0]));
const broken = [];

const WIKILINK_RE = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

for (const file of files) {
  const text = stripCodeBlocks(fs.readFileSync(file, 'utf8'));
  let m;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    const target = m[1].trim();
    // Bỏ qua placeholder kiểu <...>
    if (/^<.+>$/.test(target)) continue;
    // Tên có thể chứa path: "05_Code_Graph/README" — lấy basename
    const base = path.basename(target);
    if (basenameSet.has(base)) {
      inbound.set(base, (inbound.get(base) || 0) + 1);
    } else {
      broken.push({ file: path.relative(VAULT_ROOT, file), target });
    }
  }
}

const orphans = [];
for (const [name, count] of inbound) {
  if (count > 0) continue;
  if (ROOT_NOTES.has(name)) continue;
  orphans.push(name);
}

console.log(`🔗 Audit wikilinks in: ${path.relative(VAULT_ROOT, WIKI)}`);
console.log(`   files: ${files.length}`);
console.log(`   inbound counted: ${[...inbound.values()].reduce((a, b) => a + b, 0)}`);

if (broken.length) {
  console.log(`\n❌ Broken links (${broken.length}):`);
  for (const b of broken) console.log(`   ${b.file}  →  [[${b.target}]]`);
} else {
  console.log('\n✅ No broken wikilinks.');
}

if (orphans.length) {
  console.log(`\n⚠️  Orphan notes (${orphans.length}) — không file nào link tới:`);
  for (const o of orphans.sort()) console.log(`   ${o}.md`);
} else {
  console.log('\n✅ No orphan notes.');
}

process.exit(broken.length ? 1 : 0);
