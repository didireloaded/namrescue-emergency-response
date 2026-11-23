import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LocateFixed, MapPin, Search, Send, X, ArrowRight } from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { demo, isActive, useDemo } from "@/lib/demo-store";
import { useGeolocate } from "@/lib/use-geolocate";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [
    { title: "Location Map | NamRescue" },
    { name: "description", content: "Find and confirm an emergency location." },
  ] }),
  component: MapScreen,
});
type Place = { display_name: string; lat: string; lon: string };
function MapScreen() {
  const s = useDemo();
  const geo = useGeolocate();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const locked = isActive(s.status);
  const search = async () => {
    if (query.trim().length < 3) return;
    setSearching(true); setError("");
    try {
      const url = "https://nominatim.openstreetmap.org/search?format=json&countrycodes=na&limit=5&q=" + encodeURIComponent(query.trim());
      const response = await fetch(url);
      if (!response.ok) throw new Error("search unavailable");
      const json = await response.json() as Place[];
      setResults(json);
      if (!json.length) setError("No places found. Try another address or tap the map.");
    } catch { setError("Address lookup unavailable. You can still tap the map."); }
    finally { setSearching(false); }
  };
  const share = async () => {
    if (s.location.source === "default") { setError("Choose your location first."); return; }
    const text = "Location: " + s.location.label + "\nhttps://www.openstreetmap.org/?mlat=" + s.location.pos[0] + "&mlon=" + s.location.pos[1] + "#map=16/" + s.location.pos[0] + "/" + s.location.pos[1];
    try {
      if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: "My location", text });
      else if (typeof navigator !== "undefined" && navigator.clipboard) { await navigator.clipboard.writeText(text); setError("Location link copied."); }
      else setError("Sharing is not available on this device.");
    } catch { /* User cancelled system share sheet. */ }
  };
  return <div className="flex h-full flex-col bg-[#162235]">
    <div className="relative min-h-0 flex-1 isolate">
      <LazyMap
        mode="locate" center={s.location.pos} accuracy={s.location.source === "gps" ? s.location.accuracy : undefined}
        pickEnabled={!locked}
        onPick={(pos) => { demo.setLocation({ pos, label: "Dropped pin", source: "manual", observedAt: Date.now() }); setResults([]); }}
        className="absolute inset-0"
        label="NamRescue interactive location map"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-[170px] bg-gradient-to-b from-[#142136]/80 to-transparent" />
      <div className="absolute inset-x-4 z-[600] top-[calc(var(--safe-top)+18px)]">
        <div className="flex items-center gap-2 rounded-[18px] bg-white p-2 shadow-lg">
          <Search className="ml-2 size-5 shrink-0 text-[#65748B]" />
          <input aria-label="Search Namibia locations" value={query} onChange={(e) => { setQuery(e.target.value); if (results.length) setResults([]); }} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Street, suburb or landmark" className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-[#162235] outline-none" />
          {query && <button onClick={() => { setQuery(""); setResults([]); setError(""); }} aria-label="Clear search" className="grid size-9 place-items-center text-[#5E6A7B]"><X className="size-4" /></button>}
          <button onClick={search} disabled={searching || locked} aria-label="Search location" className="grid size-10 place-items-center rounded-[13px] bg-[#162235] text-white"><ArrowRight className="size-5" /></button>
        </div>
        {results.length > 0 && <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl bg-white p-1 shadow-lg">
          {results.map((p) => <button key={p.lat + p.lon} onClick={() => { demo.setLocation({ pos: [+p.lat, +p.lon], label: p.display_name.split(",").slice(0,2).join(","), source:"manual", observedAt: Date.now() }); setResults([]); setQuery(""); }} className="min-h-12 w-full border-b border-[#EEF1F5] px-3 py-2 text-left text-[13px] text-[#24344C] last:border-b-0">{p.display_name}</button>)}
        </div>}
      </div>
      <button aria-label="Locate me" onClick={geo.locate} disabled={locked} className="absolute right-4 top-[calc(var(--safe-top)+105px)] z-[550] grid size-12 place-items-center rounded-full bg-white text-[#246BCB] shadow-lg"><LocateFixed className="size-5" /></button>
      <div className="absolute inset-x-4 bottom-4 z-[550] rounded-[26px] bg-white p-4 text-[#152235] shadow-xl">
        <div className="flex gap-3">
          <span className="grid size-10 place-items-center rounded-[14px] bg-[#EFF4FA] text-[#1F67B9]"><MapPin className="size-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-[12px] text-[#64748B]">{locked ? "Emergency location locked" : s.location.source === "default" ? "Choose an emergency location" : "Selected location"}</p><p className="truncate text-[15px] font-bold">{s.location.source === "default" ? "Windhoek map preview" : s.location.label}</p>
            <p className="mt-1 text-[11px] text-[#7D8A9D]">{s.location.source === "gps" && s.location.accuracy ? "GPS accuracy ±" + Math.round(s.location.accuracy) + " m" : s.location.source === "manual" ? "Pinned manually · check road access" : "Tap the map or use GPS"}</p>
          </div>
          <button onClick={share} aria-label="Share selected location" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#E2E8F0] text-[#1F67B9]"><Send className="size-5" /></button>
        </div>
        {error && <p role="status" className="mt-2 text-[12px] text-[#9B3441]">{error}</p>}
        {!locked && <button onClick={() => { demo.start(false); nav({ to: "/request" }); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#D92232] text-[14px] font-semibold text-white">Request ambulance here <ArrowRight className="size-4" /></button>}
        {locked && <button onClick={() => nav({ to: s.status === "assigned" ? "/tracking" : "/request" })} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#162235] text-[14px] font-semibold text-white">View active request <ArrowRight className="size-4" /></button>}
      </div>
    </div>
    <BottomNav active="/map" />
  </div>;
}
