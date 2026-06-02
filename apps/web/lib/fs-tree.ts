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
