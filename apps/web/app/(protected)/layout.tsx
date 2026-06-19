import AppShell from "@/components/AppShell";
import { getWikiTree } from "@/lib/fs-tree";
import { listProjects } from "@/lib/projects";
import { getSession } from "@/lib/session";

// Layout đọc cây wiki từ filesystem (getWikiTree) để dựng sidebar. Ép động cho
// MỌI trang dùng layout này — nếu prerender tĩnh lúc build, sidebar sẽ bị đông
// cứng rỗng (trong Docker /wiki còn rỗng lúc build, chỉ mount khi container chạy).
export const dynamic = "force-dynamic";

/**
 * Layout cho các trang đã đăng nhập: bọc AppShell (sidebar + responsive drawer).
 * Mọi route trong group (protected) chỉ đến được sau khi proxy.ts xác thực phiên.
 *
 * Đọc sẵn email phiên + danh sách dự án (read-only) ở server để truyền cho
 * Settings (thông tin cá nhân / dự án) — tránh client phải gọi thêm API.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tree, session, projects] = await Promise.all([
    getWikiTree(),
    getSession(),
    listProjects(),
  ]);

  return (
    <AppShell tree={tree} email={session?.email ?? null} projects={projects}>
      {children}
    </AppShell>
  );
}
