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
 * Lưu lịch sử các cuộc hội thoại chat (query + messages + sources) vào
 * localStorage, đặt ở layout nên KHÔNG mất khi điều hướng giữa các trang.
 *
 * - `conversations`: danh sách hội thoại, mới nhất đứng đầu.
 * - `activeId`: hội thoại đang mở ở màn home (để SearchChat khôi phục).
 */

export type Conversation = {
  id: string;
  /** Câu hỏi đầu tiên — dùng làm tiêu đề + gợi ý từ khoá. */
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
};

type ChatHistoryValue = {
  conversations: Conversation[];
  activeId: string | null;
  /** Tạo hội thoại mới (rỗng) và set active. Trả về id. */
  newConversation: () => string;
  /** Mở một hội thoại đã có. */
  setActive: (id: string | null) => void;
  /** Lưu/cập nhật messages cho một hội thoại (upsert). */
  saveConversation: (id: string, title: string, messages: UIMessage[]) => void;
  /** Xoá một hội thoại. */
  removeConversation: (id: string) => void;
};

const STORAGE_KEY = "chatHistory.v1";
const MAX_CONVERSATIONS = 50;

const ChatHistoryContext = createContext<ChatHistoryValue | null>(null);

export function useChatHistory(): ChatHistoryValue {
  const ctx = useContext(ChatHistoryContext);
  if (!ctx) {
    throw new Error("useChatHistory phải dùng trong <ChatHistoryProvider>.");
  }
  return ctx;
}

function loadFromStorage(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function ChatHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lazy initializer: SSR trả [] (không có window), client đọc localStorage ngay
  // → tránh setState-trong-effect mà vẫn an toàn hydrate.
  const [conversations, setConversations] = useState<Conversation[]>(
    loadFromStorage,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Ghi xuống localStorage mỗi khi đổi (chỉ chạy ở client).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // bỏ qua nếu localStorage đầy / bị chặn
    }
  }, [conversations]);

  const newConversation = useCallback(() => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    setActiveId(id);
    return id;
  }, []);

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
  }, []);

  const saveConversation = useCallback(
    (id: string, title: string, messages: UIMessage[]) => {
      setConversations((prev) => {
        const now = Date.now();
        const existing = prev.find((c) => c.id === id);
        const next: Conversation = existing
          ? { ...existing, title: existing.title || title, messages, updatedAt: now }
          : { id, title, messages, createdAt: now, updatedAt: now };
        const others = prev.filter((c) => c.id !== id);
        return [next, ...others].slice(0, MAX_CONVERSATIONS);
      });
    },
    [],
  );

  const removeConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
    },
    [],
  );

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
