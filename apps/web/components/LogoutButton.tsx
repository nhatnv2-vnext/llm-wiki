"use client";

import { useTransition } from "react";

import { logoutAction } from "@/app/logout/actions";

/**
 * Nút đăng xuất ở chân sidebar. Gọi Server Action xóa phiên rồi điều hướng
 * về /login. Dùng useTransition để hiện trạng thái pending.
 */
export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() => startTransition(() => logoutAction())}
      className="shrink-0 border-t border-border p-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-hover disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {pending ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
    </form>
  );
}
