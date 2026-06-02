import Link from "next/link";

import type { WikiNode } from "@/lib/fs-tree";

function TreeItems({ nodes }: { nodes: WikiNode[] }) {
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
                <TreeItems nodes={node.children} />
              </div>
            )}
          </li>
        ) : (
          <li key={node.slug}>
            <Link
              href={`/wiki/${node.slug}`}
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

/** Sidebar điều hướng, render từ cây thư mục wiki (Server Component). */
export default function Sidebar({ tree }: { tree: WikiNode[] }) {
  return (
    <nav className="h-full w-64 shrink-0 overflow-y-auto border-r border-border bg-surface-muted p-3">
      <Link href="/" className="mb-4 flex items-center gap-2 px-2 pt-1">
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full bg-accent"
        />
        <span className="font-serif text-lg font-semibold text-foreground">
          LLM Wiki
        </span>
      </Link>
      <TreeItems nodes={tree} />
    </nav>
  );
}
