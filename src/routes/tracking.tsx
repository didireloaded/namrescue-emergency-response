import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, LocateFixed, Users, Phone, ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { demo, useDemo } from "@/lib/demo-store";
import { etaMinutes, tripProgress } from "@/lib/demo-sim";
import { IMG } from "@/lib/images";
import { EmergencyCallSheet } from "@/components/nr/EmergencyCallSheet";

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [
    { title: "Ambulance En Route — NamRescue demo" },
    { name: "description", content: "Simulated ambulance tracking on a Windhoek map." },
    { property: "og:title", content: "Ambulance En Route — NamRescue demo" },
    { property: "og:description", content: "Simulated ambulance tracking on a Windhoek map." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Tracking,
});

function Tracking() {
  const s = useDemo();
  const nav = useNavigate();
  const [now, setNow] = useState(() => 0);
  const [rk, setRk] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const p = tripProgress(s.assignedAt, now || (s.assignedAt ?? 0));
  const from: [number, number] = [s.location.pos[0] - 0.018, s.location.pos[1] + 0.024];
  if (s.status !== "assigned" && s.status !== "arrived") return <div className="flex h-full flex-col items-start justify-center bg-ink px-7 text-on-photo"><h1 className="text-[27px] font-bold">No ambulance assigned</h1><p className="mt-3 text-[15px] text-on-photo-muted">A response team must be assigned before tracking is available.</p><Link to="/" className="mt-6 rounded-full bg-sos px-6 py-4 font-semibold">Return to SOS</Link></div>;
  return (
    <div className="relative h-full bg-ink">
      <LazyMap mode="tracking" center={s.location.pos} from={from} progress={p} recenterKey={rk} className="absolute inset-x-0 top-0 h-[72%] isolate" label="Simulated ambulance route map" />
      <div className="photo-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-40" />
      <div className="absolute inset-x-5 z-20 flex justify-between" style={{ top: "calc(var(--safe-top) + 8px)" }}>
        <BackButton to="/request" />
        <button aria-label="Recenter route" onClick={() => setRk((k) => k + 1)} className="press grid size-11 place-items-center rounded-full border border-hairline bg-ink/55 text-on-photo"><LocateFixed className="size-5" /></button>
      </div>
      <section className="animate-sheet-up absolute inset-x-0 bottom-0 z-30 rounded-t-[32px] border-t border-hairline bg-ink px-6 pt-6 pb-safe shadow-sheet">
        <div className="flex items-start justify-between">
          <h1 className="text-[24px] font-semibold leading-tight text-on-photo">Ambulance<br />En Route</h1>
          <span className="rounded-full border border-caution/50 px-2.5 py-1 text-[11px] font-semibold text-caution">Demo</span>
        </div>
        <p className="mt-3 text-[64px] font-bold leading-none tracking-tight tabular text-on-photo">{etaMinutes(p)} min</p>
        <p className="mt-1 text-[13px] text-on-photo-muted">Estimated arrival · simulation, not live GPS</p>
        <div className="mt-4 h-1 rounded-full bg-ink-3"><div className="h-1 rounded-full bg-sos transition-[width] duration-1000" style={{ width: `${Math.max(4, p * 100)}%` }} /></div>
        <Link to="/team" className="mt-4 flex min-h-[66px] items-center gap-3 rounded-[20px] border border-hairline bg-ink-2 p-2.5 text-on-photo">
          <img src={IMG.driver} alt="Example responder portrait" className="size-12 rounded-[14px] object-cover" />
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">Response team</span><span className="block text-[12px] text-on-photo-muted">Sample photo · Demo Unit 07</span><span className="mt-0.5 flex items-center gap-1 text-[11px] text-on-photo-muted"><ShieldCheck className="size-3.5" /> Crew identity and registration unverified</span></span>
          <ChevronRight className="size-4" />
        </Link>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 pb-3">
          <button onClick={() => setCallOpen(true)} className="press flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink-2 px-4 text-[13px] font-semibold text-on-photo"><Phone className="size-4" />Emergency calls</button>
          <button onClick={() => { demo.arrive(); nav({ to: "/arrived" }); }} className="press min-h-12 rounded-full bg-on-photo px-4 text-[14px] font-semibold text-ink">Simulate arrival</button>
        </div>
      </section>
      <EmergencyCallSheet open={callOpen} onClose={() => setCallOpen(false)} initialArea={s.incidentArea} />
    </div>
  );
}
