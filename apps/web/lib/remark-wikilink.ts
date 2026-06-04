import type { Root, Text, Link, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { resolveWikiLink } from "@/lib/fs-tree";

/** Cú pháp: [[target]] hoặc [[target|nhãn hiển thị]]. */
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Remark plugin: chuyển `[[Tên bài|nhãn]]` trong text node thành:
 *  - link nội bộ tới /wiki/<slug> nếu resolve được slug,
 *  - hoặc text gạch (nhãn) nếu không tìm thấy bài (broken link).
 *
 * Cần truyền sẵn `index` (title/tên -> slug) build từ cây thư mục.
 */
const remarkWikilink: Plugin<[{ index: Map<string, string> }], Root> = ({
  index,
}) => {
  return (tree) => {
    visit(tree, "text", (node: Text, i, parent) => {
      if (i === null || i === undefined || !parent) return;
      const value = node.value;
      if (!value.includes("[[")) return;

      const children: PhrasingContent[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      WIKILINK_RE.lastIndex = 0;

      while ((m = WIKILINK_RE.exec(value)) !== null) {
        const [full, target, label] = m;
        const display = (label ?? target).trim();

        if (m.index > last) {
          children.push({ type: "text", value: value.slice(last, m.index) });
        }

        const slug = resolveWikiLink(target, index);
        if (slug) {
          const link: Link = {
            type: "link",
            url: `/wiki/${slug}`,
            children: [{ type: "text", value: display }],
          };
          children.push(link);
        } else {
          // Liên kết hỏng: hiển thị nhãn nhưng đánh dấu (emphasis) để dễ nhận biết.
          children.push({
            type: "emphasis",
            children: [{ type: "text", value: display }],
          });
        }

        last = m.index + full.length;
      }

      if (last < value.length) {
        children.push({ type: "text", value: value.slice(last) });
      }

      // Thay text node hiện tại bằng các node mới.
      parent.children.splice(i, 1, ...children);
      return i + children.length;
    });
  };
};

export default remarkWikilink;
