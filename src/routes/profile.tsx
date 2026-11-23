import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/nr/chrome";
import { Switch } from "@/components/ui/switch";
import { CREDITS } from "@/lib/images";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Profile — NamRescue demo" }, { name: "description", content: "Demo medical ID and privacy settings." },
    { property: "og:title", content: "Profile — NamRescue demo" }, { property: "og:description", content: "Demo medical ID and privacy settings." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Profile,
});

function Profile() {
  const [t, setT] = useState({ loc: true, share: false });
  return (
    <div className="flex h-full flex-col bg-ink text-on-photo"><div className="flex-1 overflow-auto px-6 pt-safe pb-6">
      <h1 className="mt-12 text-[28px] font-bold">Profile</h1>
      <div className="mt-4 rounded-[22px] border border-hairline bg-ink-2 p-5"><p className="text-[12px] font-semibold tracking-[0.12em] text-caution">DEMO MEDICAL ID</p>
        {["Blood type", "Allergies", "Emergency contact"].map((f) => <div key={f} className="mt-3 flex justify-between text-[14px]"><span className="text-on-photo-muted">{f}</span><span>Not set</span></div>)}</div>
      <div className="mt-4 space-y-1 rounded-[22px] border border-hairline bg-ink-2 px-5">
        {([["loc", "Share location during requests"], ["share", "Share medical ID with crew"]] as const).map(([k, l]) => (
          <label key={k} className="flex min-h-14 items-center justify-between text-[14px]">{l}<Switch checked={t[k]} onCheckedChange={(v) => setT({ ...t, [k]: v })} /></label>))}
      </div>
      <p className="mt-6 text-[12px] text-on-photo-muted">Photo credits</p>
      <ul className="mt-1 space-y-1 text-[12px] text-on-photo-muted">{CREDITS.map((c) => <li key={c.what}><a className="underline" href={c.href} target="_blank" rel="noreferrer">{c.what}</a> — {c.who}, {c.license}</li>)}</ul>
    </div><BottomNav active="/profile" /></div>
  );
}
