import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, LocateFixed, Loader2 } from "lucide-react";
import { BackButton, Sheet } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { IMG } from "@/lib/images";
import { demo, useDemo } from "@/lib/demo-store";
import { useGeolocate } from "@/lib/use-geolocate";

export const Route = createFileRoute("/request")({
  head: () => ({ meta: [
    { title: "Request an Ambulance — NamRescue demo" },
    { name: "description", content: "Confirm your location for a simulated ambulance request." },
    { property: "og:title", content: "Request an Ambulance — NamRescue demo" },
    { property: "og:description", content: "Confirm your location for a simulated ambulance request." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Request,
});

function Request() {
  const s = useDemo();
  const nav = useNavigate();
  const geo = useGeolocate();
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  useEffect(() => { geo.locate(); }, [geo.locate]);
  const search = async () => {
    try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=na&limit=5&q=${encodeURIComponent(q)}`); setResults(await r.json()); } catch { setResults([]); }
  };
  const failed = geo.state === "denied" || geo.state === "unavailable";
  return (
    <div className="relative flex h-full flex-col bg-ink">
      <img src={IMG.nightLights} alt="Red ambulance with emergency lights at night" className="absolute inset-x-0 top-0 h-[58%] w-full object-cover" />
      <div className="photo-fade-bottom absolute inset-x-0 top-0 h-[58%]" />
      <div className="relative z-10 px-5 pt-safe"><div className="mt-2"><BackButton to="/" /></div></div>
      <div className="relative z-10 mt-auto px-5 pb-safe">
        <h1 className="px-2.5 text-[38px] font-bold leading-[1.05] tracking-tight text-on-photo">Request<br />an Ambulance</h1>
        <div className="relative mt-5 h-[clamp(180px,26dvh,220px)] overflow-hidden rounded-[28px] bg-sheet isolate">
          <LazyMap mode="locate" center={s.location.pos} pickEnabled onPick={(pos) => demo.setLocation({ pos, label: "Pinned location", source: "manual" })} className="absolute inset-0" label="Your location map" />
          <button onClick={geo.locate} aria-label="Use my location" className="press absolute right-3 top-3 z-[500] grid size-11 place-items-center rounded-full bg-sheet text-locate shadow-card">{geo.state === "locating" ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}</button>
          <button onClick={() => setPick(true)} className="absolute inset-x-2 bottom-2 z-[500] flex min-h-14 items-center justify-between rounded-[20px] bg-sheet px-4 text-left text-sheet-foreground shadow-card">
            <span><span className="block text-[12px] text-sheet-muted">{failed ? "Location unavailable — tap to set" : "Your location"}</span><span className="text-[15px] font-semibold">{s.location.label}</span></span>
            <ChevronRight className="size-5 text-sheet-muted" />
          </button>
        </div>
        <button onClick={() => demo.confirm()} className="press shadow-sos mt-4 mb-2 flex h-16 w-full items-center gap-4 rounded-full bg-sos pl-2 pr-6 text-[17px] font-semibold text-on-photo">
          <span className="grid size-12 place-items-center rounded-full bg-on-photo text-sos"><ArrowRight className="size-5" /></span>Confirm Emergency
        </button>
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} title="Set location">
        <h2 className="text-[20px] font-bold">Set location</h2>
        <p className="mt-1 text-[13px] text-sheet-muted">Search, or close and tap the map to drop a pin.</p>
        <div className="mt-4 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Street or suburb, Namibia" className="min-h-12 flex-1 rounded-2xl border border-sheet-line bg-on-photo px-4 text-[15px] outline-none" />
          <button onClick={search} className="rounded-2xl bg-sheet-foreground px-4 font-semibold text-sheet">Search</button>
        </div>
        <ul className="mt-3 max-h-48 overflow-auto">
          {results.map((r) => (
            <li key={r.lat + r.lon}><button className="min-h-12 w-full border-b border-sheet-line py-2 text-left text-[14px]" onClick={() => { demo.setLocation({ pos: [+r.lat, +r.lon], label: r.display_name.split(",").slice(0, 2).join(","), source: "manual" }); setPick(false); }}>{r.display_name}</button></li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={s.status === "received"} onClose={() => demo.cancel()} title="Request received">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-caution">DEMO</p>
        <h2 className="mt-1 text-[22px] font-bold">Request received</h2>
        <p className="mt-1 flex items-center gap-1 text-[15px] text-sheet-muted">Waiting for a dispatcher<span className="animate-dot">.</span><span className="animate-dot [animation-delay:.2s]">.</span><span className="animate-dot [animation-delay:.4s]">.</span></p>
        <p className="mt-3 rounded-2xl bg-sheet-line/60 p-3 text-[13px] text-sheet-muted">No real ambulance or emergency service has been contacted.</p>
        <button onClick={() => { demo.assign(); nav({ to: "/tracking" }); }} className="press mt-4 h-14 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Simulate ambulance assignment</button>
        <button onClick={() => demo.cancel()} className="mt-2 h-12 w-full font-medium text-sos">Cancel request</button>
      </Sheet>
    </div>
  );
}
