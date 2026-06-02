// Catch-all route cho wiki: /wiki/<đường-dẫn-file>.
// Placeholder ở GĐ1.1 — logic đọc & render Markdown sẽ thêm ở các issue sau.
// Trong Next 16, `params` là một Promise và phải được await.
export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const wikiPath = slug.join("/");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Wiki
      </h1>
      <p className="mt-3 text-muted">
        Đường dẫn yêu cầu:{" "}
        <code className="rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-sm text-accent-hover">
          {wikiPath}
        </code>
      </p>
      <p className="mt-4 text-sm text-muted">
        Trang render nội dung Markdown sẽ được triển khai ở issue tiếp theo.
      </p>
    </main>
  );
}
