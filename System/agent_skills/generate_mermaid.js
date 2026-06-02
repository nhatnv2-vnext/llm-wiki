#!/usr/bin/env node
/**
 * generate_mermaid.js — Sinh sơ đồ Mermaid từ AST của codebase.
 *
 * ĐỌC ĐƯỜNG DẪN TỪ:
 *   - 01_Raw/codebase/projects.json — danh sách project + local_path
 *   - 01_Raw/database/schemas.json — danh sách DB schema file + local_path
 *
 * Output: 02_Wiki/03_Architecture/*.md (chỉ phần Mermaid block, không ghi đè frontmatter)
 *
 * Đây là stub. Khi tích hợp đầy đủ, thay phần TODO bằng AST walker
 * (ts-morph cho NestJS/Next, hoặc query CodeGraph qua `codegraph callers/callees --json`).
 */

const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const PROJECTS_JSON = path.join(VAULT_ROOT, '01_Raw', 'codebase', 'projects.json');
const SCHEMAS_JSON = path.join(VAULT_ROOT, '01_Raw', 'database', 'schemas.json');
const ARCH_OUT = path.join(VAULT_ROOT, '02_Wiki', '03_Architecture');

/** Đọc projects.json */
function loadProjects() {
  if (!fs.existsSync(PROJECTS_JSON)) {
    console.warn(`⚠️  Không tìm thấy ${PROJECTS_JSON}`);
    return [];
  }
  const data = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
  return data.projects.filter((p) => p.active !== false);
}

/** Đọc schemas.json */
function loadSchemas() {
  if (!fs.existsSync(SCHEMAS_JSON)) {
    console.warn(`⚠️  Không tìm thấy ${SCHEMAS_JSON}`);
    return [];
  }
  const data = JSON.parse(fs.readFileSync(SCHEMAS_JSON, 'utf8'));
  return data.schemas.filter((s) => s.active !== false);
}

function buildOverviewDiagram(projects, schemas) {
  const lines = ['```mermaid', 'graph TD'];
  lines.push('  User([👤 User])');

  for (const proj of projects) {
    const id = proj.name.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${id}["${proj.name} (${proj.type})"]`);
    lines.push(`  User --> ${id}`);
  }

  // Thêm DB nodes nếu có schemas
  for (const schema of schemas) {
    const dbId = schema.name.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${dbId}[("🗄 ${schema.name} (${schema.db_engine})")]`);
    // Link project → DB nếu có trường project
    if (schema.project) {
      const projId = schema.project.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${projId} --> ${dbId}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

function main() {
  const projects = loadProjects();
  const schemas = loadSchemas();

  console.log(`📦 Found ${projects.length} project(s):`, projects.map((p) => `${p.name} → ${p.local_path}`));
  console.log(`🗄  Found ${schemas.length} schema(s):`, schemas.map((s) => `${s.name} → ${s.local_path}`));

  const diagram = buildOverviewDiagram(projects, schemas);
  const outFile = path.join(ARCH_OUT, 'System_Overview.md');

  // TODO: parse AST của từng project (qua local_path) để vẽ chi tiết hơn (handler → service → repo → DB).
  // TODO: parse schema file (qua schemas.json local_path) để sinh ER diagram chi tiết.
  console.log(`✍️  Would write diagram to: ${outFile}`);
  console.log('--- preview ---');
  console.log(diagram);
}

main();
