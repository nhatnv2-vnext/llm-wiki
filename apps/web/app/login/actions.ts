"use server";

import { redirect } from "next/navigation";

import { verifyCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

/**
 * Server Action xử lý form đăng nhập.
 * Trả về { error } để form hiển thị, hoặc redirect về trang chủ khi thành công.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  const verified = await verifyCredentials(email, password);
  if (!verified) {
    // Thông báo chung chung — không tiết lộ email có tồn tại hay không.
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  await createSession(verified);
  // redirect() ném lỗi điều hướng — phải gọi NGOÀI try/catch.
  redirect("/");
}
