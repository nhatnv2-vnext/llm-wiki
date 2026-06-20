import type { Freshness } from "@/lib/fs-tree";

/**
 * Huy hiệu độ tươi mới của trang wiki. Server component thuần (chỉ nhận dữ liệu
 * đã tính từ getFreshness) — giúp người đọc biết tài liệu còn mới hay có thể
 * đã lỗi thời so với code.
 */
export default function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const { level, lastSynced, ageDays } = freshness;

  const age =
    ageDays === null
      ? null
      : ageDays === 0
        ? "hôm nay"
        : `${ageDays} ngày trước`;

  const config = {
    fresh: {
      icon: "✓",
      label: "Mới cập nhật",
      cls: "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
    },
    aging: {
      icon: "🕒",
      label: "Có thể đã lỗi thời",
      cls: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    },
    stale: {
      icon: "⚠️",
      label: "Cần kiểm tra/cập nhật",
      cls: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    },
  }[level];

  // Tooltip: nêu rõ mốc đồng bộ để người đọc tự đánh giá.
  const title = lastSynced
    ? `Lần đồng bộ gần nhất với mã nguồn: ${lastSynced}`
    : "Không có mốc last_synced trong tài liệu";

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${config.cls}`}
    >
      <span aria-hidden>{config.icon}</span>
      <span>{config.label}</span>
      {age && <span className="opacity-70">· {age}</span>}
    </span>
  );
}
