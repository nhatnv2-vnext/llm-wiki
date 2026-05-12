#!/usr/bin/env node
/**
 * build_vault_index.js — Sinh Vault_Index.json cho RAG.
 *
 * Một entry per .md trong 02_Wiki/ (trừ _Templates, 05_Code_Graph).
 * Bao gồm: path, title, type, tags, status, last_synced, headings (H2/H3), wikilinks ra ngoài.
 *
 * Output: 02_Wiki/00_Dashboard/Vault_Index.json
 * Đã được .gitignore.
 */
const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');
const OUT = path.join(WIKI, '00_Dashboard', 'Vault_Index.json');

const SKIP = ['_Templates', '05_Code_Graph'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.includes(entry.name)) continue;
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!kv) continue;
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    } else if (val === '') {
      val = null;
    }
    fm[kv[1]] = val;
  }
  return fm;
}

function extractHeadings(text) {
  return [...text.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim());
}

function extractLinks(text) {
  const cleaned = text.replace(/```[\s\S]*?```/g, '');
  return [...cleaned.matchAll(/\[\[([^\]|#]+)/g)]
    .map((m) => m[1].trim())
    .filter((t) => !/^<.+>$/.test(t));
}

const entries = walk(WIKI).map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  return {
    path: path.relative(VAULT_ROOT, file),
    basename: path.basename(file, '.md'),
    title: fm.title || path.basename(file, '.md'),
    type: fm.type || null,
    tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
    status: fm.status || null,
    last_synced: fm.last_synced || null,
    headings: extractHeadings(text),
    links: extractLinks(text),
    size: text.length,
  };
});

fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), count: entries.length, entries }, null, 2));
console.log(`📚 Vault index written: ${path.relative(VAULT_ROOT, OUT)} (${entries.length} entries)`);
