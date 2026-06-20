import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

import { ChatHistoryProvider } from "@/components/ChatHistoryProvider";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";

// Theme Anthropic (Streamlit): Space Grotesk cho body + heading, Space Mono cho code.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLM Wiki",
  description: "Trình xem wiki cho knowledge vault với tìm kiếm RAG",
};

/**
 * Root layout: chỉ dựng khung <html>/<body> + provider dùng chung.
 * Sidebar/AppShell nằm ở layout của route group (protected) — vì trang /login
 * KHÔNG có sidebar. ChatHistoryProvider để ở đây cho mọi trang dùng chung state.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      // data-theme do ThemeScript set trước hydrate → tránh nhấp nháy; bỏ qua
      // mismatch attribute này khi hydrate.
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      {/* suppressHydrationWarning: bỏ qua mismatch do extension trình duyệt
          (vd Grammarly chèn data-gr-* vào <body>) — chỉ ở attribute của thẻ này. */}
      <body
        className="min-h-full bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ChatHistoryProvider>{children}</ChatHistoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
