"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";

import ChatMarkdown from "@/components/ChatMarkdown";
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
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || isBusy) return;
    sendMessage({ text: q });
    setInput("");
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Thanh search lớn */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-accent">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi gì đó về wiki dự án…"
            aria-label="Câu hỏi"
            className="flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={isBusy || input.trim() === ""}
            className="rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? "Đang trả lời…" : "Hỏi"}
          </button>
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
