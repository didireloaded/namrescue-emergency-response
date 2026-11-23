import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, LocateFixed, Loader2, ChevronDown } from "lucide-react";
import { BackButton, Sheet } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { IMG } from "@/lib/images";
import { demo, useDemo, type EmergencyType } from "@/lib/demo-store";
import { useCitizen } from "@/lib/citizen-store";
import { useGeolocate } from "@/lib/use-geolocate";
import { searchNamibia, type Place } from "@/lib/map-service";
import { AreaSelector } from "@/components/nr/AreaSelector";
import { areaLabel, isConfiguredArea } from "@/lib/regions";

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
  const citizen = useCitizen();
  const [details, setDetails] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [questions, setQuestions] = useState(false);
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  useEffect(() => { if (citizen.preferences.locationOnRequest && !s.remoteIncident && s.status === "idle") geo.locate(); }, [geo.locate, citizen.preferences.locationOnRequest, s.remoteIncident, s.status]);
  const search = async () => {
    try { setResults(await searchNamibia(q)); } catch { setResults([]); }
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
          <LazyMap mode="locate" center={s.location.pos} accuracy={s.location.source === "gps" ? s.location.accuracy : undefined} pickEnabled onPick={(pos) => demo.setLocation({ pos, label: "Pinned location", source: "manual" })} className="absolute inset-0" label="Your location map" />
          <button onClick={geo.locate} aria-label="Use my location" className="press absolute right-3 top-3 z-[500] grid size-11 place-items-center rounded-full bg-sheet text-locate shadow-card">{geo.state === "locating" ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}</button>
          <button onClick={() => setPick(true)} className="absolute inset-x-2 bottom-2 z-[500] flex min-h-14 items-center justify-between rounded-[20px] bg-sheet px-4 text-left text-sheet-foreground shadow-card">
            <span><span className="block text-[12px] text-sheet-muted">{failed ? "Location unavailable — tap to set" : "Your location"}</span><span className="text-[15px] font-semibold">{s.location.label}</span></span>
            <ChevronRight className="size-5 text-sheet-muted" />
          </button>
        </div>
        <button onClick={() => setShowArea(true)} className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl border border-hairline bg-ink/70 px-4 text-left text-[13px] text-on-photo">
          <span>Emergency area: {isConfiguredArea(s.incidentArea) ? areaLabel(s.incidentArea) : "Confirm town (optional)"}</span><ChevronDown className="size-4" />
        </button>
        <button onClick={() => setDetails(true)} className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl border border-hairline bg-ink/70 px-4 text-left text-[13px] text-on-photo">
          <span>{s.incidentType}{s.forOther ? " · For someone else" : ""}</span><span className="flex items-center gap-1 text-on-photo-muted">Edit details <ChevronDown className="size-4" /></span>
        </button>
        <button onClick={() => { if (!demo.confirm()) setPick(true); }} className="press shadow-sos mt-4 mb-2 flex h-16 w-full items-center gap-4 rounded-full bg-sos pl-2 pr-6 text-[17px] font-semibold text-on-photo">
          <span className="grid size-12 place-items-center rounded-full bg-on-photo text-sos"><ArrowRight className="size-5" /></span>Confirm Emergency
        </button>
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} title="Set location">
        <h2 className="text-[20px] font-bold">Set location</h2>
        <p className="mt-1 text-[13px] text-sheet-muted">{s.location.source === "default" ? "Confirm a real location first. The map is currently showing a default Windhoek position." : "Search, or close and tap the map to drop a pin."}</p>
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
      <Sheet open={showArea} onClose={() => setShowArea(false)} title="Emergency area">
        <h2 className="text-[20px] font-bold">Where is the emergency?</h2>
        <p className="mt-1 mb-4 text-[13px] text-sheet-muted">This is separate from your home location. The exact map pin matters more than town boundaries.</p>
        <AreaSelector value={s.incidentArea} onChange={(area) => demo.setIncidentArea(area)} />
        {isConfiguredArea(citizen.homeArea) && <button onClick={() => demo.setIncidentArea(citizen.homeArea)} className="mt-3 min-h-11 w-full rounded-2xl border border-sheet-line text-[14px] font-semibold">Use my home town</button>}
        <button onClick={() => setShowArea(false)} className="mt-3 min-h-12 w-full rounded-full bg-sheet-foreground text-[14px] font-semibold text-sheet">Done</button>
      </Sheet>
      <Sheet open={details} onClose={() => setDetails(false)} title="Emergency details">
        <h2 className="text-[21px] font-bold">Emergency details</h2>
        <p className="mt-1 text-[13px] text-sheet-muted">Optional. Getting help must not depend on filling a form.</p>
        <p className="mt-4 text-[12px] font-semibold text-sheet-muted">TYPE OF EMERGENCY</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["Medical emergency","Road accident","Injury","Other"] as EmergencyType[]).map((kind) => (
            <button key={kind} onClick={() => demo.setDetails({ incidentType: kind })}
              className={"min-h-12 rounded-2xl border px-3 text-[13px] font-semibold " + (s.incidentType === kind ? "border-sos bg-[#FFF1F2] text-[#B42332]" : "border-sheet-line bg-on-photo text-sheet-foreground")}>{kind}</button>
          ))}
        </div>
        <p className="mt-4 text-[12px] font-semibold text-sheet-muted">WHO NEEDS HELP?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => demo.setDetails({ forOther: false, recipientId: null })} className={"min-h-12 rounded-2xl border text-[14px] font-semibold " + (!s.forOther ? "border-sos bg-[#FFF1F2] text-[#B42332]" : "border-sheet-line")}>Me</button>
          <button onClick={() => demo.setDetails({ forOther: true })} className={"min-h-12 rounded-2xl border text-[14px] font-semibold " + (s.forOther ? "border-sos bg-[#FFF1F2] text-[#B42332]" : "border-sheet-line")}>Someone else</button>
        </div>
        {s.forOther && citizen.dependants.length > 0 && <div className="mt-3"><label className="text-[12px] text-sheet-muted">Family member (optional)</label><select value={s.recipientId ?? ""} onChange={(e) => demo.setDetails({ recipientId: e.target.value || null })} className="mt-1 min-h-12 w-full rounded-xl border border-sheet-line bg-white px-3 text-[14px]"><option value="">Another person</option>{citizen.dependants.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>}
        <label className="mt-4 block text-[12px] font-semibold text-sheet-muted">DETAILS (OPTIONAL)</label>
        <textarea value={s.note} onChange={(e) => demo.setDetails({ note: e.target.value.slice(0, 500) })} placeholder="A few words to help dispatch" className="mt-2 min-h-20 w-full rounded-2xl border border-sheet-line bg-white p-3 text-[14px] text-sheet-foreground outline-none" />
        <button onClick={() => setDetails(false)} className="mt-3 min-h-13 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Done</button>
      </Sheet>
      <Sheet open={s.status === "received"} onClose={() => demo.cancel()} title="Request received">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-caution">DEMO</p>
        <h2 className="mt-1 text-[22px] font-bold">Request received</h2>
        <p className="text-[12px] text-sheet-muted">Reference {s.reference ?? "Pending"}</p>
        <p className="mt-1 flex items-center gap-1 text-[15px] text-sheet-muted">Waiting for a dispatcher<span className="animate-dot">.</span><span className="animate-dot [animation-delay:.2s]">.</span><span className="animate-dot [animation-delay:.4s]">.</span></p>
        <p className="mt-3 rounded-2xl bg-sheet-line/60 p-3 text-[13px] text-sheet-muted">No real ambulance or emergency service has been contacted.</p>
        <button onClick={() => setQuestions(v => !v)} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-2xl bg-[#EFF3F8] px-4 text-left text-[14px] font-semibold">
          {s.incidentType === "Road accident" ? "Tell us about the accident" : "What is wrong with the patient?"}
          <ChevronDown className="size-4" />
        </button>
        {questions && <div className="mt-3 space-y-3 rounded-2xl border border-sheet-line p-3">
          {s.incidentType === "Road accident" ? <>
            <label className="block text-[12px] font-semibold">Are you at the scene?</label>
            <select value={s.accident.onScene} onChange={(e) => demo.setAccidentDetails({ onScene: e.target.value as "yes" | "no" | "unsure" })} className="min-h-11 w-full rounded-xl border border-sheet-line bg-white px-3 text-[14px]">
              <option value="unsure">Not sure</option><option value="yes">Yes, at the scene</option><option value="no">No, reporting from elsewhere</option>
            </select>
            {([
              ["How many people may be injured?", "injuredCount"],
              ["How many vehicles are involved?", "vehicleCount"],
              ["Road / highway or landmark", "road"],
              ["Direction of travel", "direction"],
              ["Visible dangers (fire, traffic, fuel)", "danger"],
            ] as const).map(([label, key]) => <label key={key} className="block text-[12px] font-semibold">{label}<input value={s.accident[key]} onChange={(e) => demo.setAccidentDetails({ [key]: e.target.value.slice(0, 100) })} placeholder="Not sure" className="mt-1 min-h-11 w-full rounded-xl border border-sheet-line bg-white px-3 text-[14px] font-normal" /></label>)}
          </> : <>
            <label className="block text-[12px] font-semibold">What is happening?</label>
            <div className="grid grid-cols-2 gap-2">
              {["Difficulty breathing", "Unresponsive", "Bleeding / injury", "Severe pain", "Not sure"].map((condition) => <button key={condition} onClick={() => demo.setPatientCondition(condition)} className={"min-h-12 rounded-xl border px-2 text-[12px] font-semibold " + (s.patientCondition === condition ? "border-sos bg-[#FFF0F1] text-[#AF2936]" : "border-sheet-line")}>{condition}</button>)}
            </div>
          </>}
          <p className="text-[11px] leading-relaxed text-sheet-muted">Answers are optional. Do not put yourself in danger to gather information.</p>
        </div>
        <button onClick={() => { if (demo.assign()) nav({ to: "/tracking" }); }} className="press mt-4 h-14 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Simulate ambulance assignment</button>
        <button onClick={() => demo.cancel()} className="mt-2 h-12 w-full font-medium text-sos">Cancel request</button>
      </Sheet>
    </div>
  );
}
