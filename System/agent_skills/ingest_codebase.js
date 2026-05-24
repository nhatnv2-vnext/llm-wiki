#!/usr/bin/env node
/**
 * ingest_codebase.js — Entry point cho quy trình "Code → Wiki".
 *
 * ⚠️ Cho codebase Node.js / FE (Next.js, NestJS, Vue, monorepo):
 *    BẮT BUỘC dùng ts-morph (xem CLAUDE.md §2.1) cho custom AST fine-grained.
 *    Code-graph overview dùng CodeGraph (`npm run code-graph`), không cần chỉnh script này.
 *
 * Cài đặt:
 *   cd "System" && npm install ts-morph
 *
 * Theo CLAUDE.md §2:
 *   1. Quét 01_Raw/codebase/
 *   2. Đối chiếu 01_Raw/drive_docs/
 *   3. Sinh / cập nhật 02_Wiki/
 *   4. Log conflict
 */

const fs = require('node:fs');
const path = require('node:path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const RAW_CODE = path.join(VAULT_ROOT, '01_Raw', 'codebase');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');

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
      file: path.relative(VAULT_ROOT, sf.getFilePath()),
      name: c.getName(),
      decorators: c.getDecorators().map((d) => d.getName()),
    })));

    results.push({ tsconfig: path.relative(VAULT_ROOT, tsconfig), fileCount: sourceFiles.length, classCount: classes.length, classes });
  }
  return { results };
}

async function main() {
  console.log('🚀 Ingest pipeline (ts-morph based)\n');

  if (!fs.existsSync(RAW_CODE)) {
    console.error(`❌ Không tìm thấy ${RAW_CODE}`);
    process.exit(1);
  }

  const subprojects = fs.readdirSync(RAW_CODE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(RAW_CODE, d.name));

  if (subprojects.length === 0) {
    console.log('📭 Chưa có project nào được mount. Dùng git submodule add ... để mount code.');
    return;
  }

  for (const proj of subprojects) {
    console.log(`📦 Project: ${path.relative(VAULT_ROOT, proj)}`);
    const mono = detectMonorepo(proj);
    if (mono) console.log(`   → Monorepo (${mono.tool}) — ts-morph sẽ tôn trọng tsconfig per-package`);

    const result = await ingestProject(proj);
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
  console.log('  - Map NestJS @Controller/@Module → 02_API_Specs/');
  console.log('  - Map TypeORM/Prisma entities → 03_Database/');
  console.log('  - Diff với PRD trong 01_Raw/drive_docs/ → 04_Tasks_&_Logs/Conflict_Reports.md');
}

main().catch((err) => { console.error(err); process.exit(1); });
