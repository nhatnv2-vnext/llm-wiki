"use client";

import { useEffect, useState } from "react";

/**
 * Nút lưu/bỏ lưu (bookmark) một trang wiki. Tự nạp trạng thái ban đầu từ
 * /api/bookmarks rồi toggle optimistic; revert nếu lỗi.
 *
 * `slug` là phần sau /wiki/ (vd "03_Architecture/README") — khớp với slug
 * mà viewer dùng để điều hướng.
 */
export default function BookmarkButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [saved, setSaved] = useState<boolean | null>(null); // null = chưa biết
  const [pending, setPending] = useState(false);

  // Nạp trạng thái hiện tại (có nằm trong danh sách bookmark của user không).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookmarks")
      .then((r) => (r.ok ? r.json() : { bookmarks: [] }))
      .then((d: { bookmarks?: Array<{ slug: string }> }) => {
        if (!cancelled) {
          setSaved((d.bookmarks ?? []).some((b) => b.slug === slug));
        }
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    if (pending || saved === null) return;
    const prev = saved;
    setSaved(!prev);
    setPending(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { bookmarked: boolean };
      setSaved(data.bookmarked);
      // Báo cho sidebar (tab "Đã lưu") cập nhật danh sách ngay.
      window.dispatchEvent(new Event("bookmarks:changed"));
    } catch {
      setSaved(prev); // revert
    } finally {
      setPending(false);
    }
  }

  const isSaved = saved === true;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || saved === null}
      aria-pressed={isSaved}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        isSaved
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted hover:text-foreground"
      }`}
      title={isSaved ? "Bỏ lưu trang này" : "Lưu trang này"}
    >
      <span aria-hidden>{isSaved ? "★" : "☆"}</span>
      {isSaved ? "Đã lưu" : "Lưu"}
    </button>
  );
}
