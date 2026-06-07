"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";

import ChatMarkdown from "@/components/ChatMarkdown";
import { useChatHistory } from "@/components/ChatHistoryProvider";
import Sources from "@/components/Sources";

/** Metadata kèm theo message assistant từ /api/chat. */
type ChatMetadata = { sources?: string[]; outOfScope?: boolean };

/** Ghép text từ các part của một message. */
function messageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export default function SearchChat() {
  const {
    conversations,
    activeId,
    newConversation,
    setActive,
    saveConversation,
  } = useChatHistory();

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hội thoại đang mở (nếu có) để khôi phục messages.
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  // useChat instance ỔN ĐỊNH (id cố định) — KHÔNG key theo activeId, vì đổi id
  // sẽ remount useChat và vứt mất message vừa gửi. Việc gắn message vào hội
  // thoại nào do `currentIdRef` quản lý (cập nhật đồng bộ trước khi gửi).
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // Route nhận { query } (tái dùng từ #8/#9), không phải mảng messages.
      prepareSendMessagesRequest: ({ messages }) => {
        const last = messages[messages.length - 1];
        const query = last?.parts
          ?.filter((p) => p.type === "text")
          .map((p) => ("text" in p ? p.text : ""))
          .join("");
        return { body: { query } };
      },
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  // ID hội thoại đang được hiển thị trong khung chat (đồng bộ qua ref để không
  // dính nhịp re-render của state).
  const currentIdRef = useRef<string | null>(null);

  // Khi activeId đổi (mở từ sidebar / gợi ý) và KHÁC cái đang hiển thị → nạp lại.
  useEffect(() => {
    if (activeId && activeId !== currentIdRef.current) {
      currentIdRef.current = activeId;
      setMessages((activeConversation?.messages ?? []) as UIMessage[]);
    }
    if (!activeId && currentIdRef.current === null) {
      // chưa có hội thoại nào — giữ khung rỗng
    }
  }, [activeId, activeConversation, setMessages]);

  // Lưu lại hội thoại mỗi khi stream xong (status ready và có messages).
  useEffect(() => {
    const id = currentIdRef.current;
    if (status !== "ready" || messages.length === 0 || !id) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title = firstUser ? messageText(firstUser).slice(0, 80) : "Hội thoại";
    saveConversation(id, title, messages as UIMessage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || isBusy) return;
    // Chưa có hội thoại đang mở → tạo id mới (chỉ đặt ref + active, KHÔNG remount
    // useChat) rồi gửi ngay trong cùng lượt — message không bị mất.
    if (!currentIdRef.current) {
      const id = newConversation();
      currentIdRef.current = id;
    }
    sendMessage({ text: q });
    setInput("");
    setShowSuggestions(false);
  }

  /** Bắt đầu hội thoại mới (xoá khung chat hiện tại, không xoá lịch sử). */
  function handleNew() {
    const id = newConversation();
    currentIdRef.current = id;
    setMessages([]);
    setInput("");
  }

  /** Gợi ý từ khoá gần đây (lọc theo text đang gõ). */
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return conversations
      .filter((c) => c.title && (q === "" || c.title.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [conversations, input]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Thanh search lớn */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-accent">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            // Trễ để click vào suggestion kịp xử lý trước khi blur ẩn dropdown.
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Hỏi gì đó về wiki dự án…"
            aria-label="Câu hỏi"
            className="flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-muted"
          />
          {hasMessages && (
            <button
              type="button"
              onClick={handleNew}
              className="rounded-xl border border-border px-3 py-3 text-sm text-muted transition-colors hover:text-foreground"
              title="Hỏi câu mới"
            >
              + Mới
            </button>
          )}
          <button
            type="submit"
            disabled={isBusy || input.trim() === ""}
            className="rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? "Đang trả lời…" : "Hỏi"}
          </button>

          {/* Dropdown gợi ý từ khoá gần đây */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <li className="px-4 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Tìm kiếm gần đây
              </li>
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    // onMouseDown để chạy trước onBlur của input.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // setActive → effect tự nạp messages (so currentIdRef).
                      setActive(c.id);
                      setInput("");
                      setShowSuggestions(false);
                    }}
                    className="block w-full truncate px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-background"
                  >
                    <span className="mr-2 text-muted">🕘</span>
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* Empty state */}
      {!hasMessages && !error && (
        <p className="text-center text-sm text-muted">
          Nhập câu hỏi để AI trả lời dựa trên nội dung wiki, kèm nguồn tham khảo.
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Có lỗi xảy ra: {error.message || "không gọi được API."} Vui lòng thử lại.
        </div>
      )}

      {/* Hội thoại */}
      <div className="flex flex-col gap-6">
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-accent px-4 py-2.5 text-white">
                  {messageText(message)}
                </div>
              </div>
            );
          }

          const meta = message.metadata as ChatMetadata | undefined;
          const text = messageText(message);
          return (
            <div key={message.id} className="flex flex-col">
              <div className="rounded-2xl border border-border bg-surface px-5 py-4">
                {text ? (
                  <ChatMarkdown content={text} />
                ) : (
                  <span className="text-sm text-muted">Đang soạn câu trả lời…</span>
                )}
              </div>
              {meta?.sources && meta.sources.length > 0 && (
                <Sources sources={meta.sources} />
              )}
            </div>
          );
        })}

        {/* Loading: đã gửi nhưng assistant chưa có message nào */}
        {status === "submitted" &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="rounded-2xl border border-border bg-surface px-5 py-4">
              <span className="text-sm text-muted">Đang tìm trong wiki…</span>
            </div>
          )}
      </div>
    </div>
  );
}
