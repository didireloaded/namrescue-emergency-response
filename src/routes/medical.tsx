import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, LockKeyhole, Phone, ShieldCheck, UsersRound, CreditCard, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { MedicalForm } from "@/components/nr/CitizenProfile";
import { citizen, useCitizen } from "@/lib/citizen-store";

export const Route = createFileRoute("/medical")({
  head: () => ({ meta: [
    { title: "Medical ID and Medical Aid | NamRescue" },
    { name: "description", content: "Optional emergency health information and medical coverage." },
  ] }),
  component: Medical,
});
const input = "min-h-12 w-full rounded-2xl border border-[#DBE2EA] bg-white px-4 text-[15px] text-[#162235] outline-none focus:border-[#306DC1]";
function Medical() {
  const state = useCitizen();
  const [tab, setTab] = useState<"id" | "aid">("id");
  const { medicalAid } = state;
  return <div className="flex h-full flex-col bg-[#F7F9FC] text-[#182435]">
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="bg-[#162235] px-6 pb-9 pt-safe text-white">
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[14px] font-semibold">Health</span>
          <ShieldCheck className="size-5 text-white/70" />
        </div>
        <div className="mt-7 grid size-14 place-items-center rounded-[18px] bg-white/10">
          <HeartPulse className="size-7 text-[#FF5260]" />
        </div>
        <h1 className="mt-4 truncate text-[30px] font-bold tracking-tight">{state.profile.name || "Your Medical ID"}</h1>
        <p className="mt-1 text-[14px] text-white/65">Important details for emergency care.</p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-white/10 px-3 py-2 text-[12px]">{state.medical.bloodType || "Blood type not set"}</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-[12px]">{state.contacts.length} contacts</span>
        </div>
      </div>
      <div className="relative -mt-4 rounded-t-[28px] bg-[#F7F9FC] px-5 pb-8 pt-5">
        <div role="tablist" aria-label="Health information" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#E8EDF4] p-1">
          <button role="tab" aria-selected={tab === "id"} onClick={() => setTab("id")} className={"min-h-11 rounded-[13px] text-[14px] font-semibold " + (tab === "id" ? "bg-white text-[#162235] shadow-sm" : "text-[#65738A]")}>Medical ID</button>
          <button role="tab" aria-selected={tab === "aid"} onClick={() => setTab("aid")} className={"min-h-11 rounded-[13px] text-[14px] font-semibold " + (tab === "aid" ? "bg-white text-[#162235] shadow-sm" : "text-[#65738A]")}>Medical aid</button>
        </div>
        {tab === "id" ? <div role="tabpanel" className="mt-5 space-y-5">
          <div className="flex items-start gap-3 rounded-[20px] bg-[#E9F0F8] p-4">
            <HeartPulse className="mt-1 size-5 shrink-0 text-[#C82B3A]" />
            <div><p className="text-[14px] font-bold">Your emergency details</p><p className="mt-1 text-[12px] leading-relaxed text-[#62738B]">Only add details you know. You control what will be shared with authorised responders.</p></div>
          </div>
          <MedicalForm />
          <Link to="/profile" className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4">
            <UsersRound className="size-5 text-[#24354C]" />
            <span className="flex-1"><span className="block text-[14px] font-semibold">Emergency contacts</span><span className="text-[12px] text-[#778497]">{state.contacts.length} saved</span></span>
            <ChevronRight className="size-5 text-[#7C899D]" />
          </Link>
        </div> : <div role="tabpanel" className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-[20px] bg-[#E9F0F8] p-4">
            <CreditCard className="mt-1 size-5 shrink-0 text-[#286AC0]" />
            <div><p className="text-[14px] font-bold">Your medical aid</p><p className="mt-1 text-[12px] leading-relaxed text-[#62738B]">Coverage is optional. You never need medical aid to start an emergency request.</p></div>
          </div>
          {([
            ["Provider or PSEMAS", "provider", "Medical aid provider"],
            ["Scheme / plan", "scheme", "Your plan"],
            ["Membership number", "membershipNumber", "Optional membership number"],
            ["Main member", "mainMemberName", "Full name"],
          ] as const).map(([label,key,placeholder]) => <label key={key} className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#415168]">{label}</span>
            <input className={input} value={medicalAid[key]} onChange={e => citizen.updateMedicalAid({ [key]: e.target.value })} placeholder={placeholder} />
          </label>)}
          <div className="flex gap-2 rounded-2xl bg-white p-4 text-[12px] leading-relaxed text-[#65758C]">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            Membership details remain in this session only. Claims, authorisations and insurer checks are not connected.
          </div>
        </div>}
        <p className="mt-5 flex gap-2 rounded-2xl bg-[#EBEFF5] p-3 text-[12px] leading-relaxed text-[#67758B]">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          Information is not securely saved between sessions until encrypted account storage is available.
        </p>
        <Link to="/" className="mt-4 flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#D92232] text-[15px] font-semibold text-white">
          <Phone className="size-4" /> Emergency SOS
        </Link>
      </div>
    </main>
    <BottomNav active="/medical" />
  </div>;
}
