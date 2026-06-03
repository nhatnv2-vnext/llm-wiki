import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { WIKI_ROOT_PATH } from "@/lib/config";

/** Một nút trong cây điều hướng wiki. */
export type WikiNode = {
  /** Tên hiển thị (tên file không kèm đuôi, hoặc tên thư mục). */
  name: string;
  /** Slug ổn định, dạng "01_Business/checkout" (POSIX, không có đuôi .md). */
  slug: string;
  type: "file" | "dir";
  /** Chỉ có với type === "dir". */
  children?: WikiNode[];
};

/** Thư mục bị bỏ qua khi quét cây. */
const IGNORED_DIRS = new Set(["_Archive", "_Templates"]);

/** Chỉ phục vụ file có đuôi này. */
const MARKDOWN_EXT = ".md";

/** Bỏ qua file/thư mục ẩn (bắt đầu bằng dấu chấm) và các thư mục cấm. */
function isIgnored(entryName: string, isDir: boolean): boolean {
  if (entryName.startsWith(".")) return true;
  if (isDir && IGNORED_DIRS.has(entryName)) return true;
  return false;
}

/**
 * Sinh slug ổn định từ đường dẫn tuyệt đối của một mục bên trong vault.
 * Vd: ".../02_Wiki/01_Business/checkout.md" -> "01_Business/checkout".
 * Luôn dùng dấu "/" (POSIX) bất kể OS để slug ổn định trên mọi nền tảng.
 */
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
      // Bỏ qua thư mục rỗng (không chứa file .md nào sau khi lọc).
      if (children.length === 0) continue;
      nodes.push({
        name: entry.name,
        slug: toSlug(absPath),
        type: "dir",
        children,
      });
    } else if (entry.isFile() && entry.name.endsWith(MARKDOWN_EXT)) {
      nodes.push({
        name: entry.name.slice(0, -MARKDOWN_EXT.length),
        slug: toSlug(absPath),
        type: "file",
      });
    }
  }

  // Thư mục trước, file sau; trong mỗi nhóm sắp xếp theo tên (locale-aware).
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

// --- Cache cây thư mục trong memory -----------------------------------------

let treeCache: WikiNode[] | null = null;

/**
 * Quét toàn bộ cây thư mục wiki và trả về cấu trúc lồng nhau.
 * Kết quả được cache trong memory; gọi invalidateWikiTree() để làm mới.
 */
export async function getWikiTree(): Promise<WikiNode[]> {
  if (treeCache) return treeCache;
  treeCache = await scanDir(WIKI_ROOT_PATH);
  return treeCache;
}

/** Xoá cache cây thư mục (vd khi file thay đổi). */
export function invalidateWikiTree(): void {
  treeCache = null;
  linkIndexCache = null;
}

// --- Index title/tên -> slug (để resolve wikilink) --------------------------

/** Làm phẳng cây, trả về danh sách node là file. */
function flattenFiles(nodes: WikiNode[]): WikiNode[] {
  const out: WikiNode[] = [];
  for (const n of nodes) {
    if (n.type === "file") out.push(n);
    else if (n.children) out.push(...flattenFiles(n.children));
  }
  return out;
}

/** Lấy `title` trong front-matter YAML (nếu có) của nội dung .md. */
function extractFrontmatterTitle(content: string): string | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const titleLine = m[1].match(/^title:\s*(.+)$/m);
  if (!titleLine) return null;
  return titleLine[1].trim().replace(/^["']|["']$/g, "") || null;
}

/** Tên cuối của slug (basename), vd "01_Business/checkout" -> "checkout". */
function basenameOfSlug(slug: string): string {
  const i = slug.lastIndexOf("/");
  return i === -1 ? slug : slug.slice(i + 1);
}

let linkIndexCache: Map<string, string> | null = null;

/**
 * Map khoá-tra-cứu (đã lowercase) -> slug, để resolve wikilink `[[...]]`.
 * Mỗi file được index theo: slug đầy đủ, basename, và title front-matter.
 * Khoá trùng: ưu tiên slug đầy đủ > title > basename (không ghi đè khoá đã có
 * từ nguồn ưu tiên cao hơn).
 */
export async function getWikiLinkIndex(): Promise<Map<string, string>> {
  if (linkIndexCache) return linkIndexCache;

  const tree = await getWikiTree();
  const files = flattenFiles(tree);
  const index = new Map<string, string>();
  const add = (key: string, slug: string) => {
    const k = key.toLowerCase();
    if (!index.has(k)) index.set(k, slug);
  };

  // Pass 1: slug đầy đủ (ưu tiên cao nhất).
  for (const f of files) add(f.slug, f.slug);

  // Pass 2: title front-matter.
  for (const f of files) {
    const content = await getFileContent(f.slug);
    const title = content ? extractFrontmatterTitle(content) : null;
    if (title) add(title, f.slug);
  }

  // Pass 3: basename (ưu tiên thấp nhất, dễ trùng).
  for (const f of files) add(basenameOfSlug(f.slug), f.slug);

  linkIndexCache = index;
  return index;
}

/**
 * Resolve một target wikilink (phần trước dấu `|`) thành slug.
 * Thử: khoá nguyên văn -> bỏ đuôi .md -> slugify cơ bản. Trả null nếu không có.
 */
export function resolveWikiLink(
  target: string,
  index: Map<string, string>,
): string | null {
  const cleaned = target.trim().replace(/\.md$/i, "");
  const direct = index.get(cleaned.toLowerCase());
  if (direct) return direct;
  // fallback: lấy basename của target (vd "Folder/Name" -> "Name").
  const base = basenameOfSlug(cleaned);
  return index.get(base.toLowerCase()) ?? null;
}

// --- Đọc nội dung file (chống path traversal) -------------------------------

/**
 * Giải slug thành đường dẫn tuyệt đối an toàn bên trong WIKI_ROOT_PATH.
 * Ném lỗi nếu slug thoát ra ngoài vault hoặc không phải file .md.
 */
function resolveSlugToPath(slug: string): string {
  // Chuẩn hoá: chặn ngay các slug chứa "..".
  if (slug.split("/").some((seg) => seg === "..")) {
    throw new Error(`Slug không hợp lệ (chứa "..") : ${slug}`);
  }

  const absPath = path.resolve(WIKI_ROOT_PATH, `${slug}${MARKDOWN_EXT}`);

  // Verify đường dẫn đã chuẩn hoá vẫn nằm trong vault (chống path traversal).
  const rootWithSep = WIKI_ROOT_PATH.endsWith(path.sep)
    ? WIKI_ROOT_PATH
    : WIKI_ROOT_PATH + path.sep;
  if (!absPath.startsWith(rootWithSep)) {
    throw new Error(`Truy cập ngoài phạm vi vault bị từ chối: ${slug}`);
  }

  if (!absPath.endsWith(MARKDOWN_EXT)) {
    throw new Error(`Chỉ phục vụ file .md: ${slug}`);
  }

  return absPath;
}

/**
 * Đọc nội dung raw (UTF-8) của một file .md theo slug.
 * Vd: getFileContent("01_Business/checkout").
 * @returns nội dung file, hoặc null nếu file không tồn tại.
 */
export async function getFileContent(slug: string): Promise<string | null> {
  const absPath = resolveSlugToPath(slug);
  try {
    return await fs.readFile(absPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
