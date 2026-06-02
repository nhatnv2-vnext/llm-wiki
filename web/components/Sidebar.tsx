import Link from "next/link";

import type { WikiNode } from "@/lib/fs-tree";

function TreeItems({ nodes }: { nodes: WikiNode[] }) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) =>
        node.type === "dir" ? (
          <li key={node.slug}>
            <span className="block px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {node.name}
            </span>
            {node.children && node.children.length > 0 && (
              <div className="ml-2 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                <TreeItems nodes={node.children} />
              </div>
            )}
          </li>
        ) : (
          <li key={node.slug}>
            <Link
              href={`/wiki/${node.slug}`}
              className="block rounded px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
    <nav className="h-full w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <Link
        href="/"
        className="mb-3 block px-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        LLM Wiki
      </Link>
      <TreeItems nodes={tree} />
    </nav>
  );
}
