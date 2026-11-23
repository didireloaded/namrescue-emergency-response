import { createFileRoute, Link } from "@tanstack/react-router";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [
    { title: "Event summary — NamRescue demo" },
    { name: "description", content: "Summary of a simulated ambulance request." },
    { property: "og:title", content: "Event summary — NamRescue demo" },
    { property: "og:description", content: "Summary of a simulated ambulance request." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Summary,
});

const t = (n: number | null) => (n ? new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");

function Summary() {
  const s = useDemo();
  const rows = [["Request received (demo)", s.requestedAt], ["Ambulance assigned (simulated)", s.assignedAt], ["Arrived (simulated)", s.arrivedAt]] as const;
  return (
    <div className="flex h-full flex-col bg-sheet px-6 pt-safe pb-safe text-sheet-foreground">
      <h1 className="mt-12 text-[28px] font-bold">Event summary</h1>
      <p className="text-[14px] text-sheet-muted">{s.location.label}</p>
      <ol className="mt-6 space-y-3">{rows.map(([l, v]) => <li key={l} className="flex justify-between rounded-2xl border border-sheet-line bg-on-photo p-4 text-[15px]"><span>{l}</span><span className="tabular text-sheet-muted">{t(v)}</span></li>)}</ol>
      <p className="mt-4 text-[13px] text-sheet-muted">Prototype only. No dispatch occurred and no data was stored.</p>
      <Link to="/" className="press mt-auto mb-4 grid h-14 place-items-center rounded-full bg-sheet-foreground font-semibold text-sheet">Done</Link>
    </div>
  );
}
