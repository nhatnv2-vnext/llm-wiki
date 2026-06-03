"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { WikiGraph as WikiGraphData } from "@/lib/graph";

// react-force-graph cần `window` -> chỉ tải ở client, không SSR.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type ForceNode = {
  id: string;
  name: string;
  val: number;
  x?: number;
  y?: number;
};

export default function WikiGraph({ data }: { data: WikiGraphData }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Theo dõi kích thước container để canvas lấp đầy.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lấy màu theme từ CSS variable (accent / foreground).
  const colors = useMemo(() => {
    if (typeof window === "undefined") {
      return { accent: "#bb5a38", muted: "#6b6759", text: "#1a1a18" };
    }
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;
    return {
      accent: v("--accent", "#bb5a38"),
      muted: v("--border", "#ddd9cc"),
      text: v("--foreground", "#1a1a18"),
    };
  }, []);

  const handleClick = useCallback(
    (node: ForceNode) => {
      router.push(`/wiki/${node.id}`);
    },
    [router],
  );

  const paintNode = useCallback(
    (node: ForceNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const r = Math.max(2, Math.sqrt(node.val) * 2);
      const isHover = node.id === hoverId;

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
      ctx.fillStyle = colors.accent;
      ctx.fill();
      if (isHover) {
        ctx.lineWidth = 1.5 / scale;
        ctx.strokeStyle = colors.text;
        ctx.stroke();
      }

      // Nhãn: luôn hiện khi zoom đủ gần, hoặc khi hover.
      if (scale > 1.5 || isHover) {
        const fontSize = Math.min(4, 12 / scale);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(node.name, node.x ?? 0, (node.y ?? 0) + r + 1);
      }
    },
    [colors, hoverId],
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && (
        <ForceGraph2D
          graphData={data}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={4}
          nodeColor={() => colors.accent}
          linkColor={() => colors.muted}
          linkDirectionalParticles={0}
          linkWidth={1}
          onNodeClick={(n) => handleClick(n as ForceNode)}
          onNodeHover={(n) => setHoverId((n as ForceNode | null)?.id ?? null)}
          nodeCanvasObject={(n, ctx, scale) =>
            paintNode(n as ForceNode, ctx, scale)
          }
          nodePointerAreaPaint={(n, color, ctx) => {
            const node = n as ForceNode;
            const r = Math.max(4, Math.sqrt(node.val) * 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
            ctx.fill();
          }}
          cooldownTicks={100}
        />
      )}
    </div>
  );
}
