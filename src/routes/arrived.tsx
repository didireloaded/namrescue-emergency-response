import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { IMG } from "@/lib/images";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/arrived")({
  head: () => ({ meta: [
    { title: "Ambulance Arrived — NamRescue demo" },
    { name: "description", content: "Simulated arrival of the response team." },
    { property: "og:title", content: "Ambulance Arrived — NamRescue demo" },
    { property: "og:description", content: "Simulated arrival of the response team." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Arrived,
});

function Arrived() {
  const request = useDemo();
  if (request.status !== "arrived") return <div className="flex h-full flex-col items-start justify-center bg-ink px-7 text-on-photo"><h1 className="text-[27px] font-bold">No arrival to report</h1><p className="mt-3 text-on-photo-muted">This page only appears after a completed response.</p><Link to="/" className="mt-6 rounded-full bg-sos px-6 py-4 font-semibold">Return to SOS</Link></div>;
  return (
    <div className="relative h-full bg-ink">
      <img src={IMG.rearOpen} alt="Ambulance with rear doors open and crew" className="absolute inset-0 h-full w-full object-cover brightness-75" />
      <div className="photo-fade-full absolute inset-0" />
      <div className="animate-rise absolute inset-x-5 rounded-[28px] border border-hairline bg-ink/85 p-6 text-on-photo" style={{ bottom: "calc(var(--safe-bottom) + 28px)" }}>
        <span className="grid size-14 place-items-center rounded-full bg-success text-ink"><Check className="size-8" strokeWidth={3} /></span>
        <h1 className="mt-4 text-[32px] font-bold leading-[1.05]">Ambulance<br />Arrived</h1>
        <p className="mt-2 text-[15px] text-on-photo-muted">The medical team is on site. <span className="text-caution">(Simulated)</span></p>
        <Link to="/summary" className="press mt-5 flex h-14 items-center justify-between rounded-full bg-on-photo px-6 font-semibold text-ink">View Details<ArrowRight className="size-5" /></Link>
      </div>
    </div>
  );
}
