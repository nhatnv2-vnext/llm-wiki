"use client";

import { usePathname, useRouter } from "next/navigation";

import { useChatHistory } from "@/components/ChatHistoryProvider";

/**
 * Danh sách lịch sử hội thoại trong sidebar. Click một mục → mở lại hội thoại
 * đó ở màn home (set active + điều hướng về "/").
 */
export default function ChatHistory({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { conversations, activeId, setActive, removeConversation } =
    useChatHistory();
  const router = useRouter();
  const pathname = usePathname();

  function openConversation(id: string) {
    setActive(id);
    if (pathname !== "/") router.push("/");
    onNavigate?.();
  }

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted">
        Chưa có lịch sử chat. Hãy hỏi gì đó ở trang chủ.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 px-2 py-2">
      {conversations.map((c) => {
        const isActive = c.id === activeId;
        return (
          <li key={c.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => openConversation(c.id)}
              className={`flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent-hover"
                  : "text-foreground hover:bg-surface"
              }`}
              title={c.title}
            >
              <span className="mr-2 text-muted">💬</span>
              {c.title || "Hội thoại"}
            </button>
            <button
              type="button"
              onClick={() => removeConversation(c.id)}
              aria-label="Xoá hội thoại"
              className="shrink-0 rounded-md px-2 py-2 text-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
