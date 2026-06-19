import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { WIKI_ROOT_PATH } from "@/lib/config";

/**
 * Đọc thông tin dự án (read-only) từ Layer 1 catalog
 * `01_Raw/codebase/projects.json`, dùng cho menu "Thông tin dự án" trong
 * Settings. Web app chỉ có WIKI_ROOT_PATH (trỏ 02_Wiki) nên suy ra 01_Raw từ
 * thư mục cha của vault.
 */

export type ProjectInfo = {
  name: string;
  type: string;
  description: string;
  active: boolean;
};

/** Đường dẫn projects.json: <vault>/01_Raw/codebase/projects.json. */
function projectsJsonPath(): string {
  // WIKI_ROOT_PATH = <vault>/02_Wiki → cha của nó là <vault>.
  const vaultRoot = path.dirname(WIKI_ROOT_PATH);
  return path.join(vaultRoot, "01_Raw", "codebase", "projects.json");
}

/**
 * Trả về danh sách dự án đang active. Lỗi đọc/parse → trả mảng rỗng (menu chỉ
 * hiển thị trạng thái "không có dữ liệu"), không làm sập trang Settings.
 */
export async function listProjects(): Promise<ProjectInfo[]> {
  let raw: string;
  try {
    raw = await fs.readFile(projectsJsonPath(), "utf-8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const projects =
    typeof parsed === "object" && parsed !== null && "projects" in parsed
      ? (parsed as { projects: unknown }).projects
      : null;

  if (!Array.isArray(projects)) return [];

  return projects
    .filter(
      (p): p is Record<string, unknown> =>
        typeof p === "object" && p !== null,
    )
    .map((p) => ({
      name: typeof p.name === "string" ? p.name : "(không tên)",
      type: typeof p.type === "string" ? p.type : "other",
      description: typeof p.description === "string" ? p.description : "",
      active: p.active !== false,
    }))
    .filter((p) => p.active);
}
