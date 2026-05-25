#!/usr/bin/env node
/**
 * ingest_codebase.js — Entry point cho quy trình "Code → Wiki" theo plan-review pattern.
 *
 * 2 mode:
 *   node ingest_codebase.js plan                     → sinh plan markdown (KHÔNG ghi wiki)
 *   node ingest_codebase.js apply <plan-file> [--force] → đọc plan đã approve, ghi wiki
 *
 * Triết lý: LLM-driven write phải qua plan → human approve → apply.
 * Plan file đặt ở 02_Wiki/04_Tasks_&_Logs/Ingest_Plans/<YYYY-MM-DD>_<slug>.md.
 *
 * ⚠️ Cho codebase Node/Angular: dùng ts-morph cho fine-grained AST.
 * Code-graph overview dùng CodeGraph (`npm run code-graph`), không cần chỉnh script này.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  VAULT_ROOT,
  PLAN_DIR,
  loadPlan,
  validatePlanForApply,
  appendAppliedMetadata,
  snapshotSources,
  currentGitUser,
  buildPlanMarkdown,
  planFilename,
} = require('./ingest_plan_review.js');

const RAW_CODE = path.join(VAULT_ROOT, '01_Raw', 'codebase');
const WIKI = path.join(VAULT_ROOT, '02_Wiki');

// ─── Shared scan helpers (giữ từ version cũ) ─────────────────────────────────

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

function detectMonorepo(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.workspaces) return { tool: 'npm/yarn/pnpm-workspaces' };
  } catch {}
  if (fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) return { tool: 'pnpm' };
  if (fs.existsSync(path.join(root, 'turbo.json'))) return { tool: 'turborepo' };
  if (fs.existsSync(path.join(root, 'nx.json'))) return { tool: 'nx' };
  return null;
}

function scanProject(projectRoot) {
  let Project;
  try { ({ Project } = require('ts-morph')); }
  catch { return { skipped: true, reason: 'ts-morph missing' }; }

  const tsconfigs = findTsConfigs(projectRoot);
  if (tsconfigs.length === 0) return { skipped: true, reason: 'no tsconfig' };

  const controllers = [];
  for (const tsconfig of tsconfigs) {
    const project = new Project({ tsConfigFilePath: tsconfig, skipAddingFilesFromTsConfig: false });
    for (const sf of project.getSourceFiles()) {
      for (const cls of sf.getClasses()) {
        const decorators = cls.getDecorators().map((d) => d.getName());
        if (decorators.includes('Controller') || decorators.includes('Component')) {
          controllers.push({
            file: path.relative(VAULT_ROOT, sf.getFilePath()),
            name: cls.getName(),
            kind: decorators.includes('Controller') ? 'nest-controller' : 'angular-component',
          });
        }
      }
    }
  }
  return { controllers };
}

// ─── Plan generation ────────────────────────────────────────────────────────

function deriveWikiTarget(controller) {
  // Heuristic mapping: NestJS Controller → 02_API_Specs/<Name>_API.md
  //                    Angular Component → vẫn handle bởi /spec-screen, không tự tạo ở đây
  if (controller.kind !== 'nest-controller') return null;
  const baseName = (controller.name || 'Unknown').replace(/Controller$/, '');
  return `02_Wiki/02_API_Specs/${baseName}_API.md`;
}

function planAction(controller) {
  const target = deriveWikiTarget(controller);
  if (!target) return null;

  const absTarget = path.join(VAULT_ROOT, target);
  if (!fs.existsSync(absTarget)) {
    return {
      kind: 'CREATE',
      target,
      body: [
        `- **Reason:** New \`${controller.name}\` (\`${controller.file}\`) chưa có spec wiki.`,
        `- **Source:** \`${controller.file}\``,
        `- **Suggested template:** dùng pattern của \`02_Wiki/02_API_Specs/Auth_API.md\` (Contract → Source of truth → Business rule → Edge cases).`,
        '',
      ],
    };
  }

  // Has file → defer to UPDATE only if source mtime > wiki last_synced.
  // Stub: chỉ check mtime để giữ scope Day 1.1 hẹp. Real diff sẽ làm sau.
  try {
    const wikiMtime = fs.statSync(absTarget).mtime;
    const srcMtime = fs.statSync(path.join(VAULT_ROOT, controller.file)).mtime;
    if (srcMtime > wikiMtime) {
      return {
        kind: 'UPDATE',
        target,
        body: [
          `- **Reason:** Source \`${controller.file}\` (mtime ${srcMtime.toISOString()}) mới hơn wiki (\`${absTarget}\` mtime ${wikiMtime.toISOString()}).`,
          `- **Suggested merge:** giữ \"Business rule\" + \"Edge cases\" cũ, cập nhật section \"Contract\" theo source mới.`,
          '',
        ],
      };
    }
  } catch {}

  return {
    kind: 'SKIP',
    target,
    body: [`- No change detected.`, ''],
  };
}

async function runPlan({ projectFilter }) {
  if (!fs.existsSync(RAW_CODE)) {
    console.error(`❌ ${RAW_CODE} not found`);
    process.exit(1);
  }

  const subprojects = fs.readdirSync(RAW_CODE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => !projectFilter || d.name === projectFilter)
    .map((d) => ({ name: d.name, abs: path.join(RAW_CODE, d.name), rel: `01_Raw/codebase/${d.name}` }));

  if (subprojects.length === 0) {
    console.log('📭 No project found.');
    return;
  }

  const allActions = [];
  for (const proj of subprojects) {
    console.log(`📦 Scanning ${proj.name}…`);
    const mono = detectMonorepo(proj.abs);
    if (mono) console.log(`   monorepo: ${mono.tool}`);
    const result = scanProject(proj.abs);
    if (result.skipped) {
      console.log(`   ⏭  Skipped: ${result.reason}`);
      continue;
    }
    console.log(`   ${result.controllers.length} controller/component(s)`);
    for (const c of result.controllers) {
      const action = planAction(c);
      if (action) allActions.push(action);
    }
  }

  fs.mkdirSync(PLAN_DIR, { recursive: true });
  const title = `Ingest plan — ${new Date().toISOString().slice(0, 10)}` +
    (projectFilter ? ` (${projectFilter})` : ' (all projects)');
  const slug = projectFilter || 'all-projects';
  const filename = planFilename(slug);
  const planPath = path.join(PLAN_DIR, filename);

  const sourceSnapshot = snapshotSources(subprojects.map((p) => p.rel));
  const markdown = buildPlanMarkdown({ title, sourceSnapshot, actions: allActions });
  fs.writeFileSync(planPath, markdown);

  const relPlanPath = path.relative(VAULT_ROOT, planPath);
  console.log(`\n✅ Plan written: ${relPlanPath}`);
  console.log(`   ${allActions.filter(a => a.kind === 'CREATE').length} CREATE, ` +
              `${allActions.filter(a => a.kind === 'UPDATE').length} UPDATE, ` +
              `${allActions.filter(a => a.kind === 'SKIP').length} SKIP`);
  console.log(`\nNext steps:`);
  console.log(`   1. Mở plan trong Obsidian, review actions.`);
  console.log(`   2. Edit frontmatter: approved_by, approved_at.`);
  console.log(`   3. Chạy: npm --prefix System run ingest:apply ${relPlanPath}`);
}

// ─── Apply mode ─────────────────────────────────────────────────────────────

async function runApply({ planPath, force }) {
  if (!planPath) {
    console.error('❌ Usage: npm run ingest:apply <path-to-plan-file> [--force]');
    process.exit(1);
  }
  const absPlanPath = path.isAbsolute(planPath) ? planPath : path.join(VAULT_ROOT, planPath);

  const plan = loadPlan(absPlanPath);
  console.log(`📄 Loaded plan: ${path.relative(VAULT_ROOT, absPlanPath)}`);
  console.log(`   ${plan.actions.length} action(s), approved_by: ${plan.data.approved_by || 'null'}`);

  try {
    validatePlanForApply(plan, { force });
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  let createCount = 0, updateCount = 0, skipCount = 0;
  for (const action of plan.actions) {
    const absTarget = path.join(VAULT_ROOT, action.target);
    if (action.kind === 'SKIP') { skipCount++; continue; }

    if (action.kind === 'CREATE') {
      if (fs.existsSync(absTarget)) {
        console.warn(`   ⚠  CREATE: ${action.target} đã tồn tại, bỏ qua (race?).`);
        continue;
      }
      fs.mkdirSync(path.dirname(absTarget), { recursive: true });
      // Stub: ghi placeholder. Real impl sẽ render template + LLM merge ở vòng sau.
      fs.writeFileSync(absTarget, renderPlaceholder(action, plan));
      console.log(`   ✅ CREATE ${action.target}`);
      createCount++;
    } else if (action.kind === 'UPDATE') {
      // Stub: append một marker. Real impl sẽ LLM-merge.
      const existing = fs.readFileSync(absTarget, 'utf8');
      const updated = existing.replace(
        /(\nstatus:\s*)\w+/,
        `$1stale-needs-merge`
      );
      fs.writeFileSync(absTarget, updated);
      console.log(`   ✅ UPDATE ${action.target} (marked stale-needs-merge)`);
      updateCount++;
    }
  }

  appendAppliedMetadata(absPlanPath, { user: currentGitUser() });
  console.log(`\n✅ Applied: ${createCount} CREATE, ${updateCount} UPDATE, ${skipCount} SKIP`);
  console.log(`   Plan frontmatter updated: applied_at + applied_by`);
}

function renderPlaceholder(action, plan) {
  const title = path.basename(action.target, '.md').replace(/_/g, ' ');
  const today = new Date().toISOString().slice(0, 10);
  return [
    '---',
    `title: ${title}`,
    'type: api',
    'source:',
    ...action.body
      .filter((l) => /\*\*Source:\*\*/.test(l))
      .map((l) => `  - ${l.match(/`([^`]+)`/)?.[1] || ''}`),
    'status: draft',
    `last_synced: ${today}`,
    'tags:',
    '  - api',
    '  - generated',
    '---',
    '',
    `# ${title}`,
    '',
    '> ⚠️ File này được sinh tự động bởi `ingest:apply`.',
    `> Nguồn plan: \`${path.relative(VAULT_ROOT, plan.path)}\``,
    `> Approved by: ${plan.data.approved_by}`,
    '> Cần human edit để hoàn thiện các section Business rule + Edge cases.',
    '',
    '## Contract',
    '',
    '> TODO: liệt kê endpoint từ source code.',
    '',
    '## Source of truth',
    '',
    ...action.body,
    '',
    '## Business rule',
    '',
    '> TODO: human fill.',
    '',
    '## Edge cases & error codes',
    '',
    '> TODO: human fill.',
    '',
    '## Liên kết',
    '- [[Index]]',
    '',
  ].join('\n');
}

// ─── CLI dispatch ───────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv[0] || 'plan';
  const rest = argv.slice(1);

  if (mode === 'plan') {
    const projectFilter = rest.find((a) => !a.startsWith('--'));
    await runPlan({ projectFilter });
  } else if (mode === 'apply') {
    const planPath = rest.find((a) => !a.startsWith('--'));
    const force = rest.includes('--force');
    await runApply({ planPath, force });
  } else {
    console.error(`❌ Unknown mode: ${mode}. Use 'plan' or 'apply'.`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
