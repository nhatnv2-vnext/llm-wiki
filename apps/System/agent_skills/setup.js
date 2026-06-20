#!/usr/bin/env node
/**
 * setup.js — Onboarding tương tác cho người mới clone vault về.
 *
 * Chạy: `npm run setup` (từ apps/System) hoặc `node agent_skills/setup.js`.
 *
 * 3 phần (chạy tuần tự, mỗi phần có thể bỏ qua):
 *   1. Doctor      — kiểm tra Node / pnpm / openssl + các biến env bắt buộc.
 *   2. .env.local  — tạo từ .env.example nếu thiếu; tự sinh SESSION_SECRET và
 *                    điền WIKI_ROOT_PATH đúng đường dẫn máy hiện tại.
 *   3. Add project — hỏi đường dẫn source, validate, ghi vào projects.json.
 *
 * Script KHÔNG gọi mạng, KHÔNG ghi đè giá trị env đã có. An toàn chạy lại
 * nhiều lần (idempotent).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { execSync } = require('node:child_process');

// Script ở apps/System/agent_skills → lên 3 cấp tới gốc vault.
const VAULT_ROOT = path.resolve(__dirname, '..', '..', '..');
const ENV_EXAMPLE = path.join(VAULT_ROOT, '.env.example');
const ENV_LOCAL = path.join(VAULT_ROOT, '.env.local');
const WIKI_DIR = path.join(VAULT_ROOT, '02_Wiki');
const PROJECTS_JSON = path.join(VAULT_ROOT, '01_Raw', 'codebase', 'projects.json');

// Biến env BẮT BUỘC để web app + RAG chạy.
const REQUIRED_ENV = ['GOOGLE_API_KEY', 'WIKI_ROOT_PATH', 'SESSION_SECRET', 'AUTH_USERS'];

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const ok = (s) => `${C.green}✓${C.reset} ${s}`;
const fail = (s) => `${C.red}✗${C.reset} ${s}`;
const warn = (s) => `${C.yellow}⚠${C.reset} ${s}`;
const head = (s) => `\n${C.bold}${C.cyan}${s}${C.reset}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Đọc input bằng async-iterator của readline thay vì rl.question — cách này xử
// lý EOF đúng đắn cả khi stdin là pipe (test/CI) lẫn TTY (gõ tay): khi hết input,
// iterator kết thúc và ask() trả '' thay vì treo vô hạn.
const lineIter = rl[Symbol.asyncIterator]();
const ask = async (q) => {
  process.stdout.write(q);
  const { value, done } = await lineIter.next();
  return done ? '' : value.trim();
};
const askYesNo = async (q, def = true) => {
  const hint = def ? '[Y/n]' : '[y/N]';
  const a = (await ask(`${q} ${hint} `)).toLowerCase();
  if (a === '') return def;
  return a === 'y' || a === 'yes';
};

/** Đọc .env.local thành object { KEY: value } (đơn giản, không hỗ trợ multiline). */
function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

/** Có lệnh CLI này trên PATH không? */
function hasCmd(cmd) {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

// ── Phần 1: Doctor ──────────────────────────────────────────────────────────
function runDoctor() {
  console.log(head('1. Kiểm tra môi trường (doctor)'));
  let allOk = true;

  // Node >= 20.
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) console.log(ok(`Node ${process.versions.node} (>= 20)`));
  else { console.log(fail(`Node ${process.versions.node} — cần >= 20`)); allOk = false; }

  // pnpm (monorepo dùng pnpm).
  if (hasCmd('pnpm')) console.log(ok('pnpm có trên PATH'));
  else { console.log(warn('Thiếu pnpm — cài: npm i -g pnpm@10')); allOk = false; }

  // openssl (để sinh SESSION_SECRET; có fallback crypto nếu thiếu).
  if (hasCmd('openssl')) console.log(ok('openssl có trên PATH'));
  else console.log(warn('Thiếu openssl — sẽ dùng crypto của Node thay thế'));

  // 02_Wiki tồn tại.
  if (fs.existsSync(WIKI_DIR)) console.log(ok('Thư mục 02_Wiki tồn tại'));
  else { console.log(fail('Không thấy 02_Wiki — chạy script sai thư mục?')); allOk = false; }

  // Các biến env bắt buộc.
  const env = parseEnv(ENV_LOCAL);
  if (!fs.existsSync(ENV_LOCAL)) {
    console.log(warn('Chưa có .env.local — sẽ tạo ở bước 2'));
    allOk = false;
  } else {
    for (const key of REQUIRED_ENV) {
      const v = env[key];
      // Coi là "chưa đặt" nếu trống hoặc còn giá trị placeholder mẫu.
      const placeholder =
        !v || /your-|absolute\/path|thay-bang|email@example|bcrypt-hash/.test(v);
      if (placeholder) { console.log(fail(`Env ${key} chưa đặt`)); allOk = false; }
      else console.log(ok(`Env ${key} đã đặt`));
    }
  }

  console.log(
    allOk
      ? `\n${ok('Môi trường sẵn sàng.')}`
      : `\n${warn('Còn thiếu cấu hình — tiếp tục các bước bên dưới để bổ sung.')}`,
  );
  return allOk;
}

