import { notFound } from "next/navigation";

import MarkdownView from "@/components/MarkdownView";
import { getFileContent } from "@/lib/fs-tree";

// Catch-all route cho wiki: /wiki/<slug>. Trong Next 16, `params` là Promise.
export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const wikiSlug = slug.map(decodeURIComponent).join("/");

  let content: string | null = null;
  try {
    content = await getFileContent(wikiSlug);
  } catch {
    // slug không hợp lệ (path traversal, không phải .md) -> 404.
    notFound();
  }

  if (content === null) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <MarkdownView content={content} />
    </article>
  );
}
