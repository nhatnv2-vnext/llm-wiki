"use client";

import { useState } from "react";

import Bookmarks from "@/components/Bookmarks";
import ChatHistory from "@/components/ChatHistory";
import LogoutButton from "@/components/LogoutButton";
import SettingsModal from "@/components/SettingsModal";
import SidebarContent from "@/components/Sidebar";
import type { WikiNode } from "@/lib/fs-tree";
import type { ProjectInfo } from "@/lib/projects";

/**
 * Sidebar 3 tab:
 *  - "Wiki": cây thư mục wiki (SidebarContent hiện có).
 *  - "Lịch sử": danh sách hội thoại chat đã lưu.
 *  - "Đã lưu": các trang wiki đã bookmark.
 *
 * Chân sidebar có thanh "Cài đặt" mở SettingsModal (giao diện / ngôn ngữ /
 * cá nhân / dự án).
 */
export default function SidebarTabs({
  tree,
  email,
  projects,
  onNavigate,
  headerAction,
}: {
  tree: WikiNode[];
  email: string | null;
  projects: ProjectInfo[];
  onNavigate?: () => void;
  /** Nút phụ render bên phải thanh tab (vd nút thu gọn sidebar trên desktop). */
  headerAction?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"wiki" | "history" | "saved">("wiki");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      {/* Thanh Cài đặt ở chân sidebar */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-hover"
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Cài đặt
        </button>
      </div>

      <LogoutButton />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        email={email}
        projects={projects}
      />
    </div>
  );
}
