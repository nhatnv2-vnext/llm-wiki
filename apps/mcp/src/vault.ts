import fs from "node:fs/promises";
import path from "node:path";

import { WIKI_ROOT_PATH } from "./config.js";

/**
 * Truy cập READ-ONLY vào vault 02_Wiki/.
 * Logic mirror apps/web/lib/fs-tree.ts (ignore rules, slug, wikilink index) —
 * keep in sync khi bên đó thay đổi.
 */

export type WikiNode = {
  /** Tên hiển thị (tên file không kèm đuôi, hoặc tên thư mục). */
  name: string;
  /** Slug ổn định dạng POSIX, vd "01_Business/checkout". */
  slug: string;
  type: "file" | "dir";
  children?: WikiNode[];
};

const IGNORED_DIRS = new Set(["_Archive", "_Templates"]);
const IGNORED_FILES = new Set(["SKILL.md"]);
const MARKDOWN_EXT = ".md";

function isIgnored(entryName: string, isDir: boolean): boolean {
  if (entryName.startsWith(".")) return true;
  if (isDir && IGNORED_DIRS.has(entryName)) return true;
  if (!isDir && IGNORED_FILES.has(entryName)) return true;
  return false;
}

function toSlug(absPath: string): string {
  const rel = path.relative(WIKI_ROOT_PATH, absPath);
  const posix = rel.split(path.sep).join("/");
  return posix.endsWith(MARKDOWN_EXT)
    ? posix.slice(0, -MARKDOWN_EXT.length)
    : posix;
}

