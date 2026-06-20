"use client";

import { useState } from "react";

/** 1 = 👍, -1 = 👎, 0 = chưa đánh giá. */
type Rating = 1 | -1 | 0;

/**
 * Nút 👍 / 👎 dưới mỗi câu trả lời assistant. Ghi đánh giá qua /api/feedback
 * (toggle: bấm lại đúng nút đang chọn = gỡ). Optimistic UI, revert nếu lỗi.
 *
 * Chỉ hiển thị khi đã có conversationId (hội thoại đã được lưu) — message chưa
 * lưu thì chưa có chỗ neo đánh giá.
 */
export default function FeedbackButtons({
  conversationId,
  messageId,
  initialRating = 0,
}: {
  conversationId: string;
  messageId: string;
  initialRating?: Rating;
}) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [pending, setPending] = useState(false);

  async function vote(next: 1 | -1) {
    if (pending) return;
    const prev = rating;
    // Optimistic: nếu bấm lại nút đang chọn → gỡ (0), ngược lại đặt giá trị mới.
    const optimistic: Rating = prev === next ? 0 : next;
    setRating(optimistic);
    setPending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId, rating: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { rating: Rating };
      setRating(data.rating);
    } catch {
      setRating(prev); // revert
    } finally {
      setPending(false);
    }
  }

  const base =
    "rounded-lg border px-2 py-1 text-sm transition-colors disabled:opacity-50";

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-muted">Hữu ích?</span>
      <button
        type="button"
        aria-pressed={rating === 1}
        aria-label="Hữu ích"
        disabled={pending}
        onClick={() => vote(1)}
        className={`${base} ${
          rating === 1
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-muted hover:text-foreground"
        }`}
      >
        👍
      </button>
      <button
        type="button"
        aria-pressed={rating === -1}
        aria-label="Không hữu ích"
        disabled={pending}
        onClick={() => vote(-1)}
        className={`${base} ${
          rating === -1
            ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
            : "border-border text-muted hover:text-foreground"
        }`}
      >
        👎
      </button>
    </div>
  );
}
