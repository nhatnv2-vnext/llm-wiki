import WikiGraph from "@/components/WikiGraph";
import { getWikiGraph } from "@/lib/graph";

export const metadata = {
  title: "Đồ thị wiki",
};

export default async function GraphPage() {
  const data = await getWikiGraph();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Đồ thị wiki
        </h1>
        <p className="text-sm text-muted">
          {data.nodes.length} ghi chú · {data.links.length} liên kết — bấm vào
          một node để mở.
        </p>
      </header>
      <div className="relative flex-1">
        <WikiGraph data={data} />
      </div>
    </div>
  );
}
