/**
 * ingest_plan_review.js — Shared module cho plan-review pipeline.
 *
 * Mọi LLM-driven write trong vault phải qua: plan → human approve → apply.
 * Module này cung cấp parse/validate/update plan file Markdown.
 *
 * Plan format: frontmatter YAML + section "## Actions" với heading
 * "### CREATE: <path>", "### UPDATE: <path>", "### SKIP: <path>".
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const matter = require('gray-matter');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const PLAN_DIR = path.join(VAULT_ROOT, '02_Wiki', '04_Tasks_&_Logs', 'Ingest_Plans');

/** Đọc plan file → { data: frontmatter, content, actions: [{kind, target, body}] } */
function loadPlan(planPath) {
  if (!fs.existsSync(planPath)) {
    throw new Error(`Plan file not found: ${planPath}`);
  }
  const raw = fs.readFileSync(planPath, 'utf8');
  const parsed = matter(raw);

  // Parse actions từ markdown body
  const actions = [];
  const actionRe = /^###\s+(CREATE|UPDATE|SKIP):\s+`?([^`\n]+?)`?\s*$/gm;
  const lines = parsed.content.split('\n');
  let current = null;
  for (const line of lines) {
    const m = line.match(/^###\s+(CREATE|UPDATE|SKIP):\s+`?([^`\n]+?)`?\s*$/);
    if (m) {
      if (current) actions.push(current);
      current = { kind: m[1], target: m[2].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) actions.push(current);

  return { data: parsed.data, content: parsed.content, actions, path: planPath };
}

/** Validate plan đủ điều kiện apply, throw nếu không. */
function validatePlanForApply(plan, { force = false } = {}) {
  const { data, path: planPath } = plan;

  if (!data.approved_by || data.approved_by === 'null') {
    throw new Error(
      `Plan not approved (approved_by is null).\n` +
      `→ Edit ${path.relative(VAULT_ROOT, planPath)} frontmatter, set:\n` +
      `   approved_by: <your-github-handle>\n` +
      `   approved_at: ${new Date().toISOString()}`
    );
  }
  if (!data.approved_at || data.approved_at === 'null') {
    throw new Error(`Plan missing approved_at timestamp.`);
  }
  if (data.applied_at && data.applied_at !== 'null') {
    throw new Error(
      `Plan already applied at ${data.applied_at} by ${data.applied_by || 'unknown'}.\n` +
      `→ Re-apply not allowed. Copy plan and re-generate if needed.`
    );
  }
  if (data.status === 'rejected') {
    throw new Error(`Plan was rejected. Apply refused.`);
  }

  // Stale source guard
  if (!force && Array.isArray(data.source_snapshot)) {
    const drift = checkSourceDrift(data.source_snapshot);
    if (drift.length > 0) {
      throw new Error(
        `Source code drifted since plan was generated:\n` +
        drift.map((d) => `  - ${d.path}: planned ${d.planned} → current ${d.current}`).join('\n') +
        `\n→ Re-generate plan, or pass --force to override.`
      );
    }
  }
}

/** So sánh source_snapshot vs current git SHA của từng submodule */
function checkSourceDrift(snapshot) {
  const drift = [];
  for (const entry of snapshot) {
    // Format: "01_Raw/codebase/<name> @ <sha>"
    const m = String(entry).match(/^(\S+)\s*@\s*(\S+)$/);
    if (!m) continue;
    const [, relPath, plannedSha] = m;
    const absPath = path.join(VAULT_ROOT, relPath);
    if (!fs.existsSync(absPath)) continue;
    try {
      const currentSha = execSync('git rev-parse HEAD', { cwd: absPath, encoding: 'utf8' }).trim();
      if (currentSha !== plannedSha) {
        drift.push({ path: relPath, planned: plannedSha, current: currentSha });
      }
    } catch {
      // not a git repo, skip
    }
  }
  return drift;
}

/** Lấy current git SHA cho danh sách submodule path */
function snapshotSources(relPaths) {
  return relPaths.map((rel) => {
    const abs = path.join(VAULT_ROOT, rel);
    try {
      const sha = execSync('git rev-parse HEAD', { cwd: abs, encoding: 'utf8' }).trim();
      return `${rel} @ ${sha}`;
    } catch {
      return `${rel} @ unknown`;
    }
  });
}

/** Append applied metadata vào plan frontmatter */
function appendAppliedMetadata(planPath, { user }) {
  const raw = fs.readFileSync(planPath, 'utf8');
  const parsed = matter(raw);
  parsed.data.applied_at = new Date().toISOString();
  parsed.data.applied_by = user;
  parsed.data.status = 'applied';
  const updated = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(planPath, updated);
}

/** Lấy user identifier từ git config */
function currentGitUser() {
  try {
    const email = execSync('git config user.email', { cwd: VAULT_ROOT, encoding: 'utf8' }).trim();
    return email || process.env.USER || 'unknown';
  } catch {
    return process.env.USER || 'unknown';
  }
}

/** Build plan markdown từ template + actions */
function buildPlanMarkdown({ title, sourceSnapshot, actions, summary }) {
  const now = new Date().toISOString();
  const counts = {
    CREATE: actions.filter((a) => a.kind === 'CREATE').length,
    UPDATE: actions.filter((a) => a.kind === 'UPDATE').length,
    SKIP: actions.filter((a) => a.kind === 'SKIP').length,
  };

  const data = {
    title,
    type: 'ingest-plan',
    source: sourceSnapshot.map((s) => String(s).split(' @ ')[0]),
    status: 'pending_review',
    last_synced: now.slice(0, 10),
    generated_at: now,
    generated_by: `ingest:plan run by ${process.env.USER || 'unknown'}`,
    source_snapshot: sourceSnapshot,
    approved_by: null,
    approved_at: null,
    applied_at: null,
    applied_by: null,
    tags: ['ingest-plan'],
  };

  const body = [
    `# ${title}`,
    '',
    '## Summary',
    `- ${counts.CREATE} page sẽ CREATE`,
    `- ${counts.UPDATE} page sẽ UPDATE`,
    `- ${counts.SKIP} page SKIP (no change)`,
    '',
    summary || '',
    '',
    '## Actions',
    '',
    ...actions.map((a) => [
      `### ${a.kind}: \`${a.target}\``,
      ...(a.body || []),
      '',
    ].join('\n')),
    '## Reviewer checklist',
    '',
    '- [ ] Mọi CREATE đều có source rõ ràng.',
    '- [ ] Mọi UPDATE giữ được business rule cũ (không bị LLM ghi đè).',
    '- [ ] Không có file SKIP nào thực ra cần update.',
    '',
    '## Approve',
    '',
    'Để approve, edit frontmatter:',
    '```yaml',
    'approved_by: <your-github-handle>',
    `approved_at: ${now}`,
    '```',
    'Rồi commit + chạy `npm run ingest:apply <path-to-this-file>`.',
    '',
  ].join('\n');

  return matter.stringify(body, data);
}

/** Tên file plan theo convention <YYYY-MM-DD>_<slug>.md, tránh collision */
function planFilename(slug) {
  const date = new Date().toISOString().slice(0, 10);
  const baseSlug = (slug || 'auto')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  let candidate = `${date}_${baseSlug}.md`;
  let i = 1;
  while (fs.existsSync(path.join(PLAN_DIR, candidate))) {
    candidate = `${date}_${baseSlug}-${i++}.md`;
  }
  return candidate;
}

module.exports = {
  VAULT_ROOT,
  PLAN_DIR,
  loadPlan,
  validatePlanForApply,
  appendAppliedMetadata,
  snapshotSources,
  checkSourceDrift,
  currentGitUser,
  buildPlanMarkdown,
  planFilename,
};
