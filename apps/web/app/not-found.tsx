import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-mono text-sm font-bold uppercase tracking-wider text-accent">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Không tìm thấy trang
      </h1>
      <p className="text-muted">
        Trang wiki bạn yêu cầu không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
