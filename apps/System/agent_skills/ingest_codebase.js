#!/usr/bin/env node
/**
 * ingest_codebase.js — Entry point cho quy trình "Code → Wiki".
 *
 * ĐỌC ĐƯỜNG DẪN TỪ: 01_Raw/codebase/projects.json
 * Mỗi entry phải có: name, local_path, type, active.
 * Script dùng local_path để truy cập source code, KHÔNG cần mount code vào vault.
 *
 * ⚠️ Cho codebase Node.js / FE (Next.js, NestJS, Vue, monorepo):
 *    BẮT BUỘC dùng ts-morph (xem CLAUDE.md §2.1) cho custom AST fine-grained.
 *    Code-graph overview dùng CodeGraph (`npm run code-graph`), không cần chỉnh script này.
 *
 * Cài đặt:
 *   cd "System" && npm install ts-morph
 *
 * Theo CLAUDE.md §2:
 *   1. Đọc projects.json lấy local_path
 *   2. Quét source code tại local_path
 *   3. Đối chiếu 01_Raw/drive_docs/
 *   4. Đọc 01_Raw/database/schemas.json cho DB schema context
 *   5. Sinh / cập nhật 02_Wiki/
 *   6. Log conflict
 */

const fs = require('node:fs');
const path = require('node:path');

// Script ở apps/System/agent_skills -> lên 3 cấp tới gốc vault (nơi chứa 01_Raw, 02_Wiki).
const VAULT_ROOT = path.resolve(__dirname, '..', '..', '..');
const PROJECTS_JSON = path.join(VAULT_ROOT, '01_Raw', 'codebase', 'projects.json');
const SCHEMAS_JSON = path.join(VAULT_ROOT, '01_Raw', 'database', 'schemas.json');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');

/** Đọc và parse projects.json */
function loadProjects() {
  if (!fs.existsSync(PROJECTS_JSON)) {
    console.error(`❌ Không tìm thấy ${PROJECTS_JSON}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
  return data.projects.filter((p) => p.active !== false);
}

/** Đọc và parse schemas.json */
function loadSchemas() {
  if (!fs.existsSync(SCHEMAS_JSON)) {
    console.warn(`⚠️  Không tìm thấy ${SCHEMAS_JSON} — bỏ qua DB schema context.`);
    return [];
  }
  const data = JSON.parse(fs.readFileSync(SCHEMAS_JSON, 'utf8'));
  return data.schemas.filter((s) => s.active !== false);
}

/** Tìm mọi tsconfig.json (kể cả trong monorepo workspaces) */
function findTsConfigs(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === 'tsconfig.json') out.push(full);
    }
  }
  return out;
}

/** Phát hiện monorepo từ package.json gốc */
function detectMonorepo(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.workspaces) return { tool: 'npm/yarn/pnpm-workspaces', config: pkg.workspaces };
  if (fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) return { tool: 'pnpm', config: 'pnpm-workspace.yaml' };
  if (fs.existsSync(path.join(root, 'turbo.json'))) return { tool: 'turborepo', config: 'turbo.json' };
  if (fs.existsSync(path.join(root, 'nx.json'))) return { tool: 'nx', config: 'nx.json' };
  return null;
}

async function ingestProject(projectRoot) {
  // Lazy require để dry-run vẫn chạy được khi chưa cài ts-morph.
  let Project;
  try {
    ({ Project } = require('ts-morph'));
  } catch {
    console.warn(`⚠️  ts-morph chưa cài. Chạy: cd "System" && npm install ts-morph`);
    return { skipped: true, reason: 'ts-morph missing' };
  }

  const tsconfigs = findTsConfigs(projectRoot);
  if (tsconfigs.length === 0) {
    console.warn(`⚠️  Không có tsconfig.json trong ${projectRoot}`);
    return { skipped: true, reason: 'no tsconfig' };
  }

  const results = [];
  for (const tsconfig of tsconfigs) {
    // ts-morph tự đọc `compilerOptions.paths` từ tsconfig → resolve alias @/ chính xác.
    const project = new Project({ tsConfigFilePath: tsconfig, skipAddingFilesFromTsConfig: false });
    const sourceFiles = project.getSourceFiles();

    const classes = sourceFiles.flatMap((sf) => sf.getClasses().map((c) => ({
      file: sf.getFilePath(),
      name: c.getName(),
      decorators: c.getDecorators().map((d) => d.getName()),
    })));

    results.push({ tsconfig, fileCount: sourceFiles.length, classCount: classes.length, classes });
  }
  return { results };
}

async function main() {
  console.log('🚀 Ingest pipeline (ts-morph based)\n');

  const projects = loadProjects();
  const schemas = loadSchemas();

  if (projects.length === 0) {
    console.log('📭 Chưa có project active nào trong projects.json.');
    console.log('   Thêm entry vào mảng "projects" với "active: true" và "local_path" trỏ tới source code.');
    return;
  }

  // Log DB schemas nếu có
  if (schemas.length > 0) {
    console.log(`📑 Database schemas: ${schemas.length} file(s)`);
    for (const s of schemas) {
      console.log(`   - ${s.name} (${s.type}): ${s.local_path}`);
    }
    console.log();
  }

  for (const proj of projects) {
    const projectRoot = proj.local_path;

    if (!fs.existsSync(projectRoot)) {
      console.log(`⚠️  local_path không tồn tại: ${projectRoot} (project: ${proj.name})`);
      console.log(`   ⏭  Skipped\n`);
      continue;
    }

    console.log(`📦 Project: ${proj.name} (${proj.type})`);
    console.log(`   local_path: ${projectRoot}`);

    const mono = detectMonorepo(projectRoot);
    if (mono) console.log(`   → Monorepo (${mono.tool}) — ts-morph sẽ tôn trọng tsconfig per-package`);

    const result = await ingestProject(projectRoot);
    if (result.skipped) {
      console.log(`   ⏭  Skipped: ${result.reason}\n`);
      continue;
    }
    for (const r of result.results) {
      console.log(`   tsconfig: ${r.tsconfig}`);
      console.log(`   files=${r.fileCount} classes=${r.classCount}`);
    }
    console.log();
  }

  console.log('TODO:');
  console.log('  - Map NestJS @Controller/@Module → 04_API_Specs/');
  console.log('  - Map TypeORM/Prisma entities → 05_Database/ (dùng schemas.json cho path)');
  console.log('  - Diff với PRD trong 01_Raw/drive_docs/ → 07_Tasks_&_Logs/Conflict_Reports.md');
}

main().catch((err) => { console.error(err); process.exit(1); });