async function scanDir(absDir: string): Promise<WikiNode[]> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const nodes: WikiNode[] = [];

  for (const entry of entries) {
    const isDir = entry.isDirectory();
    if (isIgnored(entry.name, isDir)) continue;

    const absPath = path.join(absDir, entry.name);

    if (isDir) {
      const children = await scanDir(absPath);
      // Giữ cả thư mục rỗng (khác apps/web): agent cần thấy scaffold đầy đủ
      // của vault skeleton để biết section nào chưa có nội dung.
      nodes.push({ name: entry.name, slug: toSlug(absPath), type: "dir", children });
    } else if (entry.isFile() && entry.name.endsWith(MARKDOWN_EXT)) {
      nodes.push({
        name: entry.name.slice(0, -MARKDOWN_EXT.length),
        slug: toSlug(absPath),
        type: "file",
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

/** Quét toàn bộ cây vault. Không cache — vault là dữ liệu sống. */
export async function getWikiTree(): Promise<WikiNode[]> {
  try {
    return await scanDir(WIKI_ROOT_PATH);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/** Làm phẳng cây, trả về các node file. */
export function flattenFiles(nodes: WikiNode[]): WikiNode[] {
  const out: WikiNode[] = [];
  for (const n of nodes) {
    if (n.type === "file") out.push(n);
    else if (n.children) out.push(...flattenFiles(n.children));
  }
  return out;
}

// --- Frontmatter -------------------------------------------------------------

export type Frontmatter = {
  title?: string;
  type?: string;
  status?: string;
  tags?: string[];
};

/** Parse frontmatter YAML đơn giản (chỉ các key phẳng cần dùng). */
export function parseFrontmatter(content: string): Frontmatter {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const block = m[1];
  const get = (key: string): string | undefined => {
    const line = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return line ? line[1].trim().replace(/^["']|["']$/g, "") : undefined;
  };
  const fm: Frontmatter = {
    title: get("title"),
    type: get("type"),
    status: get("status"),
  };
  // tags: [a, b] inline hoặc danh sách "- a" nhiều dòng.
  const inline = block.match(/^tags:\s*\[(.*)\]$/m);
  if (inline) {
    fm.tags = inline[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  } else {
    const listBlock = block.match(/^tags:\s*\r?\n((?:\s+-\s+.+\r?\n?)+)/m);
    if (listBlock) {
      fm.tags = listBlock[1]
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s+-\s+/, "").trim())
        .filter(Boolean);
    }
  }
  return fm;
}

// --- Đọc file (chống path traversal, chặn _Archive) ---------------------------

function basenameOfSlug(slug: string): string {
  const i = slug.lastIndexOf("/");
  return i === -1 ? slug : slug.slice(i + 1);
}

/**
 * Giải slug/path thành đường dẫn tuyệt đối an toàn trong WIKI_ROOT_PATH.
 * Ném lỗi nếu thoát ra ngoài vault hoặc đi vào _Archive.
 */
export function resolveSlugToPath(slugOrPath: string): string {
  const cleaned = slugOrPath.trim().replace(/\.md$/i, "");

  if (cleaned.split("/").some((seg) => seg === "..")) {
    throw new Error(`Path không hợp lệ (chứa ".."): ${slugOrPath}`);
  }
  if (cleaned.split("/").some((seg) => IGNORED_DIRS.has(seg))) {
    throw new Error(`Truy cập ${slugOrPath} bị từ chối (_Archive/_Templates).`);
  }

  const absPath = path.resolve(WIKI_ROOT_PATH, `${cleaned}${MARKDOWN_EXT}`);
  const rootWithSep = WIKI_ROOT_PATH.endsWith(path.sep)
    ? WIKI_ROOT_PATH
    : WIKI_ROOT_PATH + path.sep;
  if (!absPath.startsWith(rootWithSep)) {
    throw new Error(`Truy cập ngoài phạm vi vault bị từ chối: ${slugOrPath}`);
  }
  return absPath;
}

/** Đọc nội dung .md theo slug. Trả null nếu không tồn tại. */
export async function getFileContent(slug: string): Promise<string | null> {
  const absPath = resolveSlugToPath(slug);
  try {
    return await fs.readFile(absPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

// --- Wikilink index + resolve -------------------------------------------------

/**
 * Map khoá-tra-cứu (lowercase) -> slug, để resolve `[[wikilink]]` / tên trang.
 * Ưu tiên: slug đầy đủ > title frontmatter > basename.
 */
export async function getWikiLinkIndex(): Promise<Map<string, string>> {
  const files = flattenFiles(await getWikiTree());
  const index = new Map<string, string>();
  const add = (key: string, slug: string) => {
    const k = key.toLowerCase();
    if (!index.has(k)) index.set(k, slug);
  };

  for (const f of files) add(f.slug, f.slug);
  for (const f of files) {
    const content = await getFileContent(f.slug);
    const title = content ? parseFrontmatter(content).title : undefined;
    if (title) add(title, f.slug);
  }
  for (const f of files) add(basenameOfSlug(f.slug), f.slug);

  return index;
}

/** Resolve một target wikilink/tên trang thành slug; null nếu không có. */
export function resolveWikiLink(
  target: string,
  index: Map<string, string>,
): string | null {
  const cleaned = target.trim().replace(/\.md$/i, "");
  const direct = index.get(cleaned.toLowerCase());
  if (direct) return direct;
  const base = basenameOfSlug(cleaned);
  return index.get(base.toLowerCase()) ?? null;
}

/** Gợi ý các slug gần giống (fuzzy theo basename) khi không tìm thấy trang. */
export function suggestSimilar(
  target: string,
  files: WikiNode[],
  limit = 5,
): string[] {
  const needle = basenameOfSlug(target.trim().replace(/\.md$/i, ""))
    .toLowerCase()
    .replace(/[_\-\s]/g, "");
  const scored = files
    .map((f) => {
      const base = f.name.toLowerCase().replace(/[_\-\s]/g, "");
      let score = 0;
      if (base === needle) score = 3;
      else if (base.includes(needle) || needle.includes(base)) score = 2;
      else if (needle.length >= 3 && base.startsWith(needle.slice(0, 3))) score = 1;
      return { slug: f.slug, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.slug);
}

/** Trích các target `[[wikilink]]` trong nội dung (bỏ alias sau `|`, anchor `#`). */
export function extractWikiLinks(content: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const target = m[1].split("|")[0].split("#")[0].trim();
    if (target) out.push(target);
  }
  return [...new Set(out)];
}