// ── Phần 2: Tạo .env.local ──────────────────────────────────────────────────
async function setupEnv() {
  console.log(head('2. Tạo .env.local'));

  if (fs.existsSync(ENV_LOCAL)) {
    console.log(ok('.env.local đã tồn tại — bỏ qua tạo mới (không ghi đè).'));
    const env = parseEnv(ENV_LOCAL);
    const missing = REQUIRED_ENV.filter((k) => {
      const v = env[k];
      return !v || /your-|absolute\/path|thay-bang|email@example|bcrypt-hash/.test(v);
    });
    if (missing.length) {
      console.log(warn(`Cần điền tay các biến còn placeholder: ${missing.join(', ')}`));
      if (missing.includes('AUTH_USERS')) {
        console.log(
          C.dim +
            '   → sinh hash mật khẩu: cd apps/web && npm run hash-password -- \'matkhau\' email@x.com' +
            C.reset,
        );
      }
    }
    return;
  }

  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.log(fail('Không thấy .env.example để copy.'));
    return;
  }

  if (!(await askYesNo('Chưa có .env.local. Tạo từ .env.example?'))) {
    console.log(C.dim + '   bỏ qua.' + C.reset);
    return;
  }

  let content = fs.readFileSync(ENV_EXAMPLE, 'utf8');

  // Tự sinh SESSION_SECRET (32 byte base64).
  const secret = hasCmd('openssl')
    ? execSync('openssl rand -base64 32').toString().trim()
    : crypto.randomBytes(32).toString('base64');
  content = content.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret}`);

  // Điền WIKI_ROOT_PATH đúng đường dẫn máy hiện tại.
  content = content.replace(/^WIKI_ROOT_PATH=.*$/m, `WIKI_ROOT_PATH=${WIKI_DIR}`);

  fs.writeFileSync(ENV_LOCAL, content);
  console.log(ok('Đã tạo .env.local'));
  console.log(ok('SESSION_SECRET đã tự sinh'));
  console.log(ok(`WIKI_ROOT_PATH = ${WIKI_DIR}`));
  console.log(warn('Còn phải điền tay: GOOGLE_API_KEY và AUTH_USERS'));
  console.log(
    C.dim +
      '   → AUTH_USERS: cd apps/web && npm run hash-password -- \'matkhau\' email@x.com' +
      C.reset,
  );
}

// ── Phần 3: Thêm project ────────────────────────────────────────────────────
const VALID_TYPES = ['nestjs', 'angular', 'nextjs', 'nuxt', 'vue', 'python', 'go', 'other'];

function readProjects() {
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
  } catch {
    return null;
  }
}

async function addProject() {
  console.log(head('3. Thêm project cần tạo wiki'));

  if (!(await askYesNo('Thêm một project source ngay bây giờ?', false))) {
    console.log(
      C.dim + '   bỏ qua — sau này dùng skill /add-project <path> trong Claude Code.' + C.reset,
    );
    return;
  }

  const data = readProjects();
  if (!data || !Array.isArray(data.projects)) {
    console.log(fail('Không đọc được 01_Raw/codebase/projects.json — bỏ qua.'));
    return;
  }

  const rawPath = await ask('Đường dẫn tuyệt đối tới thư mục source: ');
  const localPath = path.resolve(rawPath.replace(/^~/, require('node:os').homedir()));

  if (!fs.existsSync(localPath) || !fs.statSync(localPath).isDirectory()) {
    console.log(fail(`Không tìm thấy thư mục: ${localPath}`));
    return;
  }
  if (data.projects.some((p) => path.resolve(p.local_path || '') === localPath)) {
    console.log(warn('Project với đường dẫn này đã có trong catalog — bỏ qua.'));
    return;
  }

  const defaultName = path.basename(localPath);
  const name = (await ask(`Tên project [${defaultName}]: `)) || defaultName;
  let type = (await ask(`Loại (${VALID_TYPES.join(' | ')}) [other]: `)) || 'other';
  if (!VALID_TYPES.includes(type)) {
    console.log(warn(`Loại "${type}" không trong danh sách — vẫn ghi nhưng nên kiểm tra lại.`));
  }
  const description = await ask('Mô tả ngắn (Enter để bỏ trống): ');

  data.projects.push({ name, local_path: localPath, type, description, active: true });
  fs.writeFileSync(PROJECTS_JSON, JSON.stringify(data, null, 2) + '\n');
  console.log(ok(`Đã thêm "${name}" vào projects.json`));

  // CodeGraph: build index AST trong chính thư mục source (tạo .codegraph/).
  // Đây là bước KHUYẾN NGHỊ — giúp skill /spec-* lần theo call graph chính xác
  // và bật MCP live query. Khác với `npm run code-graph` (sinh wiki markdown,
  // nặng hơn) — ở đây chỉ `codegraph init -i` trong source.
  await setupCodeGraph(localPath);

  console.log(head('Bước tiếp theo (trong Claude Code):'));
  console.log(`  ${C.cyan}/scan-project ${name}${C.reset}   — quét route/controller → catalog`);
  console.log(`  ${C.cyan}/plan-wiki${C.reset}              — sinh Index.md`);
  console.log(`  ${C.cyan}/spec-feature <ID>${C.reset}      — sinh tài liệu chi tiết`);
}

/** Build CodeGraph index (.codegraph/) trong thư mục source vừa thêm. */
async function setupCodeGraph(sourcePath) {
  console.log(head('CodeGraph (khuyến nghị — bỏ qua được)'));

  if (fs.existsSync(path.join(sourcePath, '.codegraph'))) {
    console.log(ok('Đã có .codegraph/ trong source — bỏ qua.'));
    return;
  }

  if (!hasCmd('codegraph')) {
    console.log(warn('Chưa cài CLI codegraph — bỏ qua bước index.'));
    console.log(C.dim + '   Cài 1 lần: npm i -g @colbymchenry/codegraph' + C.reset);
    console.log(C.dim + `   Rồi chạy:  cd "${sourcePath}" && codegraph init -i` + C.reset);
    return;
  }

  if (!(await askYesNo('Build CodeGraph index cho source này ngay (codegraph init -i)?'))) {
    console.log(C.dim + `   bỏ qua — sau chạy: cd "${sourcePath}" && codegraph init -i` + C.reset);
    return;
  }

  try {
    console.log(C.dim + '   đang index… (có thể mất chút thời gian)' + C.reset);
    execSync('codegraph init -i', { cwd: sourcePath, stdio: 'inherit' });
    console.log(ok('Đã build .codegraph/ — file watcher sẽ tự cập nhật khi code đổi.'));
  } catch {
    console.log(fail('codegraph init lỗi — chạy tay sau: cd source && codegraph init -i'));
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`${C.bold}LLM Wiki — Onboarding setup${C.reset}`);
  console.log(C.dim + `Vault: ${VAULT_ROOT}` + C.reset);
  try {
    runDoctor();
    await setupEnv();
    await addProject();
    console.log(head('Hoàn tất.'));
    console.log('Chạy web app: ' + C.cyan + 'docker compose --env-file .env.local up --build' + C.reset);
    console.log('Hoặc local:   ' + C.cyan + 'pnpm --filter web build-index && turbo run dev' + C.reset);
  } catch (err) {
    console.error(fail('Lỗi: ' + (err && err.message ? err.message : String(err))));
    process.exitCode = 1;
  } finally {
    rl.close();
  }
})();
