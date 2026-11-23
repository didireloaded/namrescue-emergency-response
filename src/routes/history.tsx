import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/nr/chrome";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [
    { title: "History — NamRescue demo" }, { name: "description", content: "Your simulated requests." },
    { property: "og:title", content: "History — NamRescue demo" }, { property: "og:description", content: "Your simulated requests." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => { const s = useDemo(); return (
    <div className="flex h-full flex-col bg-ink text-on-photo"><div className="flex-1 overflow-auto px-6 pt-safe"><h1 className="mt-12 text-[28px] font-bold">History</h1>
      {s.history.length === 0 ? <p className="mt-4 text-[14px] text-on-photo-muted">No requests yet. Simulated requests appear here for this session only.</p> :
        <ul className="mt-4 space-y-2">{s.history.map((h) => <li key={h.id} className="rounded-2xl border border-hairline bg-ink-2 p-4"><p className="font-semibold">{h.label}</p><p className="text-[13px] text-on-photo-muted">{new Date(h.at).toLocaleString()} · simulated</p></li>)}</ul>}
    </div><BottomNav active="/history" /></div>
  ); },
});
