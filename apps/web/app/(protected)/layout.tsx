import AppShell from "@/components/AppShell";
import { getWikiTree } from "@/lib/fs-tree";

// Layout đọc cây wiki từ filesystem (getWikiTree) để dựng sidebar. Ép động cho
// MỌI trang dùng layout này — nếu prerender tĩnh lúc build, sidebar sẽ bị đông
// cứng rỗng (trong Docker /wiki còn rỗng lúc build, chỉ mount khi container chạy).
export const dynamic = "force-dynamic";

/**
 * Layout cho các trang đã đăng nhập: bọc AppShell (sidebar + responsive drawer).
 * Mọi route trong group (protected) chỉ đến được sau khi proxy.ts xác thực phiên.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = await getWikiTree();

  return <AppShell tree={tree}>{children}</AppShell>;
}
