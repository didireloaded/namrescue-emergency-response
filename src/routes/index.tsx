import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Ambulance, Bell, Phone, Users, MapPin, Navigation } from "lucide-react";
import { BottomNav, Sheet } from "@/components/nr/chrome";
import { IMG } from "@/lib/images";
import { demo, useDemo } from "@/lib/demo-store";
import { canDial, VERIFIED_EMERGENCY_NUMBER } from "@/lib/demo-sim";

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
  const [sheet, setSheet] = useState<null | "call" | "other" | "notifications">(null);
  return (
    <div className="relative flex h-full flex-col bg-ink">
      <img src={IMG.windhoek} alt="Windhoek city skyline" className="absolute inset-x-0 top-0 h-[62%] w-full object-cover brightness-[.7] saturate-[.8]" />
      <div className="photo-fade-bottom absolute inset-x-0 top-0 h-[62%]" />
      <header className="relative z-10 flex items-start justify-between px-[26px] pt-safe">
        <div className="mt-3">
          <p className="text-[20px] font-bold tracking-tight text-on-photo"><span className="text-sos-bright">+</span> NamRescue</p>
          <p className="text-[12px] text-on-photo-muted">Emergency Medical Services</p>
        </div>
        <button aria-label="Notifications" onClick={() => setSheet("notifications")} className="press mt-2 grid size-11 place-items-center rounded-full border border-hairline bg-ink/50 text-on-photo"><Bell className="size-5" /></button>
      </header>
      <h1 className="animate-rise relative z-10 mt-auto px-[26px] text-[42px] font-bold leading-[1.03] tracking-tight text-on-photo">Get<br />emergency<br />medical help.</h1>
      <div className="relative z-10 space-y-3 px-5 pb-4 pt-6">
        <button onClick={() => { if (incident.status === "assigned") { nav({ to: "/tracking" }); return; } if (incident.status === "received") { nav({ to: "/request" }); return; } demo.start(false); nav({ to: "/request" }); }} className="press shadow-sos flex h-[132px] w-full items-center gap-5 rounded-[28px] border-t border-sos-bright bg-sos px-6 text-left text-on-photo">
          <span className="grid size-16 place-items-center rounded-full bg-on-photo/15"><Ambulance className="size-8" /></span>
          <span><span className="block text-[48px] font-bold leading-none tracking-tight">{incident.status === "received" ? "Pending" : incident.status === "assigned" ? "Track" : "SOS"}</span><span className="text-[14px] font-medium opacity-90">{incident.status === "received" ? "View request status" : incident.status === "assigned" ? "Ambulance tracking" : "Request Ambulance"}</span></span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setSheet("call")} className="press flex h-[88px] flex-col justify-between rounded-[22px] border border-hairline bg-ink-2 p-4 text-left text-on-photo"><Phone className="size-5" /><span className="text-[15px] font-semibold">Call</span></button>
          <button onClick={() => setSheet("other")} className="press flex h-[88px] flex-col justify-between rounded-[22px] border border-hairline bg-ink-2 p-4 text-left text-on-photo"><Users className="size-5" /><span className="text-[15px] font-semibold">Help Someone Else</span></button>
        </div>
      </div>
      <BottomNav active="/" />
      <Sheet open={sheet === "call"} onClose={() => setSheet(null)} title="Call">
        <h2 className="text-[20px] font-bold">Emergency calling not yet connected</h2>
        <p className="mt-2 text-[14px] text-sheet-muted">A verified emergency number and government dispatch integration are required before in-app calling is enabled.</p>
        {canDial(VERIFIED_EMERGENCY_NUMBER) ? <a href={`tel:${VERIFIED_EMERGENCY_NUMBER}`} className="mt-5 block rounded-full bg-sos py-4 text-center font-semibold text-on-photo">Call</a>
          : <button disabled className="mt-5 w-full rounded-full bg-sheet-line py-4 font-semibold text-sheet-muted">Emergency calling unavailable</button>}
      </Sheet>
      <Sheet open={sheet === "notifications"} onClose={() => setSheet(null)} title="Updates">
        <h2 className="text-[21px] font-bold">Your updates</h2>
        <p className="mt-2 text-[14px] text-sheet-muted">{incident.status === "idle" ? "No active emergency requests." : "Status: " + incident.status + " · this preview is not connected to emergency services."}</p>
        <button onClick={() => { setSheet(null); nav({ to: "/profile" }); }} className="mt-4 min-h-12 w-full rounded-full bg-sheet-foreground font-semibold text-sheet">Open profile</button>
      </Sheet>
      <Sheet open={sheet === "other"} onClose={() => setSheet(null)} title="Help someone else">
        <h2 className="mb-4 text-[20px] font-bold">Who needs help?</h2>
        {[{ I: Navigation, t: "Someone near me" }, { I: MapPin, t: "Someone at another location" }].map(({ I, t }) => (
          <button key={t} onClick={() => { demo.start(true); nav({ to: "/request" }); }} className="press mb-2 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-sheet-line bg-on-photo px-4 text-left font-medium"><I className="size-5 text-sos" />{t}</button>
        ))}
      </Sheet>
    </div>
  );
}
