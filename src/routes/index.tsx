import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ambulance, Bell, Phone, Users, MapPin, Navigation, CarFront, ChevronDown } from "lucide-react";
import { BottomNav, Sheet } from "@/components/nr/chrome";
import { IMG } from "@/lib/images";
import { demo, useDemo } from "@/lib/demo-store";
import { citizen, useCitizen } from "@/lib/citizen-store";
import { AreaSelector } from "@/components/nr/AreaSelector";
import { EmergencyCallSheet } from "@/components/nr/EmergencyCallSheet";
import { areaLabel, isConfiguredArea } from "@/lib/regions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NamRescue — Get emergency medical help (demo)" },
    { name: "description", content: "Prototype SOS screen for requesting an ambulance in Namibia. Demo only." },
    { property: "og:title", content: "NamRescue — Get emergency medical help (demo)" },
    { property: "og:description", content: "Prototype SOS screen for requesting an ambulance in Namibia. Demo only." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const incident = useDemo();
  const profile = useCitizen();
  const [callOpen, setCallOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  useEffect(() => { try { if (!window.localStorage.getItem("nr-welcome-dismissed")) setWelcome(true); } catch { /* optional browser preference unavailable */ } }, []);
  const dismissWelcome = () => { setWelcome(false); try { window.localStorage.setItem("nr-welcome-dismissed", "1"); } catch { /* no preference stored */ } };
  const [sheet, setSheet] = useState<null | "other" | "notifications">(null);
  const openEmergency = () => {
    if (incident.status === "arrived") return nav({ to: "/arrived" });
    if (incident.status === "assigned") return nav({ to: "/tracking" });
    if (incident.status === "received") return nav({ to: "/request" });
    demo.start(false);
    nav({ to: "/request" });
  };
  return (
    <div className="relative flex h-full flex-col bg-ink">
      <img src={IMG.windhoek} alt="Windhoek city skyline" className="absolute inset-x-0 top-0 h-[62%] w-full object-cover brightness-[.7] saturate-[.8]" />
      <div className="photo-fade-bottom absolute inset-x-0 top-0 h-[62%]" />
      <header className="relative z-10 flex items-start justify-between px-[26px] pt-safe">
        <div className="mt-3">
          <p className="text-[20px] font-bold tracking-tight text-on-photo"><span className="text-sos-bright">+</span> NamRescue</p>
          <p className="text-[12px] text-on-photo-muted">Emergency Medical Services</p>
          <button onClick={() => setAreaOpen(true)} className="mt-4 flex min-h-10 items-center gap-1.5 rounded-full border border-white/25 bg-ink/60 px-3 text-left text-[12px] font-semibold text-white">
            <MapPin className="size-3.5 text-sos-bright" /> {areaLabel(profile.homeArea)} <ChevronDown className="size-3" />
          </button>
        </div>
        <button aria-label="Notifications" onClick={() => setSheet("notifications")} className="press mt-2 grid size-11 place-items-center rounded-full border border-hairline bg-ink/50 text-on-photo"><Bell className="size-5" /></button>
      </header>
      <h1 className="animate-rise relative z-10 mt-auto px-[26px] text-[42px] font-bold leading-[1.03] tracking-tight text-on-photo">Get<br />emergency<br />medical help.</h1>
      <div className="relative z-10 space-y-3 px-5 pb-4 pt-6">
        <button onClick={openEmergency} className="press shadow-sos flex h-[132px] w-full items-center gap-5 rounded-[28px] border-t border-sos-bright bg-sos px-6 text-left text-on-photo">
          <span className="grid size-16 place-items-center rounded-full bg-on-photo/15"><Ambulance className="size-8" /></span>
          <span><span className="block text-[48px] font-bold leading-none tracking-tight">{incident.status === "arrived" ? "On site" : incident.status === "received" ? "Pending" : incident.status === "assigned" ? "Track" : "SOS"}</span><span className="text-[14px] font-medium opacity-90">{incident.status === "arrived" ? "View arrival details" : incident.status === "received" ? "View request status" : incident.status === "assigned" ? "Ambulance tracking" : "Request Ambulance"}</span></span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setCallOpen(true)} className="press flex h-[88px] flex-col justify-between rounded-[22px] border border-hairline bg-ink-2 p-4 text-left text-on-photo"><Phone className="size-5" /><span className="text-[15px] font-semibold">Call</span></button>
          <button onClick={() => setSheet("other")} className="press flex h-[88px] flex-col justify-between rounded-[22px] border border-hairline bg-ink-2 p-4 text-left text-on-photo"><Users className="size-5" /><span className="text-[15px] font-semibold">Help Someone Else</span></button>
        </div>
      </div>
      <BottomNav active="/" />
      <EmergencyCallSheet open={callOpen} onClose={() => setCallOpen(false)} initialArea={incident.status === "received" || incident.status === "assigned" ? (isConfiguredArea(incident.incidentArea) ? incident.incidentArea : { region: "", town: "" }) : profile.homeArea} />
      <Sheet open={areaOpen} onClose={() => setAreaOpen(false)} title="Home location">
        <h2 className="text-[21px] font-bold">Your home area</h2>
        <p className="mt-1 mb-4 text-[13px] text-sheet-muted">For local emergency contacts. Each SOS uses the actual emergency location.</p>
        <AreaSelector value={profile.homeArea} onChange={(area) => citizen.updateHomeArea(area)} />
        <button onClick={() => setAreaOpen(false)} className="mt-4 min-h-12 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Done</button>
      </Sheet>
      <Sheet open={welcome} onClose={dismissWelcome} title="Welcome to NamRescue">
        <p className="text-[12px] font-semibold tracking-[.12em] text-[#C22B3A]">WELCOME</p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight">Help, when it matters.</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-sheet-muted">Set up your Medical ID and trusted contacts. This is optional and never required to reach SOS.</p>
        <button onClick={() => { dismissWelcome(); nav({ to: "/profile" }); }} className="mt-5 flex min-h-13 w-full items-center justify-center rounded-2xl bg-sheet-foreground font-semibold text-sheet">Set up my profile</button>
        <button onClick={() => { dismissWelcome(); openEmergency(); }} className="mt-2 flex min-h-13 w-full items-center justify-center rounded-2xl border border-sos font-semibold text-sos">Go to SOS</button>
        <button onClick={dismissWelcome} className="mt-2 min-h-11 w-full text-[13px] font-semibold text-sheet-muted">Skip for now</button>
      </Sheet>
      <Sheet open={sheet === "notifications"} onClose={() => setSheet(null)} title="Updates">
        <h2 className="text-[21px] font-bold">Your updates</h2>
        <p className="mt-2 text-[14px] text-sheet-muted">{incident.status === "idle" ? "No active emergency requests." : "Status: " + incident.status + " · this preview is not connected to emergency services."}</p>
        <button onClick={() => { setSheet(null); nav({ to: "/profile" }); }} className="mt-4 min-h-12 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Open profile</button>
      </Sheet>
      <Sheet open={sheet === "other"} onClose={() => setSheet(null)} title="Help someone else">
        <h2 className="mb-4 text-[20px] font-bold">Who needs help?</h2>
        {[
          { I: Navigation, t: "Someone near me", remote: false, accident: false },
          { I: MapPin, t: "Someone at another location", remote: true, accident: false },
          { I: CarFront, t: "Report a road accident", remote: false, accident: true },
        ].map(({ I, t, remote, accident }) => (
          <button key={t} onClick={() => { if (!demo.start(true, accident ? "Road accident" : "Medical emergency")) { setSheet(null); openEmergency(); return; } demo.setRemoteIncident(remote); setSheet(null); nav({ to: "/request" }); }} className="press mb-2 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-sheet-line bg-on-photo px-4 text-left font-medium"><I className="size-5 text-sos" />{t}</button>
        ))}
      </Sheet>
    </div>
  );
}
