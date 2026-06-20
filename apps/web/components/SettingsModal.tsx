"use client";

import { useEffect, useState } from "react";

import {
  useTheme,
  type ThemePreference,
} from "@/components/ThemeProvider";
import type { ProjectInfo } from "@/lib/projects";

/**
 * Modal cài đặt mở từ thanh Settings ở cuối sidebar. 3 mục:
 *  - Giao diện: dark / light / system với box minh hoạ kiểu macOS.
 *  - Thông tin cá nhân: email phiên + đăng xuất (read-only).
 *  - Thông tin dự án: đọc từ 01_Raw/codebase/projects.json (read-only).
 */

type Tab = "appearance" | "account" | "project";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "appearance", label: "Giao diện", icon: "🎨" },
  { id: "account", label: "Cá nhân", icon: "👤" },
  { id: "project", label: "Dự án", icon: "📦" },
];

export default function SettingsModal({
  open,
  onClose,
  email,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  email: string | null;
  projects: ProjectInfo[];
}) {
  const [tab, setTab] = useState<Tab>("appearance");

  // Đóng bằng Esc + khoá scroll nền khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-stretch justify-center sm:items-center sm:p-4">
      {/* Nền tối: đục hơn một chút (so với drawer) để che hẳn drawer phía sau
          trên mobile, tránh hiệu ứng overlay chồng overlay. */}
      <button
        type="button"
        aria-label="Đóng cài đặt"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/60"
      />
      {/* Mobile: chiếm toàn màn hình, tab xếp ngang ở trên. Desktop (sm+):
          modal giữa màn hình, tab thành cột trái. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt"
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-2xl sm:h-[min(560px,85vh)] sm:w-[min(760px,95vw)] sm:flex-row sm:rounded-2xl sm:border sm:border-border"
      >
        {/* Tabs: hàng ngang cuộn được trên mobile, cột trái trên desktop */}
        <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-surface-muted p-2 sm:w-44 sm:flex-col sm:items-stretch sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
          <h2 className="hidden px-2 pb-2 pt-1 text-sm font-bold text-foreground sm:block">
            Cài đặt
          </h2>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                tab === t.id
                  ? "bg-accent-soft text-accent-hover"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Nội dung */}
        <div className="relative min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-accent-hover"
          >
            ✕
          </button>

          {tab === "appearance" && <AppearanceTab />}
          {tab === "account" && <AccountTab email={email} />}
          {tab === "project" && <ProjectTab projects={projects} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Giao diện (theme) ---------- */

function AppearanceTab() {
  const { preference, setPreference } = useTheme();

  const options: { id: ThemePreference; label: string }[] = [
    { id: "light", label: "Sáng" },
    { id: "dark", label: "Tối" },
    { id: "system", label: "Hệ thống" },
  ];

  return (
    <section>
      <h3 className="text-base font-semibold text-foreground">Giao diện</h3>
      <p className="mt-1 text-sm text-muted">
        Chọn chế độ hiển thị. “Hệ thống” tự đổi theo cài đặt máy của bạn.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setPreference(opt.id)}
            aria-pressed={preference === opt.id}
            className="flex flex-col items-center gap-2"
          >
            <ThemePreview
              variant={opt.id}
              selected={preference === opt.id}
            />
            <span
              className={`text-sm ${
                preference === opt.id
                  ? "font-medium text-accent"
                  : "text-foreground"
              }`}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Box minh hoạ theme kiểu macOS (mini mockup cửa sổ). */
function ThemePreview({
  variant,
  selected,
}: {
  variant: ThemePreference;
  selected: boolean;
}) {
  // Màu nền/khối cho từng biến thể; "system" chia đôi sáng/tối.
  const ring = selected
    ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
    : "ring-1 ring-border";

  if (variant === "system") {
    return (
      <span
        className={`relative block h-20 w-full overflow-hidden rounded-xl ${ring}`}
      >
        <span className="absolute inset-0 flex">
          <span className="h-full w-1/2 bg-[#f4f3ed]" />
          <span className="h-full w-1/2 bg-[#21201c]" />
        </span>
        <span className="absolute left-3 right-3 top-3 h-2 rounded-full bg-foreground/30" />
        <span className="absolute bottom-3 left-3 h-6 w-1/3 rounded-md bg-[#bb5a38]" />
      </span>
    );
  }

  const isDark = variant === "dark";
  const bg = isDark ? "bg-[#21201c]" : "bg-[#f4f3ed]";
  const bar = isDark ? "bg-[#eceae1]/30" : "bg-[#1a1a18]/25";
  const block = isDark ? "bg-[#cd7a5a]" : "bg-[#bb5a38]";

  return (
    <span
      className={`relative block h-20 w-full overflow-hidden rounded-xl ${bg} ${ring}`}
    >
      <span className={`absolute left-3 right-3 top-3 h-2 rounded-full ${bar}`} />
      <span className={`absolute left-3 top-7 h-2 w-2/3 rounded-full ${bar}`} />
      <span className={`absolute bottom-3 left-3 h-6 w-1/3 rounded-md ${block}`} />
    </span>
  );
}

/* ---------- Thông tin cá nhân ---------- */

function AccountTab({ email }: { email: string | null }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-foreground">
        Thông tin cá nhân
      </h3>
      <p className="mt-1 text-sm text-muted">Tài khoản đang đăng nhập.</p>

      <dl className="mt-5 space-y-3">
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
          <dd className="mt-0.5 text-sm text-foreground">
            {email ?? "Không xác định"}
          </dd>
        </div>
      </dl>

      <a
        href="/logout"
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-red-400 hover:text-red-600"
      >
        <span aria-hidden>↩</span>
        Đăng xuất
      </a>
    </section>
  );
}

/* ---------- Thông tin dự án ---------- */

function ProjectTab({ projects }: { projects: ProjectInfo[] }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-foreground">Thông tin dự án</h3>
      <p className="mt-1 text-sm text-muted">
        Các dự án đang được lập tài liệu trong wiki (đọc từ catalog gốc).
      </p>

      {projects.length === 0 ? (
        <p className="mt-5 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
          Chưa có dự án nào trong catalog.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {projects.map((p) => (
            <li
              key={p.name}
              className="rounded-lg border border-border bg-surface-muted px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {p.type}
                </span>
              </div>
              {p.description && (
                <p className="mt-1 text-sm text-muted">{p.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
