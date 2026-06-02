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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
          LLM Wiki Viewer
        </h1>
        <p className="mt-3 text-lg text-muted">
          Giai đoạn 1 — Wiki Viewer cơ bản (GĐ1.1).
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Trạng thái vault
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Thư mục gốc tồn tại</dt>
            <dd
              className={
                exists
                  ? "font-medium text-accent"
                  : "font-medium text-red-600"
              }
            >
              {exists ? "✓ Có" : "✗ Không tìm thấy"}
            </dd>
          </div>
          {entryCount !== null && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Số mục cấp 1</dt>
              <dd className="font-medium text-foreground">{entryCount}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
          Đường dẫn vault chỉ được đọc ở phía server và được log ra console — không
          gửi ra client.
        </p>
      </section>
    </main>
  );
}
