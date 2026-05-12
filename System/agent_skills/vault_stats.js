#!/usr/bin/env node
/**
 * vault_stats.js — Đếm thống kê vault và cập nhật bảng "Vault Stats" trong Index.md.
 *
 * Đếm:
 *   - Wiki notes (trừ _Templates, 05_Code_Graph)
 *   - Code-graph SKILL.md
 *   - Wikilinks
 *   - API endpoints (heading bảng `| Method | Path |` trong 02_API_Specs)
 *   - Prisma models (đếm `^model ` trong schema.prisma)
 *
 * Cập nhật Index.md giữa marker:
 *   <!-- VAULT_STATS:START --> ... <!-- VAULT_STATS:END -->
 */
const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');
const CODEBASE = path.join(VAULT_ROOT, '01_Raw', 'codebase');
const INDEX_MD = path.join(WIKI, '00_Dashboard', 'Index.md');

function walk(dir, pred = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, pred));
    else if (entry.isFile() && pred(full)) out.push(full);
  }
  return out;
}

const wikiFiles = walk(WIKI, (f) =>
  f.endsWith('.md') && !f.includes('/_Templates/') && !f.includes('/05_Code_Graph/'),
);
const skillFiles = walk(path.join(WIKI, '05_Code_Graph'), (f) => f.endsWith('SKILL.md'));

let wikilinkCount = 0;
for (const f of wikiFiles) {
  const txt = fs.readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
  const m = txt.match(/\[\[[^\]]+\]\]/g);
  if (m) wikilinkCount += m.length;
}

// API endpoints: heading bảng có cột Method + Path
const apiFiles = wikiFiles.filter((f) => f.includes('/02_API_Specs/'));
let endpointCount = 0;
for (const f of apiFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  // Đếm dòng bảng có pattern `| GET/POST/... | /path |`
  const m = txt.match(/^\|\s*`?(GET|POST|PUT|PATCH|DELETE)`?\s*\|/gm);
  if (m) endpointCount += m.length;
}

// Prisma model count (best-effort: tìm mọi schema.prisma trong codebase)
const prismaFiles = walk(CODEBASE, (f) => f.endsWith('schema.prisma'));
let modelCount = 0;
for (const f of prismaFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  const m = txt.match(/^model\s+\w+/gm);
  if (m) modelCount += m.length;
}

const today = new Date().toISOString().slice(0, 10);

const table = [
  `<!-- VAULT_STATS:START — auto-generated, do not edit by hand. Run \`npm run stats\`. -->`,
  ``,
  `| Metric | Count |`,
  `|--------|-------|`,
  `| Wiki notes | **${wikiFiles.length}** |`,
  `| Wikilinks | **${wikilinkCount}** |`,
  `| Code-graph skills | **${skillFiles.length}** |`,
  `| API endpoints documented | **${endpointCount}** |`,
  `| Prisma models | **${modelCount}** |`,
  `| Last updated | ${today} |`,
  ``,
  `<!-- VAULT_STATS:END -->`,
].join('\n');

const idx = fs.readFileSync(INDEX_MD, 'utf8');
const re = /<!-- VAULT_STATS:START[\s\S]*?VAULT_STATS:END -->/;
let next;
if (re.test(idx)) {
  next = idx.replace(re, table);
} else {
  // Chèn ngay sau bảng "Trạng thái sync" — tìm header
  const anchor = '## 🚀 Lệnh nhanh';
  if (idx.includes(anchor)) {
    next = idx.replace(anchor, `## 📊 Vault Stats\n\n${table}\n\n${anchor}`);
  } else {
    next = idx + '\n\n## 📊 Vault Stats\n\n' + table + '\n';
  }
}

fs.writeFileSync(INDEX_MD, next);
console.log('📊 Vault stats updated:');
console.log(`   wiki=${wikiFiles.length} links=${wikilinkCount} skills=${skillFiles.length} endpoints=${endpointCount} models=${modelCount}`);
