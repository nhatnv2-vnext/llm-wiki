"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { WikiNode } from "@/lib/fs-tree";

/** So khớp pathname hiện tại với slug của một file (đã decode để khớp dấu). */
function useIsActive() {
  const pathname = usePathname();
  // pathname có thể bị encode (vd %C3%A9) -> decode để so với slug gốc.
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // giữ nguyên nếu decode lỗi
  }
  return (href: string) => decoded === href;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TreeItems({
  nodes,
  onNavigate,
  isActive,
  isOpen,
  toggleDir,
}: {
  nodes: WikiNode[];
  onNavigate?: () => void;
  isActive: (href: string) => boolean;
  isOpen: (slug: string) => boolean;
  toggleDir: (slug: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) =>
        node.type === "dir" ? (
          <li key={node.slug}>
            {/* Header thư mục — bấm để thu gọn/mở rộng (accordion) */}
            <button
              type="button"
              onClick={() => toggleDir(node.slug)}
              title={node.name}
              aria-expanded={isOpen(node.slug)}
              className="mt-3 flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-accent-soft hover:text-accent-hover"
            >
              <ChevronIcon open={isOpen(node.slug)} />
              <span className="truncate">{node.name}</span>
            </button>
            {node.children &&
              node.children.length > 0 &&
              isOpen(node.slug) && (
                <div className="ml-2 border-l border-border pl-2">
                  <TreeItems
                    nodes={node.children}
                    onNavigate={onNavigate}
                    isActive={isActive}
                    isOpen={isOpen}
                    toggleDir={toggleDir}
                  />
                </div>
              )}
          </li>
        ) : (
          <li key={node.slug}>
            <Link
              href={`/wiki/${node.slug}`}
              onClick={onNavigate}
              title={node.name}
              aria-current={isActive(`/wiki/${node.slug}`) ? "page" : undefined}
              className={`block truncate rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                isActive(`/wiki/${node.slug}`)
                  ? "bg-accent-soft font-medium text-accent-hover"
                  : "text-foreground/80 hover:bg-accent-soft hover:text-accent-hover"
              }`}
            >
              {node.name}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

/**
 * Nội dung sidebar (header + cây điều hướng). Dùng chung cho cả sidebar
 * desktop và drawer mobile. `onNavigate` được gọi khi bấm một link —
 * dùng để đóng drawer trên mobile.
 */
export default function SidebarContent({
  tree,
  onNavigate,
}: {
  tree: WikiNode[];
  onNavigate?: () => void;
}) {
  const isActive = useIsActive();

  // Tập slug thư mục ĐANG ĐÓNG (mặc định mở hết). Lưu localStorage.
  const [closed, setClosed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem("sidebarClosedDirs");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const isOpen = (slug: string) => !closed.has(slug);
  const toggleDir = (slug: string) => {
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      localStorage.setItem("sidebarClosedDirs", JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <nav className="h-full overflow-y-auto overflow-x-hidden bg-surface-muted p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2 px-2 pt-1"
      >
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full bg-accent"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">
          LLM Wiki
        </span>
      </Link>
      <Link
        href="/graph"
        onClick={onNavigate}
        aria-current={isActive("/graph") ? "page" : undefined}
        className={`mb-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
          isActive("/graph")
            ? "bg-accent-soft font-medium text-accent-hover"
            : "text-foreground/80 hover:bg-accent-soft hover:text-accent-hover"
        }`}
      >
        <span aria-hidden>🕸️</span>
        Đồ thị wiki
      </Link>
      <TreeItems
        nodes={tree}
        onNavigate={onNavigate}
        isActive={isActive}
        isOpen={isOpen}
        toggleDir={toggleDir}
      />
    </nav>
  );
}
