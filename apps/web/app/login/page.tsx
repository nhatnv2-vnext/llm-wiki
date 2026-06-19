import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import LoginForm from "./LoginForm";

// Trang login đọc cookie phiên → ép động (không prerender tĩnh).
export const dynamic = "force-dynamic";

/**
 * Trang đăng nhập độc lập (không có sidebar). Nếu đã đăng nhập thì chuyển thẳng
 * về trang chủ — tránh hiện lại form cho người đã có phiên hợp lệ.
 */
export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full bg-accent"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              LLM Wiki
            </span>
          </span>
          <p className="text-sm text-muted">
            Đăng nhập để truy cập wiki dự án.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
