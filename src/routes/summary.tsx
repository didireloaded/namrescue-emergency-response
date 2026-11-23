import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, MapPin, Star, MessageSquareText } from "lucide-react";
import { demo, useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [
    { title: "Your emergency request | NamRescue" },
    { name: "description", content: "Incident summary and optional service feedback." },
  ] }),
  component: Summary,
});
const formatTime = (n: number | null) =>
  n ? new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

function Summary() {
  const incident = useDemo();
  const [rating, setRating] = useState(incident.rating);
  const [comment, setComment] = useState(incident.feedback);
  const [saved, setSaved] = useState(false);
  if (incident.status !== "arrived") return <div className="flex h-full flex-col items-start justify-center bg-sheet px-6 text-sheet-foreground">
    <h1 className="text-[26px] font-bold">No completed response yet</h1>
    <p className="mt-2 text-[14px] text-sheet-muted">Incident information appears here only after arrival has been confirmed.</p>
    <Link to="/" className="mt-5 rounded-2xl bg-[#162235] px-5 py-4 text-white">Back to SOS</Link>
  </div>;
  const rows = [
    ["Request created (simulation)", incident.requestedAt],
    ["Team assigned (simulation)", incident.assignedAt],
    ["Arrival (simulation)", incident.arrivedAt],
  ] as const;
  return <div className="flex h-full flex-col bg-[#F7F9FC] text-[#162235]">
    <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-7 pt-safe">
      <div className="mt-8 flex items-start gap-3"><span className="grid size-13 place-items-center rounded-full bg-[#E8F4EF] text-[#15805B]"><CheckCircle2 className="size-7" /></span>
        <div><h1 className="text-[28px] font-bold tracking-tight">Response summary</h1><p className="text-[13px] text-[#76849A]">{incident.reference}</p></div>
      </div>
      <div className="mt-5 rounded-[22px] bg-white p-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold"><MapPin className="size-4 text-[#D12735]" />{incident.location.label}</p>
        <p className="mt-1 text-[12px] text-[#718096]">{incident.incidentType} · Simulated response</p>
        <ol className="mt-4 divide-y divide-[#E9EDF2]">{rows.map(([label, at])=>
          <li key={label} className="flex min-h-12 items-center justify-between gap-3 text-[13px]"><span>{label}</span><span className="text-[#748296]">{formatTime(at)}</span></li>
        )}</ol>
      </div>
      <section className="mt-5 rounded-[22px] bg-white p-5">
        <div className="flex items-center gap-2"><MessageSquareText className="size-5 text-[#2B4662]"/><h2 className="text-[18px] font-bold">How was the service?</h2></div>
        <p className="mt-1 text-[13px] text-[#738197]">Optional feedback after the incident.</p>
        <div className="mt-4 flex justify-between gap-1" role="group" aria-label="Rate service from 1 to 5">
          {[1,2,3,4,5].map(value => <button key={value} onClick={()=>{setRating(value);setSaved(false);}} aria-label={value + " star" + (value > 1 ? "s" : "")} aria-pressed={rating===value} className="grid size-12 place-items-center rounded-2xl bg-[#F6F8FB]">
            <Star className={"size-7 " + (rating >= value ? "fill-[#E4AA29] text-[#E4AA29]" : "text-[#A6B1BD]")} />
          </button>)}
        </div>
        <label className="mt-4 block text-[13px] font-semibold">Anything we should know? (Optional)</label>
        <textarea maxLength={500} value={comment} onChange={e=>{setComment(e.target.value);setSaved(false);}} rows={3} placeholder="Your experience or a concern" className="mt-2 w-full resize-none rounded-2xl border border-[#DFE5EB] bg-[#FAFBFD] p-3 text-[14px] outline-none"/>
        <button disabled={rating===0} onClick={()=>setSaved(demo.setFeedback(rating,comment))} className="mt-3 min-h-12 w-full rounded-2xl bg-[#162235] text-[14px] font-semibold text-white disabled:opacity-40">
          {saved ? "Feedback saved for this session" : "Save feedback"}
        </button>
      </section>
      <p className="mt-3 text-[12px] leading-relaxed text-[#758399]">This is a simulation only. The app is not connected to emergency dispatch. Feedback is not sent to any provider.</p>
    </main>
    <div className="px-5 pb-safe pt-2"><Link to="/" className="flex min-h-13 w-full items-center justify-center rounded-2xl bg-[#D82334] text-[15px] font-semibold text-white">Done</Link></div>
  </div>;
}
