"use client";

import { useState } from "react";

import Bookmarks from "@/components/Bookmarks";
import ChatHistory from "@/components/ChatHistory";
import LogoutButton from "@/components/LogoutButton";
import SidebarContent from "@/components/Sidebar";
import type { WikiNode } from "@/lib/fs-tree";

/**
 * Sidebar 3 tab:
 *  - "Wiki": cây thư mục wiki (SidebarContent hiện có).
 *  - "Lịch sử": danh sách hội thoại chat đã lưu.
 *  - "Đã lưu": các trang wiki đã bookmark.
 */
export default function SidebarTabs({
  tree,
  onNavigate,
  headerAction,
}: {
  tree: WikiNode[];
  onNavigate?: () => void;
  /** Nút phụ render bên phải thanh tab (vd nút thu gọn sidebar trên desktop). */
  headerAction?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"wiki" | "history" | "saved">("wiki");

  const tabClass = (active: boolean) =>
    `px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "border-b-2 border-accent text-accent"
        : "border-b-2 border-transparent text-muted hover:text-foreground"
    }`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-stretch border-b border-border">
        <button
          type="button"
          onClick={() => setTab("wiki")}
          className={tabClass(tab === "wiki")}
        >
          Wiki
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={tabClass(tab === "history")}
        >
          Lịch sử chat
        </button>
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={tabClass(tab === "saved")}
        >
          Đã lưu
        </button>
        {headerAction && (
          <div className="ml-auto flex items-center pr-1">{headerAction}</div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "wiki" ? (
          <SidebarContent tree={tree} onNavigate={onNavigate} />
        ) : tab === "history" ? (
          <ChatHistory onNavigate={onNavigate} />
        ) : (
          <Bookmarks onNavigate={onNavigate} />
        )}
      </div>

      <LogoutButton />
    </div>
  );
}
