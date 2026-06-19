"use client";

import { useEffect, useId, useState } from "react";

import { useTheme } from "@/components/ThemeProvider";

/**
 * Render một sơ đồ Mermaid ở phía client.
 * Mermaid thao tác DOM nên phải chạy trong useEffect (không SSR được).
 * Bấm vào sơ đồ -> mở lightbox phóng to (đóng bằng X / Esc / click nền).
 */
export default function Mermaid({ chart }: { chart: string }) {
  // Theo theme người dùng chọn (không đọc thẳng prefers-color-scheme nữa) để
  // sơ đồ đổi màu đồng bộ khi đổi theme trong Settings.
  const { resolved } = useTheme();
  const rawId = useId();
  // id của mermaid phải hợp lệ làm CSS selector — bỏ ký tự ":".
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = resolved === "dark";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "neutral",
          themeVariables: isDark
            ? {
                primaryTextColor: "#eceae1",
                lineColor: "#a8a290",
                textColor: "#eceae1",
                labelTextColor: "#eceae1",
                noteBkgColor: "#2b2a25",
                noteTextColor: "#eceae1",
                activationBorderColor: "#cd7a5a",
              }
            : {
                primaryTextColor: "#1a1a18",
                lineColor: "#6b6759",
                textColor: "#1a1a18",
                labelTextColor: "#1a1a18",
              },
        });
        const res = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(res.svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Lỗi render Mermaid");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolved]);

  // Đóng lightbox bằng Esc + khoá scroll nền khi mở.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-muted p-3 text-sm text-red-600">
        Mermaid lỗi: {error}
        {"\n\n"}
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 h-24 animate-pulse rounded-lg bg-surface-muted" />
    );
  }

  return (
    <>
      {/* Sơ đồ inline — bấm để phóng to */}
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Phóng to sơ đồ"
        className="group relative my-4 block w-full overflow-x-auto rounded-lg border border-border bg-surface/40 p-2 transition-colors hover:border-accent"
      >
        <span
          className="mermaid-svg flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/* gợi ý phóng to */}
        <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-foreground/70 px-1.5 py-0.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4M11 8v6M8 11h6" />
          </svg>
          Phóng to
        </span>
      </button>

      {/* Lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          onClick={() => setZoomed(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw] overflow-auto rounded-xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Đóng"
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-accent-hover"
            >
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
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div
              className="[&_svg]:h-auto! [&_svg]:max-w-none! [&_svg]:w-[min(90vw,1400px)]!"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
