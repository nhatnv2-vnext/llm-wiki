import Link from "next/link";

import type { WikiNode } from "@/lib/fs-tree";

function TreeItems({
  nodes,
  onNavigate,
}: {
  nodes: WikiNode[];
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) =>
        node.type === "dir" ? (
          <li key={node.slug}>
            <span className="mt-3 block px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {node.name}
            </span>
            {node.children && node.children.length > 0 && (
              <div className="ml-2 border-l border-border pl-2">
                <TreeItems nodes={node.children} onNavigate={onNavigate} />
              </div>
            )}
          </li>
        ) : (
          <li key={node.slug}>
            <Link
              href={`/wiki/${node.slug}`}
              onClick={onNavigate}
              className="block rounded-lg px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent-soft hover:text-accent-hover"
            >
              {node.name}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

/**
 * Nội dung sidebar (header + cây điều hướng). Dùng chung cho cả sidebar
 * desktop và drawer mobile. `onNavigate` được gọi khi bấm một link —
 * dùng để đóng drawer trên mobile.
 */
export default function SidebarContent({
  tree,
  onNavigate,
}: {
  tree: WikiNode[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="h-full overflow-y-auto bg-surface-muted p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2 px-2 pt-1"
      >
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full bg-accent"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">
          LLM Wiki
        </span>
      </Link>
      <TreeItems nodes={tree} onNavigate={onNavigate} />
    </nav>
  );
}
