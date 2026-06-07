"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render Markdown phía client cho câu trả lời streaming của chat.
 *
 * Dùng cùng react-markdown + remark-gfm và lớp `prose` như MarkdownView (#5)
 * để câu trả lời trông đồng nhất với trang wiki. KHÔNG dùng remark-wikilink /
 * Mermaid (vốn cần dữ liệu server) vì câu trả lời là văn bản tự do từ LLM.
 */
export default function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-stone max-w-none dark:prose-invert prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
