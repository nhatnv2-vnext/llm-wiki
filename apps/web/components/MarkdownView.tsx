import ReactMarkdown from "react-markdown";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

import Mermaid from "@/components/Mermaid";
import { getWikiLinkIndex } from "@/lib/fs-tree";
import remarkWikilink from "@/lib/remark-wikilink";

/**
 * Render nội dung Markdown của một trang wiki (Server Component).
 * - remark-gfm: bảng, task list, ...
 * - remark-frontmatter: parse khối YAML `---` để KHÔNG render nó ra.
 * - remark-wikilink: chuyển [[...]] thành link nội bộ.
 * - code block ```mermaid``` -> <Mermaid/> (client).
 */
export default async function MarkdownView({ content }: { content: string }) {
  const index = await getWikiLinkIndex();

  return (
    <div className="prose prose-stone max-w-none dark:prose-invert prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkFrontmatter,
          [remarkWikilink, { index }],
        ]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const text = String(children).replace(/\n$/, "");
            if (match?.[1] === "mermaid") {
              return <Mermaid chart={text} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
