import WikiGraph from "@/components/WikiGraph";
import { getWikiGraph } from "@/lib/graph";

export const metadata = {
  title: "Đồ thị wiki",
};

export default async function GraphPage() {
  const data = await getWikiGraph();

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Đồ thị wiki
          </h1>
          <p className="text-sm text-muted">
            {data.nodes.length} ghi chú · {data.links.length} liên kết — bấm vào
            một node để mở.
          </p>
        </div>
        {/* Chú thích thang màu theo số đầu mục */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Ít đầu mục</span>
          <span
            aria-hidden
            className="h-2.5 w-24 rounded-full"
            style={{
              background: "linear-gradient(90deg, #d6c7b5, #a63c26)",
            }}
          />
          <span>Nhiều</span>
        </div>
      </header>
      <div className="bg-dotgrid relative flex-1">
        <WikiGraph data={data} />
      </div>
    </div>
  );
}
