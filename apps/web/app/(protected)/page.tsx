import SearchChat from "@/components/SearchChat";

// Trang chủ: thanh Search/Chat lớn. Phần hội thoại + stream là client component.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Hỏi đáp Wiki
        </h1>
        <p className="mt-3 text-lg text-muted">
          Tìm kiếm bằng ngôn ngữ tự nhiên — AI trả lời dựa trên nội dung wiki dự án.
        </p>
      </div>

      <SearchChat />
    </main>
  );
}
