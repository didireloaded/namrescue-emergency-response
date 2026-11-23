import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, MapPin, Phone, ShieldCheck, Siren } from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [
    { title: "My Requests | NamRescue" },
    { name: "description", content: "Current emergency request and previous incident history." },
  ] }),
  component: Requests,
});
function Requests() {
  const incident = useDemo();
  const active = incident.status === "received" || incident.status === "assigned" || incident.status === "arrived";
  return <div className="flex h-full flex-col bg-[#F7F9FC] text-[#162235]">
    <main className="min-h-0 flex-1 overflow-y-auto">
      <header className="bg-[#162235] px-6 pb-9 pt-safe text-white">
        <div className="mt-5 flex items-center gap-2"><Clock3 className="size-5" /><span className="text-[14px] font-semibold">My requests</span></div>
        <h1 className="mt-9 text-[32px] font-bold">Every response,<br />in one place.</h1>
        <p className="mt-3 text-[14px] text-white/65">Track progress and review previous incidents.</p>
      </header>
      <div className="relative -mt-4 space-y-5 rounded-t-[28px] bg-[#F7F9FC] px-5 pb-8 pt-6">
        {active ? <section className="rounded-[22px] bg-white p-5">
          <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-[#D22232]">CURRENT REQUEST</span><span className="text-[12px] text-[#65738A]">{incident.reference}</span></div>
          <h2 className="mt-3 text-[23px] font-bold">{incident.status === "received" ? "Awaiting assignment" : incident.status === "arrived" ? "Team on scene" : "Response assigned"}</h2>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-[#64748B]"><MapPin className="size-4" />{incident.location.label}</p>
          <div className="mt-5 space-y-0">
            {[["Request received",true],["Ambulance assigned",incident.status === "assigned"],["On scene",incident.status === "arrived"]].map(([label,done],i)=>
              <div key={i} className="flex min-h-11 items-center gap-3"><span className={"size-3 rounded-full border-2 " + (done ? "border-[#1F7B52] bg-[#1F7B52]" : "border-[#BEC8D5]")} /><span className="text-[14px]">{label}</span></div>)}
          </div>
          <Link to={incident.status === "arrived" ? "/arrived" : incident.status === "assigned" ? "/tracking" : "/request"} className="mt-5 flex min-h-12 items-center justify-between rounded-2xl bg-[#162235] px-4 text-[14px] font-semibold text-white">View request <ArrowRight className="size-4" /></Link>
          <p className="mt-3 text-[12px] leading-relaxed text-[#8B4E54]">Preview only. No real emergency service has received this request.</p>
        </section> : <div className="rounded-[22px] bg-white p-5"><div className="grid size-12 place-items-center rounded-2xl bg-[#F1F5F9]"><ShieldCheck className="size-6 text-[#425770]" /></div><h2 className="mt-3 text-[18px] font-bold">No active request</h2><p className="mt-1 text-[13px] text-[#738296]">Any emergency you're following will appear here.</p><Link to="/" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#D92232] text-[14px] font-semibold text-white"><Siren className="size-5" /> Open SOS</Link></div>}
        <section>
          <h2 className="mb-3 px-1 text-[17px] font-bold">History</h2>
          {incident.history.length ? <div className="divide-y divide-[#EDF0F4] rounded-[22px] bg-white px-4">{incident.history.map((h)=>
            <div key={h.id} className="flex items-center gap-3 py-4"><div className="grid size-10 place-items-center rounded-2xl bg-[#EFF4FA]"><Phone className="size-5 text-[#445875]" /></div><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{h.type || "Medical emergency"}</p><p className="truncate text-[12px] text-[#7B879A]">{h.label}</p><p className="text-[11px] text-[#8792A0]">{new Date(h.at).toLocaleDateString()}</p>{h.rating ? <p className="text-[12px] font-semibold text-[#A97713]">Rated {h.rating}/5</p> : null}</div><span className="text-[12px] text-[#63768F]">Closed</span></div>)}</div> :
            <div className="rounded-[22px] bg-white px-5 py-8 text-center"><Clock3 className="mx-auto size-7 text-[#AAB5C4]" /><p className="mt-2 text-[14px] text-[#7E8A9B]">No previous requests yet</p></div>}
        </section>
        <p className="px-1 text-[12px] text-[#7D8A9C]">Only this browser session is represented. Secure request history requires a verified account and dispatch integration.</p>
      </div>
    </main>
    <BottomNav active="/profile" />
  </div>;
}
