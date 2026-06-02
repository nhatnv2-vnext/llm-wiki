"use client";

import { useEffect, useState } from "react";

import SidebarContent from "@/components/Sidebar";
import type { WikiNode } from "@/lib/fs-tree";

/**
 * Khung layout responsive.
 * - >= 768px (md): sidebar cố định bên trái, không có drawer.
 * - < 768px: sidebar ẩn; hiện top bar với nút hamburger mở drawer trượt + overlay.
 */
export default function AppShell({
  tree,
  children,
}: {
  tree: WikiNode[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Khoá scroll body khi drawer mở; đóng bằng phím Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Top bar — chỉ hiện trên mobile */}
      <header className="flex items-center gap-3 border-b border-border bg-surface-muted px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent-soft hover:text-accent-hover"
        >
          {/* icon hamburger */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-accent"
          />
          <span className="text-base font-bold tracking-tight text-foreground">
            LLM Wiki
          </span>
        </span>
      </header>

      {/* Sidebar desktop — cố định, ẩn trên mobile */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <SidebarContent tree={tree} />
      </aside>

      {/* Drawer mobile + overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-border shadow-xl">
            <SidebarContent tree={tree} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Nội dung chính */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
