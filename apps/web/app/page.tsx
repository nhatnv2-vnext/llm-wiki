import fs from "node:fs";

import { WIKI_ROOT_PATH } from "@/lib/config";

// Server Component: đọc filesystem ở phía server, không expose path ra client.
export default function Home() {
  // DoD: log đường dẫn vault ra phía server.
  console.log("[wiki] WIKI_ROOT_PATH =", WIKI_ROOT_PATH);

  const exists = fs.existsSync(WIKI_ROOT_PATH);
  let entryCount: number | null = null;
  if (exists) {
    try {
      entryCount = fs.readdirSync(WIKI_ROOT_PATH).length;
    } catch {
      entryCount = null;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">LLM Wiki Viewer</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Giai đoạn 1 — Wiki Viewer cơ bản (GĐ1.1).
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">Trạng thái vault</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-zinc-500">Thư mục gốc tồn tại</dt>
            <dd className={exists ? "text-green-600" : "text-red-600"}>
              {exists ? "✓ Có" : "✗ Không tìm thấy"}
            </dd>
          </div>
          {entryCount !== null && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-500">Số mục cấp 1</dt>
              <dd>{entryCount}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 text-xs text-zinc-400">
          Đường dẫn vault chỉ được đọc ở phía server và được log ra console — không
          gửi ra client.
        </p>
      </section>
    </main>
  );
}
