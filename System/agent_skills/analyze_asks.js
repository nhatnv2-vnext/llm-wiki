#!/usr/bin/env node
/**
 * analyze_asks.js — Aggregate Ask_Logs/<YYYY-MM>.jsonl thành markdown report.
 *
 * Usage:
 *   node analyze_asks.js              # tháng hiện tại
 *   node analyze_asks.js 2026-05      # chỉ định tháng
 *
 * Output: 02_Wiki/04_Tasks_&_Logs/Ask_Reports/<YYYY-MM>.md
 */

const fs = require('node:fs');
const path = require('node:path');

const VAULT = path.resolve(__dirname, '..', '..');
const LOGS = path.join(VAULT, '02_Wiki/04_Tasks_&_Logs/Ask_Logs');
const REPORTS = path.join(VAULT, '02_Wiki/04_Tasks_&_Logs/Ask_Reports');

function loadEntries(month) {
  const file = path.join(LOGS, `${month}.jsonl`);
  if (!fs.existsSync(file)) {
    console.error(`❌ No log file: ${path.relative(VAULT, file)}`);
    console.error(`   Hint: chạy /ask-vault vài lần để sinh log, hoặc kiểm tra tháng truyền vào.`);
    process.exit(1);
  }
  const entries = [];
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, idx) => {
      if (!line.trim()) return;
      try {
        entries.push(JSON.parse(line));
      } catch {
        console.warn(`⚠️  skip malformed line ${idx + 1}`);
      }
    });
  return { file, entries };
}

function aggregate(entries) {
  const byUser = new Map();
  const gaps = [];
  const gapRe = /chưa có|không tìm thấy|không có trong vault|wiki chưa/i;
  for (const e of entries) {
    byUser.set(e.user, (byUser.get(e.user) || 0) + 1);
    if (gapRe.test(e.answer_summary || '')) gaps.push(e);
  }
  return { total: entries.length, byUser, gaps };
}

function render({ month, sourceFile, total, byUser, gaps, entries }) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('---');
  out.push(`title: Ask Report — ${month}`);
  out.push('type: log');
  out.push('source:');
  out.push(`  - ${path.relative(VAULT, sourceFile)}`);
  out.push('status: draft');
  out.push(`last_synced: ${today}`);
  out.push('tags:');
  out.push('  - ask-report');
  out.push('  - telemetry');
  out.push('---');
  out.push('');
  out.push(`# Ask Report — ${month}`);
  out.push('');
  out.push(`> Auto-generated bởi \`npm run report:asks\`. Nguồn: \`${path.relative(VAULT, sourceFile)}\`.`);
  out.push('');
  out.push(`**Tổng câu hỏi:** ${total}`);
  out.push(`**Số user:** ${byUser.size}`);
  out.push(`**Gap flag (wiki chưa có):** ${gaps.length}`);
  out.push('');

  out.push('## Phân bổ theo user');
  out.push('');
  if (byUser.size === 0) {
    out.push('_(không có entry)_');
  } else {
    out.push('| User | Số câu |');
    out.push('|------|--------|');
    [...byUser.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([u, n]) => out.push(`| \`${u}\` | ${n} |`));
  }
  out.push('');

  if (gaps.length > 0) {
    out.push('## ⚠️ Gap — câu hỏi wiki không trả lời được');
    out.push('');
    out.push('Ưu tiên viết wiki cho các topic này:');
    out.push('');
    gaps.forEach((g) => {
      out.push(`- **${g.user}** (${g.ts}): ${escapeMd(g.question)}`);
      if (g.answer_summary) out.push(`  > _${escapeMd(g.answer_summary)}_`);
    });
    out.push('');
  }

  out.push('## Tất cả câu hỏi (timeline, mới nhất trước)');
  out.push('');
  if (entries.length === 0) {
    out.push('_(không có entry)_');
  } else {
    entries
      .slice()
      .reverse()
      .forEach((e) => {
        out.push(`- \`${e.ts}\` **${e.user}**: ${escapeMd(e.question)}`);
        if (e.answer_summary) out.push(`  > ${escapeMd(e.answer_summary)}`);
      });
  }
  out.push('');

  out.push('## Liên kết');
  out.push('- [[Index]]');
  out.push('- [[../Ask_Logs/README|Ask_Logs index]]');
  out.push('');

  return out.join('\n');
}

function escapeMd(s) {
  if (!s) return '';
  // Tránh phá format markdown khi user paste backtick / pipe
  return String(s).replace(/\|/g, '\\|').replace(/`/g, "'");
}

function main() {
  const month = process.argv[2] || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error(`❌ Invalid month: ${month}. Expect YYYY-MM (vd 2026-05).`);
    process.exit(1);
  }

  const { file: sourceFile, entries } = loadEntries(month);
  const agg = aggregate(entries);
  const md = render({ month, sourceFile, ...agg, entries });

  fs.mkdirSync(REPORTS, { recursive: true });
  const out = path.join(REPORTS, `${month}.md`);
  fs.writeFileSync(out, md);
  console.log(`✅ Wrote ${path.relative(VAULT, out)}`);
  console.log(`   ${agg.total} entries, ${agg.byUser.size} user(s), ${agg.gaps.length} gap(s)`);
}

main();
