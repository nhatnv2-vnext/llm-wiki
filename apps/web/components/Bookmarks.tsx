"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { slugToHref } from "@/components/Sources";

type Bookmark = { slug: string; title: string; createdAt: number };

/**
 * Danh sách trang wiki đã lưu (bookmark) trong sidebar. Tự nạp từ
 * /api/bookmarks; click một mục → mở trang wiki tương ứng. Có nút bỏ lưu.
 *
 * Lắng nghe sự kiện "bookmarks:changed" (do BookmarkButton phát) để cập nhật
 * danh sách ngay khi user lưu/bỏ lưu ở trang wiki, không cần reload.
 */
export default function Bookmarks({ onNavigate }: { onNavigate?: () => void }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/bookmarks")
      .then((r) => (r.ok ? r.json() : { bookmarks: [] }))
      .then((d: { bookmarks?: Bookmark[] }) => setBookmarks(d.bookmarks ?? []))
      .catch(() => setBookmarks([]));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("bookmarks:changed", load);
    return () => window.removeEventListener("bookmarks:changed", load);
  }, [load]);

  async function remove(slug: string) {
    // Optimistic: bỏ khỏi danh sách ngay; toggle POST sẽ gỡ ở server.
    setBookmarks((prev) => prev?.filter((b) => b.slug !== slug) ?? prev);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    } catch {
      load(); // lỗi → nạp lại để đồng bộ.
    }
  }

  if (bookmarks === null) {
    return <p className="px-3 py-4 text-sm text-muted">Đang tải…</p>;
  }

  if (bookmarks.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted">
        Chưa có trang nào được lưu. Mở một trang wiki và bấm “☆ Lưu”.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 px-2 py-2">
      {bookmarks.map((b) => (
        <li key={b.slug} className="group flex items-center gap-1">
          <Link
            href={slugToHref(b.slug)}
            onClick={onNavigate}
            className="flex-1 truncate rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface"
            title={b.slug}
          >
            <span className="mr-2 text-muted">★</span>
            {b.title || b.slug}
          </Link>
          <button
            type="button"
            onClick={() => remove(b.slug)}
            aria-label="Bỏ lưu"
            className="shrink-0 rounded-md px-2 py-2 text-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
