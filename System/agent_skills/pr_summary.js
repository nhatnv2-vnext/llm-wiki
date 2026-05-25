/**
 * pr_summary.js — Bot post markdown comment lên PR diễn giải diff theo lăng kính vault.
 *
 * Invoked từ .github/workflows/wiki-ci.yml qua actions/github-script@v7:
 *   const script = require('./System/agent_skills/pr_summary.js');
 *   await script({ github, context, core });
 *
 * Idempotent: tìm comment cũ qua MARKER, update thay vì spam.
 */

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const MARKER = '<!-- vault-pr-summary-bot -->';

const ICON = {
  added: '🆕',
  modified: '✏️',
  removed: '🗑️',
  renamed: '↪️',
};

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request;
  if (!pr) {
    core.warning('No pull_request payload — skipping pr-summary');
    return;
  }

  // 1. Lấy danh sách file PR đụng vào (paginated)
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100,
  });

  // 2. Categorize
  const wikiFiles = files.filter((f) => f.filename.startsWith('02_Wiki/'));
  const systemFiles = files.filter((f) => f.filename.startsWith('System/'));
  const skillFiles = files.filter((f) => f.filename.startsWith('.claude/'));

  // 3. Detect ingest plans + screen drafts
  const planFiles = files.filter(
    (f) =>
      f.filename.startsWith('02_Wiki/04_Tasks_&_Logs/Ingest_Plans/') &&
      f.filename.endsWith('.md') &&
      !f.filename.endsWith('/README.md'),
  );
  const draftFiles = files.filter(
    (f) =>
      f.filename.startsWith('02_Wiki/06_Screen_Specs/_drafts/') &&
      f.filename.endsWith('.md') &&
      !f.filename.endsWith('.gitkeep'),
  );

  // 4. Parse frontmatter của plan + draft (chỉ với file còn tồn tại)
  const planStatus = planFiles
    .filter((f) => f.status !== 'removed')
    .map((f) => readFrontmatterSafe(f.filename));
  const draftStatus = draftFiles
    .filter((f) => f.status !== 'removed')
    .map((f) => readFrontmatterSafe(f.filename));

  // 5. Render markdown comment
  const body = renderComment({
    pr,
    wikiFiles,
    systemFiles,
    skillFiles,
    planStatus,
    draftStatus,
  });

  // 6. Find existing bot comment → update or create
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pr.number,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body && c.body.includes(MARKER));

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    core.info(`Updated existing summary comment #${existing.id}`);
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr.number,
      body,
    });
    core.info('Created new summary comment');
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFrontmatterSafe(relPath) {
  const result = { path: relPath, status: null, approved_by: null, applied_at: null, error: null };
  try {
    const abs = path.join(process.cwd(), relPath);
    if (!fs.existsSync(abs)) {
      // File ở head commit (checkout) — có thể là delete, hoặc actions/checkout không lấy.
      result.error = 'file not in workspace';
      return result;
    }
    const parsed = matter(fs.readFileSync(abs, 'utf8'));
    result.status = parsed.data.status || null;
    result.approved_by = parsed.data.approved_by || null;
    result.applied_at = parsed.data.applied_at || null;
  } catch (e) {
    result.error = String(e.message || e);
  }
  return result;
}

function fileLink(pr, filename, status) {
  const safe = filename.split('/').map(encodeURIComponent).join('/');
  if (status === 'removed') {
    return `\`${filename}\``;
  }
  return `[\`${filename}\`](https://github.com/${pr.base.repo.full_name}/blob/${pr.head.sha}/${safe})`;
}

function renderFileBullet(pr, f) {
  const icon = ICON[f.status] || '•';
  return `- ${icon} ${fileLink(pr, f.filename, f.status)}`;
}

