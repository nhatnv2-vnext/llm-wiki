"use server";

import { redirect } from "next/navigation";

import { deleteSession } from "@/lib/session";

/** Server Action đăng xuất: xóa cookie phiên rồi chuyển về /login. */
export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
