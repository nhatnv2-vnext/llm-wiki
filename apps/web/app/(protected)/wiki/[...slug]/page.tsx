import { notFound } from "next/navigation";

import BookmarkButton from "@/components/BookmarkButton";
import FreshnessBadge from "@/components/FreshnessBadge";
import MarkdownView from "@/components/MarkdownView";
import { getFileContent, getFreshness } from "@/lib/fs-tree";

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

  // Tiêu đề ngắn cho bookmark: segment cuối của slug, bỏ phần mở rộng .md.
  const pageTitle =
    slug.map(decodeURIComponent).pop()?.replace(/\.md$/i, "") ?? wikiSlug;

  const freshness = getFreshness(content);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <FreshnessBadge freshness={freshness} />
        <BookmarkButton slug={wikiSlug} title={pageTitle} />
      </div>
      <MarkdownView content={content} />
    </article>
  );
}
