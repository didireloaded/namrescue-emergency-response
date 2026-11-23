import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight,
  Bell, Check, CheckCircle2, ChevronRight, ClipboardCheck,
  Clock3, ExternalLink, Hospital, MapPin, Navigation, Power,
  Radio, ShieldCheck, Siren, Truck, UserRound, Wrench,
  X,
} from "lucide-react";
import { LazyMap } from "@/components/nr/LazyMap";
import { DriverCommunicationsScreen, DriverInventoryPanel, DriverCrewSafetyPanel, DriverHandoverPanel, DriverClinicalBoundary, DriverNetworkBanner } from "./DriverOperations";
import {
  driver, useDriver, stageLabel,
  VEHICLE_ITEMS, DRIVER_PREVIEW_BASE, type DriverAssignment, type DriverStage,
} from "@/lib/driver-store";

type Tab = "home" | "dispatch" | "comms" | "vehicle" | "activity" | "safety" | "account";
const dark = "bg-[#152235] text-white";
const primary = "flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#162235] px-4 text-[15px] font-semibold text-white active:scale-[.99]";
const lightButton = "flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] border border-[#DDE5EE] bg-white px-4 text-[14px] font-semibold text-[#20334A]";
const surface = "rounded-[22px] border border-[#E8EDF2] bg-white";
const secondaryText = "text-[13px] leading-relaxed text-[#6C7A8E]";
const stageActive = (stage: DriverStage) => !["offDuty", "available", "completed"].includes(stage);
const stepLabels: { id: DriverStage; name: string }[] = [
  { id: "offered", name: "Dispatch offer" }, { id: "accepted", name: "Accepted" },
  { id: "enRoute", name: "En route" }, { id: "atScene", name: "At scene" },
  { id: "transporting", name: "Transporting" }, { id: "atHospital", name: "At hospital" },
  { id: "completed", name: "Completed" },
];
function Btn({ label, onClick, variant = "dark", Icon = ArrowRight, disabled = false }: {
  label: string; onClick: () => void; variant?: "dark" | "red" | "quiet"; Icon?: typeof ArrowRight; disabled?: boolean;
}) {
  return <button type="button" disabled={disabled} onClick={onClick}
    className={(variant === "quiet" ? lightButton : variant === "red" ? primary.replace("bg-[#162235]", "bg-[#CE2939]") : primary) + " disabled:cursor-not-allowed disabled:opacity-50"}>
    <Icon className="size-5" />{label}
  </button>;
}
function SmallHeading({ label, action }: { label: string; action?: ReactNode }) {
  return <div className="flex min-h-8 items-center justify-between">
    <h2 className="text-[13px] font-bold uppercase tracking-[.1em] text-[#67788E]">{label}</h2>{action}
  </div>;
}
function InlineStatus({ label, stage }: { label: string; stage: DriverStage }) {
  const color = stage === "available" ? "bg-[#E1F2E9] text-[#167046]"
    : stage === "offered" ? "bg-[#FFE8E9] text-[#A72435]"
    : stage === "offDuty" ? "bg-[#E8EDF3] text-[#66768A]" : "bg-[#E5EFF9] text-[#1A619B]";
  return <span className={"rounded-full px-3 py-1.5 text-[12px] font-semibold " + color}>{label}</span>;
}
function RouteMap({ destination, assignment }: { destination: "incident" | "hospital"; assignment: DriverAssignment }) {
  const target = destination === "incident" ? assignment.locationPoint : assignment.hospitalPoint;
  const title = destination === "incident" ? "Example incident location" : "Example hospital destination";
  const panoramaUrl = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + encodeURIComponent(target[0] + "," + target[1]);
  const mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(target[0] + "," + target[1]) + "&travelmode=driving";
  return <>
    <div className="relative isolate h-[260px] overflow-hidden rounded-[24px] bg-[#243649]">
      <LazyMap mode="driver" center={target} from={DRIVER_PREVIEW_BASE}
        className="absolute inset-0" label={title + " training route, not live GPS"} />
      <div className="pointer-events-none absolute left-3 top-3 z-[450] rounded-full bg-[#142236]/90 px-3 py-2 text-[12px] font-semibold text-white">Training map · static route</div>
    </div>
    <a target="_blank" rel="noopener noreferrer" href={mapsUrl}
      className={lightButton}><Navigation className="size-5" /> Open destination in Maps <ExternalLink className="size-4" /></a>
    <div className="grid grid-cols-2 gap-2">
      <a target="_blank" rel="noopener noreferrer" href={panoramaUrl} className={lightButton+" text-center text-[12px]"}>Look up Street View <ExternalLink className="size-4" /></a>
      <div className="flex min-h-13 items-center justify-center rounded-[18px] bg-[#EDF1F5] px-3 text-center text-[12px] text-[#6C7B8C]">Other units' ETAs unavailable</div>
    </div>
    <p className={secondaryText}>Ordinary route illustration only. Ambulance dimensions, legal exemptions, road restrictions and current road name are not validated. Navigation may be unavailable in remote areas. Pull over safely before interacting.</p>
  </>;
}
function AssignmentSummary({ assignment }: { assignment: DriverAssignment }) {
  return <div className={surface + " overflow-hidden"}>
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[12px] font-semibold tracking-[.1em] text-[#B32636]">TRAINING INCIDENT</p>
          <h3 className="mt-1 text-[21px] font-bold text-[#192A40]">{assignment.category}</h3></div>
        <span className="rounded-full bg-[#FFF0F1] px-3 py-2 text-[12px] font-semibold text-[#B32636]">{assignment.priority}</span>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[14px] font-medium text-[#34485D]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#D52E3C]" />{assignment.location}</p>
      <p className="mt-2 flex items-start gap-2 text-[13px] text-[#748197]"><Hospital className="mt-0.5 size-4 shrink-0" />{assignment.hospital}</p>
      <div className="mt-4 space-y-3 rounded-2xl bg-[#F3F6F9] p-3">
        <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#718095]">Patient requirements · training only</p>
          <p className="mt-1 text-[13px] text-[#2E435B]">{assignment.patientRequirements}</p></div>
        <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#718095]">Approach instructions</p>
          <p className="mt-1 text-[13px] text-[#2E435B]">{assignment.approachInstructions}</p></div>
        <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#718095]">Equipment needed</p>
          <p className="mt-1 text-[13px] text-[#2E435B]">{assignment.equipmentRequirements.join(" · ")}</p></div>
      </div>
      <div className="mt-3 rounded-2xl bg-[#FFF1E7] p-3">
        <p className="flex items-center gap-2 text-[12px] font-bold text-[#995C21]"><AlertTriangle className="size-4"/> Pre-arrival cautions</p>
        <ul className="mt-2 space-y-1">{assignment.cautionFlags.map(flag=><li key={flag} className="text-[13px] leading-relaxed text-[#87582F]">• {flag}</li>)}</ul>
      </div>
    </div>
    <div className="border-t border-[#EBEFF3] bg-[#F8FAFC] px-4 py-3 text-[12px] text-[#69788D]">
      Incident {assignment.id} · Simulated only
    </div>
  </div>;
}
function StepAction({ stage, onShowDispatch }: { stage: DriverStage; onShowDispatch: () => void }) {
  if (stage === "offDuty") return null;
  if (stage === "available") return <div className="space-y-3">
    <div className="rounded-[24px] bg-[#EAF0F6] p-5">
      <div className="grid size-11 place-items-center rounded-[14px] bg-white text-[#294B65]"><Radio className="size-6"/></div>
      <h3 className="mt-4 text-[21px] font-bold">Ready for assignments</h3>
      <p className={"mt-2 " + secondaryText}>This training environment does not receive real dispatch notifications.</p>
    </div>
    <Btn label="Load sample dispatch" Icon={Bell} onClick={() => { if (driver.simulateOffer()) onShowDispatch(); }} />
  </div>;
  if (stage === "offered") return <div className="grid grid-cols-2 gap-3">
    <Btn label="Decline" variant="quiet" Icon={X} onClick={() => { driver.decline(); onShowDispatch(); }} />
    <Btn label="Accept request" variant="red" Icon={Check} onClick={() => { driver.accept(); onShowDispatch(); }} />
  </div>;
  if (stage === "accepted") return <Btn label="Start route to scene" Icon={Navigation} onClick={() => driver.depart()} />;
  if (stage === "enRoute") return <Btn label="Mark arrival at scene" Icon={MapPin} onClick={() => driver.sceneArrival()} />;
  if (stage === "atScene") return <Btn label="Crew ready · begin transport" Icon={Truck} onClick={() => driver.beginTransport()} />;
  if (stage === "transporting") return <Btn label="Arrived at hospital" Icon={Hospital} onClick={() => driver.hospitalArrival()} />;
  if (stage === "atHospital") return <Btn label="Complete logistics handover" Icon={ClipboardCheck} onClick={() => driver.closeTrip()} />;
  if (stage === "completed") return <Btn label="Ready for next assignment" Icon={CheckCircle2} onClick={() => driver.readyForNext()} />;
  return null;
}
function HomeScreen({ to }: { to: (tab: Tab) => void }) {
  const state = useDriver();
  const inspected = VEHICLE_ITEMS.filter(x => state.inspection[x.id]).length;
  return <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div className="min-w-0"><p className="text-[12px] text-[#7D8B9A]">SHIFT OVERVIEW</p>
        <h2 className="mt-1 text-[26px] font-bold tracking-tight">Driver workspace</h2></div>
      <InlineStatus stage={state.stage} label={stageLabel(state.stage)} />
    </div>
    {state.stage === "offDuty" ? <>
      <div className="rounded-[26px] bg-[#162235] p-5 text-white">
        <div className="grid size-12 place-items-center rounded-2xl bg-white/10"><Truck className="size-6"/></div>
        <h3 className="mt-6 text-[27px] font-bold leading-tight">Your shift<br/>starts here.</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-white/70">Complete the vehicle checks before setting yourself available.</p>
        <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
          <span className="text-[13px] text-white/70">Vehicle readiness</span><span className="text-[15px] font-bold">{inspected} / {VEHICLE_ITEMS.length}</span>
        </div>
        <button onClick={() => to("vehicle")} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[14px] font-semibold text-[#162235]">
          <ClipboardCheck className="size-5"/> Complete vehicle checks
        </button>
      </div>
      {inspected === VEHICLE_ITEMS.length && <Btn disabled={!driver.readyToWork()} label="Start my shift" Icon={Power} onClick={() => driver.startShift()} />}
      {state.outOfServiceReason && <p className="rounded-2xl bg-[#FFF0F1] p-3 text-[13px] font-semibold text-[#9F2938]">Out of service. {state.outOfServiceReason}</p>}
      {driver.supplyIssues().length > 0 && <p className="rounded-2xl bg-[#FFF0E6] p-3 text-[13px] font-semibold text-[#8F5822]">Critical equipment issues must be resolved before starting a shift.</p>}
      {state.fatigueBreakRequested && <p className="rounded-2xl bg-[#FFF0E6] p-3 text-[13px] font-semibold text-[#8F5822]">Rest requested. Clear the training rest flag in Crew safety when fit for duty.</p>}
    </> : <>
      <div className={surface + " p-5"}>
        <div className="flex items-center justify-between gap-3"><span className="text-[12px] font-semibold tracking-wider text-[#73859C]">ASSIGNED VEHICLE</span><Truck className="size-5 text-[#41617D]" /></div>
        <p className="mt-3 text-[30px] font-bold tracking-tight">{state.unitId}</p>
        <p className={secondaryText}>{state.serviceArea}</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EEF3F8] px-3 py-3"><ShieldCheck className="size-5 text-[#2B6B91]"/><p className="text-[13px] text-[#4B6278]">Fleet connection is not yet configured</p></div>
      </div>
      {state.assignment && <button onClick={() => to("dispatch")} className="flex min-h-20 w-full items-center gap-4 rounded-[22px] bg-[#162235] p-4 text-left text-white">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#D72C3D]"><Siren className="size-6" /></span>
        <span className="flex-1"><span className="block text-[16px] font-bold">{stageLabel(state.stage)}</span><span className="mt-1 block text-[13px] text-white/65">{state.assignment.category} · {state.assignment.id}</span></span>
        <ChevronRight className="size-5"/>
      </button>}
      {state.stage === "available" && !driver.readyToWork() && <div className="rounded-2xl bg-[#FFF0E9] p-4 text-[13px] font-semibold text-[#99531A]">Not ready for dispatch. Resolve vehicle stock, defect or rest flags before loading a sample call.</div>}
      {state.stage === "available" && driver.readyToWork() && <StepAction stage={state.stage} onShowDispatch={() => to("dispatch")} />}
      {state.stage === "completed" && <StepAction stage={state.stage} onShowDispatch={() => to("home")} />}
      {state.stage === "available" && <button onClick={() => driver.endShift()} className="min-h-12 w-full text-[14px] font-semibold text-[#7A8698]">End shift</button>}
    </>}
    <SmallHeading label="Quick access"/>
    <div className="grid grid-cols-2 gap-3">
      <button onClick={()=>to("vehicle") } className={surface + " min-h-28 p-4 text-left"}><Wrench className="size-6 text-[#2B5675]"/><span className="mt-4 block text-[15px] font-semibold">Vehicle</span><span className="mt-1 block text-[12px] text-[#77869A]">Inspection & unit</span></button>
      <button onClick={()=>to("comms")} className={surface + " min-h-28 p-4 text-left"}><Radio className="size-6 text-[#2B5675]"/><span className="mt-4 block text-[15px] font-semibold">Comms</span><span className="mt-1 block text-[12px] text-[#77869A]">Local message log</span></button>
      <button onClick={()=>to("activity")} className={surface + " min-h-28 p-4 text-left"}><Activity className="size-6 text-[#2B5675]"/><span className="mt-4 block text-[15px] font-semibold">Activity</span><span className="mt-1 block text-[12px] text-[#77869A]">Recent trips</span></button>
      <button onClick={()=>to("safety")} className={surface + " min-h-28 p-4 text-left"}><ShieldCheck className="size-6 text-[#2B5675]"/><span className="mt-4 block text-[15px] font-semibold">Crew safety</span><span className="mt-1 block text-[12px] text-[#77869A]">Check-ins & rest</span></button>
    </div>
  </div>;
}
function DispatchScreen() {
  const state=useDriver();
  const a=state.assignment;
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-2"><h2 className="text-[27px] font-bold">Dispatch</h2><InlineStatus stage={state.stage} label={stageLabel(state.stage)} /></div>
    {!a ? <div className={surface + " p-6"}>
      <div className="grid size-13 place-items-center rounded-2xl bg-[#EDF3F8] text-[#325774]"><Radio className="size-7"/></div>
      <h3 className="mt-5 text-[22px] font-bold">No active assignment</h3>
      <p className={"mt-2 " + secondaryText}>{state.stage==="offDuty" ? "Start a shift after your vehicle inspection to access the training dispatch flow." : "A demo assignment can be loaded from the Home screen. No real dispatcher is connected."}</p>
    </div> : <>
      {state.stage==="offered" && <div className="flex items-center gap-3 rounded-[20px] bg-[#FEF0F1] p-4 text-[#AA2636]">
        <AlertTriangle className="size-6 shrink-0"/><div><p className="font-bold">Incoming training request</p><p className="text-[12px]">Not an actual ambulance dispatch</p></div>
      </div>}
      <AssignmentSummary assignment={a}/>
      {["offered","accepted","enRoute","transporting"].includes(state.stage) && <RouteMap destination={state.stage==="transporting"?"hospital":"incident"} assignment={a}/>}
      {state.stage==="atScene" && <div className={surface+" p-5"}>
        <div className="grid size-12 place-items-center rounded-2xl bg-[#EAF0F7] text-[#335673]"><MapPin className="size-6"/></div>
        <h3 className="mt-3 text-[21px] font-bold">At the scene</h3>
        <p className={"mt-2 " + secondaryText}>Keep the vehicle safe and coordinate with the medical crew. In a live system, transport would require confirmation from the appropriate clinical personnel.</p>
      </div>}
      {state.stage==="atHospital" && <div className={surface+" p-5"}>
        <Hospital className="size-7 text-[#28638B]"/><h3 className="mt-4 text-[21px] font-bold">Hospital arrival</h3>
        <p className={"mt-2 "+secondaryText}>This action records driver-side logistics only. Medical handover belongs to the qualified crew and receiving facility.</p>
      </div>}
      {state.stage==="completed" && <div className={surface+" p-5"}>
        <CheckCircle2 className="size-9 text-[#26865E]"/><h3 className="mt-3 text-[22px] font-bold">Training trip complete</h3>
        <p className={"mt-2 "+secondaryText}>The trip was added to your local activity history. No hospital or dispatcher was notified.</p>
      </div>}
      <StepAction stage={state.stage} onShowDispatch={()=>{}} />
      <section className={surface+" p-4"}>
        <SmallHeading label="Response timeline"/>
        <div className="mt-3 space-y-3">{stepLabels.map((item,i)=>{
          const idx=stepLabels.findIndex(x=>x.id===state.stage);
          const done=i<=idx;
          return <div key={item.id} className="flex items-center gap-3">
            <span className={"grid size-7 place-items-center rounded-full border-2 "+(done?"border-[#237C59] bg-[#237C59] text-white":"border-[#D9E1EA] text-[#97A5B5]")}>{done?<Check className="size-4"/>:<span className="size-1.5 rounded-full bg-current"/>}</span>
            <span className={"text-[13px] "+(done?"font-semibold text-[#20384D]":"text-[#8390A1]")}>{item.name}</span>
          </div>;
        })}</div>
      </section>
    </>}
  </div>;
}
function VehicleScreen() {
  const state=useDriver();
  const [view,setView]=useState<"checks"|"equipment">("checks");
  const completed=VEHICLE_ITEMS.filter(x=>state.inspection[x.id]).length;
  const checksLocked=stageActive(state.stage);
  return <div className="space-y-4">
    <div><p className="text-[12px] font-bold tracking-widest text-[#7A8797]">VEHICLE READINESS</p><h2 className="mt-1 text-[29px] font-bold">Your ambulance</h2><p className={secondaryText}>{state.unitId} · Example fleet assignment</p></div>
    <div className="grid grid-cols-2 rounded-2xl bg-[#E8EDF3] p-1">
      <button onClick={()=>setView("checks")} className={"min-h-11 rounded-xl text-[13px] font-semibold "+(view==="checks"?"bg-white text-[#19334B]":"text-[#738095]")}>Inspection</button>
      <button onClick={()=>setView("equipment")} className={"min-h-11 rounded-xl text-[13px] font-semibold "+(view==="equipment"?"bg-white text-[#19334B]":"text-[#738095]")}>Equipment & defects</button>
    </div>
    {view === "checks" && <>
    <div className="rounded-[22px] bg-[#162235] p-5 text-white">
      <div className="flex justify-between"><Truck className="size-7"/><span className="text-[14px] font-semibold">{completed}/{VEHICLE_ITEMS.length} checks</span></div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#74CCAC]" style={{width:(completed/VEHICLE_ITEMS.length*100)+"%"}}/></div>
      <p className="mt-3 text-[13px] text-white/70">{completed===VEHICLE_ITEMS.length?"Vehicle inspection complete": "Complete each driver's safety check before starting a shift."}</p>
    </div>
    <div className={surface+" divide-y divide-[#E8EDF3] px-4"}>
      {VEHICLE_ITEMS.map(item=><label key={item.id} className="flex min-h-[80px] items-center gap-3 py-3">
        <span className={"grid size-11 shrink-0 place-items-center rounded-2xl "+(state.inspection[item.id]?"bg-[#E4F5EB] text-[#208257]":"bg-[#F1F4F7] text-[#667A91]")}>{state.inspection[item.id]?<Check className="size-5"/>:<Wrench className="size-5"/>}</span>
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{item.label}</span><span className="block text-[12px] text-[#78879A]">{item.detail}</span></span>
        <input aria-label={item.label} type="checkbox" className="size-5 accent-[#217A59]" disabled={checksLocked} checked={state.inspection[item.id]} onChange={e=>driver.checklist(item.id,e.target.checked)}/>
      </label>)}
    </div>
    {checksLocked && <p className={secondaryText}>Vehicle checks are locked while a response is active. In a live system, defects and out-of-service status would be reported to fleet control.</p>}
    {state.outOfServiceReason && <p className="rounded-2xl bg-[#FFF0F1] p-3 text-[13px] font-semibold text-[#A52F3A]">Out of service: {state.outOfServiceReason}</p>}
    {driver.supplyIssues().length > 0 && <p className="rounded-2xl bg-[#FFF0E5] p-3 text-[13px] font-semibold text-[#96521B]">Stock inspection required: {driver.supplyIssues().length} critical items</p>}
    {state.maintenanceDue && new Date(state.maintenanceDue+"T23:59:59").getTime() < Date.now() && <p className="rounded-2xl bg-[#FFF0F1] p-3 text-[13px] font-semibold text-[#A52F3A]">Vehicle maintenance date is overdue. New training assignments blocked.</p>}
    {state.stage==="offDuty" && <Btn disabled={!driver.readyToWork()} label="Start my shift" Icon={Power} onClick={()=>driver.startShift()}/>}
    </>}
    {view === "equipment" && <DriverInventoryPanel/>}
  </div>;
}
function ActivityScreen(){
  const state=useDriver();
  return <div className="space-y-4">
    <h2 className="text-[29px] font-bold">Shift activity</h2>
    <div className="rounded-[22px] bg-[#162235] p-5 text-white">
      <p className="text-[12px] font-semibold tracking-widest text-white/60">SESSION SUMMARY</p>
      <p className="mt-4 text-[40px] font-bold tabular-nums">{state.history.length}</p>
      <p className="text-[14px] text-white/65">Training trips completed</p>
    </div>
    <SmallHeading label="Recent trips"/>
    {state.history.length ? state.history.map((entry,i)=><div key={entry.id+"-"+i} className={surface+" flex gap-3 p-4"}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EAF6EF] text-[#20855D]"><CheckCircle2 className="size-5"/></span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{entry.id}</p><p className={secondaryText}>{entry.area}</p><p className="mt-2 text-[12px] text-[#8A97A7]">{new Date(entry.completedAt).toLocaleString()}</p>
      <details className="mt-2"><summary className="cursor-pointer text-[12px] font-semibold text-[#376588]">View status timestamps</summary>
      <ol className="mt-2 space-y-1">{entry.timeline.map((event,n)=><li key={n} className="text-[12px] text-[#6D7C90]">{stageLabel(event.stage)} · {new Date(event.time).toLocaleTimeString()}</li>)}</ol></details></div>
    </div>) : <div className={surface+" p-6 text-center"}><Clock3 className="mx-auto size-9 text-[#A6B5C5]"/><h3 className="mt-3 text-[17px] font-bold">No trips yet</h3><p className={"mt-2 "+secondaryText}>Once a simulated transport is completed, it will appear here.</p></div>}
    <p className={secondaryText}>This is session-only training history and will disappear after a page refresh.</p>
    <DriverHandoverPanel />
    <DriverClinicalBoundary />
  </div>;
}
function AccountScreen({to}:{to:(tab:Tab)=>void}){
  const state=useDriver();
  return <div className="space-y-5">
    <h2 className="text-[29px] font-bold">Driver profile</h2>
    <div className={surface+" flex items-center gap-4 p-5"}><span className="grid size-18 place-items-center rounded-full bg-[#E3ECF3] text-[#375672]"><UserRound className="size-9"/></span><div><p className="text-[20px] font-bold">Training driver</p><p className={secondaryText}>No verified driver account linked</p></div></div>
    <div className={surface+" space-y-3 p-5"}><SmallHeading label="Assignment"/><p className="text-[16px] font-semibold">{state.unitId}</p><p className={secondaryText}>{state.serviceArea}</p><div className="border-t border-[#EBF0F4] pt-4"><p className="font-semibold">Verification pending</p><p className={"mt-1 "+secondaryText}>A real driver account will require provider-issued credentials, vehicle assignment and role-based authorisation.</p></div></div>
    <button onClick={()=>to("safety")} className={lightButton}><ShieldCheck className="size-5"/> Crew safety and fatigue</button>
    <Link to="/" className={lightButton}><ArrowLeft className="size-5"/> Back to citizen experience</Link>
    <Btn label="Reset driver preview" Icon={Power} variant="quiet" onClick={()=>{if(window.confirm("Clear the training session and all local trip history?"))driver.resetPreview();}}/>
  </div>;
}
const links: { tab: Tab; label: string; Icon: typeof Truck }[]=[
  {tab:"home",label:"Home",Icon:Truck},
  {tab:"dispatch",label:"Dispatch",Icon:Radio},
  {tab:"comms",label:"Comms",Icon:Bell},
  {tab:"vehicle",label:"Vehicle",Icon:Wrench},
  {tab:"activity",label:"Activity",Icon:Activity},
];
export default function DriverApp(){
  const state=useDriver();
  const [tab,setTab]=useState<Tab>("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); }, [tab]);
  const title={home:"Driver",dispatch:"Dispatch",comms:"Comms",vehicle:"Vehicle",activity:"Activity",safety:"Crew safety",account:"Profile"}[tab];
  return <div className="flex h-full flex-col bg-[#F6F8FA] text-[#162235]">
    <header className={dark+" shrink-0 px-5 pb-5 pt-safe"}>
      <div className="mt-3 flex items-center justify-between">
        <div><p className="text-[12px] font-semibold tracking-[.13em] text-white/55">CARENEAR / DRIVER</p><p className="mt-1 text-[18px] font-bold">{title}</p></div>
        <button onClick={()=>setTab(tab==="account"?"home":"account")} aria-label="Driver profile" className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10"><UserRound className="size-5"/></button>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2"><span className="text-[13px] text-white/75">{state.unitId}</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white">{stageLabel(state.stage)}</span></div>
    </header>
    <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="space-y-4 px-5 pb-7 pt-5">
        <div className="flex items-center gap-2 rounded-xl bg-[#FFF1E5] px-3 py-2 text-[#915B18]">
          <AlertTriangle className="size-4 shrink-0"/><span className="text-[12px] font-semibold">Driver training preview. No real assignments.</span>
        </div>
        {(tab==="home" || tab==="dispatch") && <DriverNetworkBanner/>}
        {state.stage==="offered" && tab!=="dispatch" && <div role="status" className="rounded-[22px] border border-[#F0C3C8] bg-[#FFF0F1] p-4">
          <div className="flex items-start gap-3"><Siren className="mt-0.5 size-6 shrink-0 text-[#B62C3C]"/>
            <div className="flex-1"><p className="text-[16px] font-bold text-[#9C2634]">Sample dispatch available</p>
            <p className="mt-1 text-[13px] text-[#81515A]">{state.assignment?.category} · {state.assignment?.id}. Not sent by a real control room.</p></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={()=>driver.decline()} className="min-h-12 rounded-xl border border-[#E5B3BA] text-[13px] font-bold text-[#9C2634]">Decline</button>
            <button disabled={Boolean(state.outOfServiceReason||state.fatigueBreakRequested)} onClick={()=>{if(driver.accept())setTab("dispatch");}} className="min-h-12 rounded-xl bg-[#C52C3D] text-[13px] font-bold text-white disabled:opacity-40">Accept in one tap</button>
          </div>
          <button onClick={()=>setTab("dispatch")} className="mt-2 min-h-11 w-full text-[13px] font-semibold text-[#654959]">Review full incident details</button>
        </div>}
        {tab==="home"&&<HomeScreen to={setTab}/>}
        {tab==="dispatch"&&<DispatchScreen/>}
        {tab==="comms"&&<DriverCommunicationsScreen/>}
        {tab==="vehicle"&&<VehicleScreen/>}
        {tab==="activity"&&<ActivityScreen/>}
        {tab==="safety"&&<div className="space-y-4"><h2 className="text-[29px] font-bold">Crew safety</h2><DriverCrewSafetyPanel /></div>}
        {tab==="account"&&<AccountScreen to={setTab}/>}
      </div>
    </div>
    <nav aria-label="Driver navigation" className="shrink-0 border-t border-[#DFE5EC] bg-white pb-safe">
      <ul className="grid grid-cols-5">{links.map(({tab:item,label,Icon})=><li key={item}>
        <button onClick={()=>setTab(item)} aria-current={tab===item?"page":undefined} className={"flex min-h-[62px] w-full flex-col items-center justify-center gap-1 text-[12px] font-semibold "+(tab===item?"text-[#C9293A]":"text-[#6E7F93]")}><Icon className="size-5"/>{label}</button>
      </li>)}</ul>
    </nav>
  </div>;
}
