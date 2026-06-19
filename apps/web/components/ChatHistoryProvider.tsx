"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UIMessage } from "ai";

/**
 * Lưu lịch sử các cuộc hội thoại chat (query + messages + sources) phía SERVER
 * qua SQLite (API /api/conversations), gắn theo user trong session.
 *
 * - Lúc mount: nạp danh sách tóm tắt (không kèm messages) của user.
 * - Khi mở một hội thoại (setActive): lazy-fetch messages rồi merge vào list.
 * - saveConversation: upsert lên server (đồng thời cập nhật cache local).
 *
 * Interface giữ nguyên như bản localStorage cũ nên SearchChat/Sidebar/ChatHistory
 * không phải đổi.
 */

export type Conversation = {
  id: string;
  /** Câu hỏi đầu tiên — dùng làm tiêu đề + gợi ý từ khoá. */
  title: string;
  /** Có thể rỗng cho tới khi hội thoại được mở (lazy-loaded). */
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
};

type ChatHistoryValue = {
  conversations: Conversation[];
  activeId: string | null;
  /** Tạo hội thoại mới (rỗng) và set active. Trả về id. */
  newConversation: () => string;
  /** Mở một hội thoại đã có (lazy-load messages nếu cần). */
  setActive: (id: string | null) => void;
  /** Lưu/cập nhật messages cho một hội thoại (upsert lên server). */
  saveConversation: (id: string, title: string, messages: UIMessage[]) => void;
  /** Xoá một hội thoại. */
  removeConversation: (id: string) => void;
};

const ChatHistoryContext = createContext<ChatHistoryValue | null>(null);

export function useChatHistory(): ChatHistoryValue {
  const ctx = useContext(ChatHistoryContext);
  if (!ctx) {
    throw new Error("useChatHistory phải dùng trong <ChatHistoryProvider>.");
  }
  return ctx;
}

type SummaryDto = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export function ChatHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // id các hội thoại đã lazy-load đủ messages → tránh fetch lại.
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());

  // Nạp danh sách tóm tắt khi mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return; // 401 (chưa đăng nhập) → để rỗng
        const data = (await res.json()) as { conversations: SummaryDto[] };
        if (cancelled) return;
        setConversations(
          data.conversations.map((c) => ({ ...c, messages: [] })),
        );
      } catch {
        // mạng lỗi → giữ rỗng, không chặn UI
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const newConversation = useCallback(() => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    setActiveId(id);
    // Hội thoại mới coi như đã "loaded" (rỗng) — không cần fetch.
    setLoadedIds((prev) => new Set(prev).add(id));
    return id;
  }, []);

  const setActive = useCallback(
    (id: string | null) => {
      setActiveId(id);
      if (!id || loadedIds.has(id)) return;

      // Lazy-load messages của hội thoại được mở.
      (async () => {
        try {
          const res = await fetch(`/api/conversations/${id}`);
          if (!res.ok) return;
          const data = (await res.json()) as { conversation: Conversation };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, messages: data.conversation.messages } : c,
            ),
          );
          setLoadedIds((prev) => new Set(prev).add(id));
        } catch {
          // bỏ qua lỗi fetch
        }
      })();
    },
    [loadedIds],
  );

  const saveConversation = useCallback(
    (id: string, title: string, messages: UIMessage[]) => {
      const now = Date.now();
      // Cập nhật cache local ngay (optimistic) — đẩy hội thoại lên đầu.
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === id);
        const next: Conversation = existing
          ? { ...existing, title: existing.title || title, messages, updatedAt: now }
          : { id, title, messages, createdAt: now, updatedAt: now };
        return [next, ...prev.filter((c) => c.id !== id)];
      });
      setLoadedIds((prev) => new Set(prev).add(id));

      // Đẩy lên server (fire-and-forget; lỗi không chặn UX).
      void fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title, messages }),
      }).catch(() => {});
    },
    [],
  );

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
    void fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      conversations,
      activeId,
      newConversation,
      setActive,
      saveConversation,
      removeConversation,
    }),
    [conversations, activeId, newConversation, setActive, saveConversation, removeConversation],
  );

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
}
