import { useState } from "react";
import {
  AlertTriangle, BatteryWarning, CheckCircle2, ClipboardCheck, Clock3,
  FileWarning, Hospital, MapPin, MessageCircle, Mic, PackageSearch,
  Phone, Radio, ShieldAlert, ShieldCheck, Truck, Video, WifiOff,
} from "lucide-react";
import { driver, SUPPLY_KEYS, supplyIssue, useDriver } from "@/lib/driver-store";
import { useConnectivity } from "@/lib/connectivity";

const tile = "rounded-[22px] border border-[#E4EAF1] bg-white";
const heading = "text-[18px] font-bold tracking-tight text-[#17283F]";
const support = "text-[13px] leading-relaxed text-[#6E7D92]";
const action = "flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#162235] px-4 text-[14px] font-semibold text-white disabled:opacity-40";
const presets = ["On scene", "Departing for hospital", "Request scene guidance", "Vehicle issue reported"];

export function DriverNetworkBanner() {
  const connectivity = useConnectivity();
  return <div role="status" className={"flex items-start gap-2.5 rounded-[18px] p-3 " +
    (connectivity === "offline" ? "bg-[#FFF0E8] text-[#94541B]" : "bg-[#EBF0F5] text-[#455D74]")}>
    {connectivity === "offline" ? <WifiOff className="mt-0.5 size-5 shrink-0"/> : <Radio className="mt-0.5 size-5 shrink-0"/>}
    <div><p className="text-[13px] font-bold">{connectivity === "offline" ? "No network detected" : connectivity === "online" ? "Device reports online" : "Checking connection"}</p>
      <p className="mt-1 text-[12px] leading-relaxed">No control room is connected. Status changes and messages remain on this device's current demo session, regardless of connectivity.</p>
    </div>
  </div>;
}

