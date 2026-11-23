import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, LockKeyhole, Phone, ShieldCheck, UsersRound } from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { MedicalForm } from "@/components/nr/CitizenProfile";
import { useCitizen } from "@/lib/citizen-store";

export const Route = createFileRoute("/medical")({
  head: () => ({ meta: [
    { title: "Medical ID | NamRescue" },
    { name: "description", content: "Your emergency health information and important contacts." },
  ] }),
  component: Medical,
});

function Medical() {
  const state = useCitizen();
  return <div className="flex h-full flex-col bg-[#F7F9FC] text-[#182435]">
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="bg-[#162235] px-6 pb-9 pt-safe text-white">
        <div className="mt-4 flex items-center justify-between"><span className="text-[14px] font-semibold">Medical ID</span><ShieldCheck className="size-5 text-white/70" /></div>
        <div className="mt-9 grid size-15 place-items-center rounded-[20px] bg-white/10"><HeartPulse className="size-8 text-[#FF5260]" /></div>
        <h1 className="mt-5 text-[32px] font-bold tracking-tight">{state.profile.name || "Your Medical ID"}</h1>
        <p className="mt-1 text-[14px] text-white/65">Important details when every second matters.</p>
        <div className="mt-6 flex gap-3">
          <span className="rounded-full bg-white/10 px-3 py-2 text-[12px]">{state.medical.bloodType || "Blood group not set"}</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-[12px]">{state.contacts.length} contacts</span>
        </div>
      </div>
      <div className="relative -mt-4 space-y-5 rounded-t-[28px] bg-[#F7F9FC] px-5 pb-8 pt-6">
        <div className="rounded-2xl bg-[#E8EFF7] p-4">
          <h2 className="text-[15px] font-bold">Your health information</h2>
          <p className="mt-1 text-[13px] text-[#63738B]">Add only information you are comfortable sharing with authorised responders.</p>
        </div>
        <MedicalForm />
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <UsersRound className="size-5 text-[#24354C]" />
          <span className="flex-1"><span className="block text-[14px] font-semibold">Emergency contacts</span><span className="text-[12px] text-[#788598]">{state.contacts.length} added in profile</span></span>
          <Link to="/profile" className="text-[13px] font-semibold text-[#1F66B8]">Manage</Link>
        </div>
        <div className="flex gap-2 rounded-2xl bg-[#EDF1F6] p-4 text-[12px] leading-relaxed text-[#596A80]"><LockKeyhole className="size-4 shrink-0" />Your medical information stays in this session until authenticated, encrypted storage is available. It is not sent to any crew yet.</div>
        <Link to="/" className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#D92232] text-[15px] font-semibold text-white"><Phone className="size-4" /> Emergency SOS</Link>
      </div>
    </main>
    <BottomNav active="/medical" />
  </div>;
}
