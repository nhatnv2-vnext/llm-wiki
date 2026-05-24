#!/usr/bin/env node
/**
 * generate_mermaid.js — Sinh sơ đồ Mermaid từ AST của codebase.
 *
 * Input:  01_Raw/codebase/
 * Output: 02_Wiki/01_Architecture/*.md (chỉ phần Mermaid block, không ghi đè frontmatter)
 *
 * Đây là stub. Khi tích hợp đầy đủ, thay phần TODO bằng AST walker
 * (ts-morph cho NestJS/Next, hoặc query CodeGraph qua `codegraph callers/callees --json`).
 */

const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const CODEBASE = path.join(VAULT_ROOT, '01_Raw', 'codebase');
const ARCH_OUT = path.join(VAULT_ROOT, '02_Wiki', '01_Architecture');

function listServices(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function buildOverviewDiagram(services) {
  const lines = ['```mermaid', 'graph TD'];
  lines.push('  User([👤 User])');
  for (const svc of services) {
    const id = svc.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${id}["${svc}"]`);
    lines.push(`  User --> ${id}`);
  }
  lines.push('```');
  return lines.join('\n');
}

function main() {
  const services = listServices(CODEBASE);
  console.log(`📦 Found ${services.length} service(s):`, services);

  const diagram = buildOverviewDiagram(services);
  const outFile = path.join(ARCH_OUT, 'System_Overview.md');

  // TODO: parse AST của từng service để vẽ chi tiết hơn (handler → service → repo → DB).
  console.log(`✍️  Would write diagram to: ${outFile}`);
  console.log('--- preview ---');
  console.log(diagram);
}

main();