function renderComment({ pr, wikiFiles, systemFiles, skillFiles, planStatus, draftStatus }) {
  const sections = [];

  sections.push(MARKER);
  sections.push('## 📋 Vault PR Summary');
  sections.push('');
  sections.push(`> Auto-generated. Branch \`${pr.head.ref}\` → \`${pr.base.ref}\`. Validate check trong tab **Checks**.`);
  sections.push('');

  // Counts header
  const counts = countByStatus([...wikiFiles, ...systemFiles, ...skillFiles]);
  if (counts.total > 0) {
    sections.push(`**Total files in vault scope:** ${counts.total} ` +
      `(${counts.added} 🆕 / ${counts.modified} ✏️ / ${counts.removed} 🗑️)`);
    sections.push('');
  }

  // Wiki section
  if (wikiFiles.length > 0) {
    sections.push(`### 📝 Wiki changes (${wikiFiles.length})`);
    sections.push('');
    for (const f of wikiFiles.slice(0, 30)) sections.push(renderFileBullet(pr, f));
    if (wikiFiles.length > 30) sections.push(`- _…và ${wikiFiles.length - 30} file khác_`);
    sections.push('');
  }

  // System / Skill section
  const sysAll = [...systemFiles, ...skillFiles];
  if (sysAll.length > 0) {
    sections.push(`### ⚙️ System / Skill changes (${sysAll.length})`);
    sections.push('');
    for (const f of sysAll.slice(0, 20)) sections.push(renderFileBullet(pr, f));
    if (sysAll.length > 20) sections.push(`- _…và ${sysAll.length - 20} file khác_`);
    sections.push('');
  }

  // Ingest plans
  if (planStatus.length > 0) {
    sections.push(`### 🧾 Ingest plans (${planStatus.length})`);
    sections.push('');
    sections.push('| Plan | Status | Approver | Applied? |');
    sections.push('|------|--------|----------|----------|');
    let hasWarning = false;
    for (const p of planStatus) {
      const statusBadge = badge(p.status);
      const approver = p.approved_by || '_none_';
      const applied = p.applied_at ? '✅' : '❌';
      if (p.error) {
        sections.push(`| \`${path.basename(p.path)}\` | _(${p.error})_ | — | — |`);
        continue;
      }
      if (!p.applied_at) hasWarning = true;
      sections.push(`| \`${path.basename(p.path)}\` | ${statusBadge} | ${approver} | ${applied} |`);
    }
    sections.push('');
    if (hasWarning) {
      sections.push('> ⚠️ **Action needed:** Plan chưa approved hoặc chưa apply. Set `approved_by` rồi chạy `npm run ingest:apply <plan>` trước khi merge.');
      sections.push('');
    }
  }

  // Screen drafts
  if (draftStatus.length > 0) {
    sections.push(`### 🎨 Screen drafts (${draftStatus.length})`);
    sections.push('');
    sections.push('| Draft | approved_by | applied? |');
    sections.push('|-------|-------------|----------|');
    let hasWarning = false;
    for (const d of draftStatus) {
      const approver = d.approved_by || '_none_';
      const applied = d.applied_at ? '✅' : '❌';
      if (d.error) {
        sections.push(`| \`${path.basename(d.path)}\` | _(${d.error})_ | — |`);
        continue;
      }
      if (!d.applied_at) hasWarning = true;
      sections.push(`| \`${path.basename(d.path)}\` | ${approver} | ${applied} |`);
    }
    sections.push('');
    if (hasWarning) {
      sections.push('> ⚠️ Draft chưa approved/applied. Edit frontmatter `approved_by` rồi gõ `/spec-screen apply <ID>`.');
      sections.push('');
    }
  }

  // Out-of-scope warning
  if (counts.total === 0) {
    sections.push('_Không có file nào trong scope vault (`02_Wiki/`, `System/`, `.claude/`) bị thay đổi._');
    sections.push('');
  }

  sections.push('---');
  sections.push('<sub>Bot này skip khi PR không đụng `02_Wiki/**` hoặc `System/**` (xem `.github/workflows/wiki-ci.yml`). Tắt bằng cách comment-out job `pr-summary`.</sub>');

  return sections.join('\n');
}

function countByStatus(files) {
  const out = { total: files.length, added: 0, modified: 0, removed: 0 };
  for (const f of files) {
    if (f.status === 'added') out.added++;
    else if (f.status === 'removed') out.removed++;
    else out.modified++;
  }
  return out;
}

function badge(status) {
  if (!status) return '_(no status)_';
  if (status === 'pending_review') return '⚠️ pending_review';
  if (status === 'approved') return '🟡 approved';
  if (status === 'applied') return '✅ applied';
  if (status === 'rejected') return '🚫 rejected';
  if (status === 'draft') return '📝 draft';
  return `\`${status}\``;
}
