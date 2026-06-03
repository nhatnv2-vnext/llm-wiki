"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Render một sơ đồ Mermaid ở phía client.
 * Mermaid thao tác DOM nên phải chạy trong useEffect (không SSR được).
 */
export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawId = useId();
  // id của mermaid phải hợp lệ làm CSS selector — bỏ ký tự ":".
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
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
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-muted p-3 text-sm text-red-600">
        Mermaid lỗi: {error}
        {"\n\n"}
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto"
      aria-label="Sơ đồ Mermaid"
    />
  );
}
