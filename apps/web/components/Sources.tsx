"use client";

import Link from "next/link";

/**
 * Thẻ "Sources": liệt kê các file nguồn (file_path) mà câu trả lời dựa vào.
 * Click một nguồn → điều hướng tới trang wiki tương ứng (/wiki/<slug>).
 *
 * file_path trả về từ /api/chat chính là slug của viewer (vd
 * "03_Architecture/README"), nên chỉ cần encode từng segment để an toàn với
 * khoảng trắng / ký tự đặc biệt.
 */

/** Chuyển file_path → href /wiki/<slug> với từng segment được encode. */
export function slugToHref(filePath: string): string {
  const encoded = filePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/wiki/${encoded}`;
}

export default function Sources({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;

  return (
    <aside className="mt-4 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Nguồn tham khảo
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {sources.map((src) => (
          <li key={src}>
            <Link
              href={slugToHref(src)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <span aria-hidden>📄</span>
              <span className="font-mono text-xs">{src}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
