import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import { getWikiTree } from "@/lib/fs-tree";

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
  description: "Trình xem wiki cho Obsidian vault",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = await getWikiTree();

  return (
    <html
      lang="vi"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="flex h-screen">
          <Sidebar tree={tree} />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
