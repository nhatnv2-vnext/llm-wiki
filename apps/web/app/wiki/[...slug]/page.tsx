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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Wiki</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Đường dẫn yêu cầu:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          {wikiPath}
        </code>
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        Trang render nội dung Markdown sẽ được triển khai ở issue tiếp theo.
      </p>
    </main>
  );
}