export function DriverCommunicationsScreen() {
  const state = useDriver();
  const [text,setText]=useState("");
  const [tab,setTab]=useState<"messages" | "timeline">("messages");
  const post = (message: string) => {
    if (driver.addMessage(message)) setText("");
  };
  return <div className="space-y-4">
    <div><p className="text-[12px] font-bold uppercase tracking-wider text-[#7D8B9D]">Dispatch connection</p>
      <h2 className="mt-1 text-[29px] font-bold tracking-tight">Communications</h2>
      <p className={support}>Training messages are not transmitted to a dispatcher.</p>
    </div>
    <DriverNetworkBanner />
    <div role="tablist" className="grid grid-cols-2 rounded-2xl bg-[#E9EFF5] p-1">
      <button role="tab" aria-selected={tab==="messages"} className={"min-h-11 rounded-xl text-[13px] font-semibold "+(tab==="messages"?"bg-white text-[#20354C]":"text-[#6E7E92]")} onClick={()=>setTab("messages")}>Messages</button>
      <button role="tab" aria-selected={tab==="timeline"} className={"min-h-11 rounded-xl text-[13px] font-semibold "+(tab==="timeline"?"bg-white text-[#20354C]":"text-[#6E7E92]")} onClick={()=>setTab("timeline")}>Status log</button>
    </div>
    {tab==="messages" ? <>
      <section className={tile+" p-4"}>
        <h3 className={heading}>Quick updates</h3>
        <p className={"mt-1 "+support}>Save a preset to the training log. These do not send radio or digital messages.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">{presets.map(p=><button key={p} onClick={()=>post(p)} disabled={state.stage==="offDuty"} className="min-h-14 rounded-2xl border border-[#E1E8EF] bg-[#F8FAFC] px-3 text-left text-[13px] font-semibold text-[#2A4A66] disabled:opacity-40">{p}</button>)}</div>
      </section>
      <section className={tile+" p-4"}>
        <label htmlFor="driver-message" className={heading}>Training message</label>
        <textarea id="driver-message" rows={3} maxLength={400} value={text} onChange={e=>setText(e.target.value)} placeholder="Example: Requesting safe approach guidance…" className="mt-3 w-full resize-none rounded-2xl border border-[#DAE2EB] bg-[#F9FAFC] p-3 text-[14px] text-[#20314B]" />
        <button disabled={!text.trim() || state.stage==="offDuty"} onClick={()=>post(text)} className={action+" mt-2"}><MessageCircle className="size-5"/> Save locally (not sent)</button>
      </section>
      <section className="space-y-3">
        <h3 className={heading}>Local message log</h3>
        {state.messages.length ? state.messages.map(m=><article key={m.id} className={tile+" p-4"}>
          <p className="text-[13px] font-semibold">{m.from==="driver"?"Driver (preview)":"Training dispatch"}</p>
          <p className="mt-2 text-[14px]">{m.text}</p>
          <p className="mt-2 text-[12px] font-medium text-[#9B5F24]">{new Date(m.at).toLocaleTimeString()} · Not transmitted</p>
        </article>) : <p className={support}>No local messages yet.</p>}
      </section>
    </> : <section className={tile+" p-4"}>
      <h3 className={heading}>Incident status history</h3>
      <p className={"mt-1 "+support}>These timestamps record local button actions, not acknowledged dispatch events.</p>
      <ol className="mt-4 space-y-3">{state.events.length ? state.events.map((e,i)=><li key={i} className="flex gap-3 border-l-2 border-[#2B638C] pl-3">
        <Clock3 className="mt-0.5 size-4 text-[#3E769B]"/>
        <div><p className="text-[14px] font-semibold">{e.stage.replace(/([A-Z])/g," $1")}</p><p className="text-[12px] text-[#7C899A]">{new Date(e.time).toLocaleString()} · Local preview</p></div>
      </li>) : <li className={support}>No assignment status changes yet.</li>}</ol>
    </section>}
    <div className={tile+" p-4"}>
      <h3 className={heading}>Voice and media</h3>
      <p className={"mt-1 "+support}>Two-way dispatch messaging, media upload, live video, and push-to-talk require an authenticated control-room connection.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ECF0F4] text-[13px] font-semibold text-[#8091A3]"><Mic className="size-4"/> PTT unavailable</button>
        <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ECF0F4] text-[13px] font-semibold text-[#8091A3]"><Video className="size-4"/> Media unavailable</button>
      </div>
    </div>
  </div>;
}

export function DriverInventoryPanel() {
  const state = useDriver();
  const [defect,setDefect]=useState("");
  const [confirm,setConfirm]=useState(false);
  const blocked = state.outOfServiceReason!==null;
  const stockLocked = !["offDuty","available","completed"].includes(state.stage);
  return <div className="space-y-4">
    <section className={tile+" p-4"}>
      <div className="flex items-center gap-2"><PackageSearch className="size-6 text-[#426987]"/><h3 className={heading}>Equipment inventory</h3></div>
      <p className={"mt-1 "+support}>Illustrative stock figures. Critical shortages prevent a new training assignment.</p>
      <div className="mt-4 divide-y divide-[#E9EDF1]">{SUPPLY_KEYS.map(key=>{
        const item=state.supplies[key];
        const problem=supplyIssue(item);
        return <div key={key} className="flex min-h-[75px] items-center gap-3 py-2">
          <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{item.label}</p><p className="mt-1 text-[12px] text-[#718296]">Minimum {item.minimum} · {problem||"Stock sufficient"}</p></div>
          <div className="flex items-center gap-1"><button aria-label={"Reduce "+item.label} disabled={stockLocked || item.count===0} onClick={()=>driver.setSupplyCount(key,item.count-1)} className="grid size-10 place-items-center rounded-xl border border-[#DBE4EB] disabled:opacity-30">−</button>
            <span className={"w-7 text-center text-[15px] font-bold "+(problem?"text-[#BF2938]":"text-[#233D58]")}>{item.count}</span>
            <button aria-label={"Increase "+item.label} disabled={stockLocked} onClick={()=>driver.setSupplyCount(key,item.count+1)} className="grid size-10 place-items-center rounded-xl border border-[#DBE4EB] disabled:opacity-30">+</button>
          </div>
        </div>;
      })}</div>
      {stockLocked && <p className={"mt-3 "+support}>Stock editing is locked while a response is active.</p>}
    </section>
    <section className={tile+" p-4"}>
      <div className="flex gap-2"><FileWarning className="size-6 text-[#B43342]"/><h3 className={heading}>Vehicle defects</h3></div>
      {blocked ? <div className="mt-3 rounded-2xl bg-[#FFF0F1] p-4 text-[#982534]">
        <p className="text-[14px] font-bold">Vehicle marked out of service</p><p className="mt-2 text-[13px]">{state.outOfServiceReason}</p>
        <p className="mt-2 text-[12px]">Only authorised fleet control should clear a real defect. This demo can be reset in Profile.</p>
      </div> : <>
        <p className={"mt-2 "+support}>Report a mechanical or safety issue. This locks new training assignments.</p>
        <textarea rows={2} value={defect} maxLength={280} onChange={e=>setDefect(e.target.value)} placeholder="Describe the fault…" className="mt-3 w-full rounded-2xl border border-[#E0E7EE] bg-[#F8FAFC] p-3 text-[14px]"/>
        {!confirm ? <button disabled={!defect.trim()} onClick={()=>setConfirm(true)} className={action+" mt-2 bg-[#AC3041]"}><AlertTriangle className="size-4"/> Report defect</button> :
          <div className="mt-3 space-y-2"><p className="text-[13px] font-semibold text-[#9E2635]">Mark this training vehicle unavailable for new assignments?</p>
            <button onClick={()=>{driver.reportDefect(defect);setConfirm(false);setDefect("");}} className={action+" bg-[#AC3041]"}>Confirm out of service</button>
            <button onClick={()=>setConfirm(false)} className="min-h-11 w-full text-[13px] font-semibold">Keep editing</button>
          </div>}
      </>}
      <p className={"mt-3 "+support}>Maintenance reminders, expiry validation and fleet defect approval need official inventory records and management access.</p>
    </section>
  </div>;
}

export function DriverCrewSafetyPanel() {
  const state=useDriver();
  const last=state.safetyCheckins[0];
  return <div className="space-y-4">
    <section className={tile+" p-4"}>
      <div className="flex items-center gap-2"><ShieldCheck className="size-6 text-[#2C7864]"/><h3 className={heading}>Crew check-in</h3></div>
      <p className={"mt-2 "+support}>Record a manual welfare check-in in this preview. It is not sent to dispatch or a supervisor.</p>
      <button disabled={state.stage==="offDuty"} onClick={()=>driver.checkInSafe()} className={action+" mt-3"}><CheckCircle2 className="size-4"/> Record I'm safe (local)</button>
      {last&&<p className="mt-2 text-[12px] font-semibold text-[#367354]">Last local check-in: {new Date(last).toLocaleTimeString()}</p>}
    </section>
    <section className={tile+" p-4"}>
      <div className="flex items-center gap-2"><BatteryWarning className="size-6 text-[#B8752A]"/><h3 className={heading}>Fatigue and rest</h3></div>
      <p className={"mt-2 "+support}>A rest flag stops new sample assignments, but does not cancel an active trip.</p>
      <button onClick={()=>driver.setFatigueBreak(!state.fatigueBreakRequested)} className={"mt-3 flex min-h-12 w-full items-center justify-center rounded-xl text-[14px] font-semibold "+(state.fatigueBreakRequested?"bg-[#FFF0D9] text-[#865320]":"bg-[#EDF3F7] text-[#2C506C]")}>{state.fatigueBreakRequested?"Clear training rest flag":"Mark that I need a rest"}</button>
    </section>
    <section className={tile+" p-4"}>
      <div className="flex items-center gap-2"><ShieldAlert className="size-6 text-[#BC2A3B]"/><h3 className={heading}>Crew duress</h3></div>
      <p className={"mt-2 "+support}>Silent distress alarms and audio/video streaming require a monitored control-room channel with verified delivery. The demo cannot notify anyone.</p>
      <button disabled className="mt-3 min-h-13 w-full rounded-2xl bg-[#F4DDE0] text-[14px] font-bold text-[#9E3945]">Duress alert unavailable</button>
      <p className="mt-2 text-[12px] text-[#728094]">In immediate danger, use your organisation's established emergency communication procedures.</p>
    </section>
  </div>;
}

export function DriverHandoverPanel() {
  const state=useDriver();
  return <section className={tile+" space-y-3 p-4"}>
    <div className="flex items-center gap-2"><ClipboardCheck className="size-6 text-[#376389]"/><h3 className={heading}>Shift handover notes</h3></div>
    <p className={support}>Operational issues, equipment concerns and vehicle condition only. Do not enter patient details.</p>
    <textarea maxLength={2000} value={state.handoverNote} onChange={e=>driver.updateHandover(e.target.value)} rows={4}
      placeholder="Example: Fuel refill required. Radio check completed. Vehicle defect reported…" className="w-full rounded-2xl border border-[#E0E6EE] bg-[#F9FAFC] p-3 text-[14px]" />
    <p className="text-[12px] text-[#8A6A36]">Saved only in this browser session. Not delivered to the incoming crew.</p>
  </section>;
}

export function DriverClinicalBoundary() {
  return <section className={tile+" space-y-3 p-4"}>
    <div className="flex items-center gap-2"><Hospital className="size-6 text-[#396587]"/><h3 className={heading}>Clinical handover</h3></div>
    <p className={support}>Patient records, vitals, medication interventions and SBAR belong to authenticated paramedic and hospital workflows. No clinical record is stored here.</p>
    <div className="rounded-2xl bg-[#F1F5F9] p-3">
      <p className="text-[13px] font-semibold">SBAR handover outline</p>
      <p className="mt-2 text-[13px] text-[#56697E]">Situation · Background · Assessment · Recommendation</p>
      <p className="mt-2 text-[12px] text-[#8493A3]">Reference only. Actual clinical handover and hospital prenotification require authorised personnel.</p>
    </div>
    <button disabled className="min-h-12 w-full rounded-xl bg-[#EDF1F5] text-[13px] font-semibold text-[#8895A5]">Encrypted QR handover not connected</button>
  </section>;
}
