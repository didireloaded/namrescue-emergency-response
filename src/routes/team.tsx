import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, MessageCircle, Phone, Users } from "lucide-react";
import { BackButton, Sheet } from "@/components/nr/chrome";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [
    { title: "Your Response Team — CareNear demo" },
    { name: "description", content: "Demo response crew and vehicle for a simulated request." },
    { property: "og:title", content: "Your Response Team — CareNear demo" },
    { property: "og:description", content: "Demo response crew and vehicle for a simulated request." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Team,
});

function Team() {
  const [sel, setSel] = useState(0);
  const [note, setNote] = useState(false);
  const crew = [{ img: IMG.portrait, role: "Paramedic", pos: "60% 25%" }, { img: IMG.driver, role: "Driver", pos: "35% 40%" }];
  return (
    <div className="relative h-full bg-sheet">
      <img src={crew[sel]?.img} alt={`Demo ${crew[sel]?.role ?? "crew"} photo`} className="absolute inset-x-0 top-0 h-[58%] w-full object-cover" style={{ objectPosition: crew[sel]?.pos ?? "50% 50%" }} />
      <div className="photo-fade-top absolute inset-x-0 top-0 h-40" />
      <div className="absolute left-5 z-10" style={{ top: "calc(var(--safe-top) + 8px)" }}><BackButton to="/tracking" /></div>
      <section className="absolute inset-x-0 bottom-0 h-[47%] rounded-t-[32px] bg-sheet px-6 pt-2.5 pb-safe text-sheet-foreground shadow-sheet">
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-sheet-line" />
        <h1 className="text-[24px] font-bold">Your Response Team</h1>
        <p className="text-[12px] text-sheet-muted">Example responders · not verified identities</p>
        <div className="mt-4 flex gap-3">
          {crew.map((c, i) => (
            <button key={c.role} onClick={() => setSel(i)} aria-pressed={sel === i} aria-label={c.role} className={cn("size-[64px] overflow-hidden rounded-[18px] border-2", sel === i ? "border-sos" : "border-transparent")}>
              <img src={c.img} alt="" className="size-full object-cover" style={{ objectPosition: c.pos }} />
            </button>
          ))}
          <div className="grid size-[64px] place-items-center rounded-[18px] bg-sheet-line text-sheet-muted" aria-label="Team"><Users className="size-6" /></div>
        </div>
        <button onClick={() => setNote(true)} className="press mt-4 flex w-full items-center gap-4 rounded-[22px] border border-sheet-line bg-on-photo p-2.5 text-left shadow-card">
          <img src={IMG.ambSide} alt="Ambulance vehicle" className="h-14 w-20 rounded-[14px] object-cover" />
          <span className="flex-1"><span className="block text-[16px] font-bold">CN-DEMO-07</span><span className="text-[13px] text-sheet-muted">Vehicle registration not verified</span></span>
          <ChevronRight className="size-5 text-sheet-muted" />
        </button>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => setNote(true)} aria-label="Call crew (demo)" className="press grid h-12 place-items-center rounded-full border border-sheet-line bg-on-photo text-sos"><Phone className="size-5" /></button>
          <button onClick={() => setNote(true)} aria-label="Message crew (demo)" className="press grid h-12 place-items-center rounded-full border border-sheet-line bg-on-photo text-sos"><MessageCircle className="size-5" /></button>
        </div>
      </section>
      <Sheet open={note} onClose={() => setNote(false)} title="Demo only">
        <h2 className="text-[20px] font-bold">Demo only</h2>
        <p className="mt-2 text-[14px] text-sheet-muted">Real responder names, photos and vehicle registrations will be shown only after government dispatch integration verifies them. Personal driving licence numbers and ages are not public.</p>
      </Sheet>
    </div>
  );
}
