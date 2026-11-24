import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check,
  CheckCircle2, ChevronRight, ClipboardCheck, Clock3, ExternalLink,
  HeartPulse, Hospital, Map as MapIcon, MapPin, MessageCircle, Mic,
  Navigation, Package, Radio, ShieldAlert, ShieldCheck,
  Siren, Truck, UserRound, Video, WifiOff, X,
} from "lucide-react";
import { LazyMap } from "@/components/nr/LazyMap";
import { useConnectivity } from "@/lib/connectivity";
import {
  driver, useDriver, stageLabel, VEHICLE_ITEMS, SUPPLY_KEYS,
  supplyIssue, dateOverdue, DRIVER_PREVIEW_BASE,
  type DriverStage, type DriverAssignment,
} from "@/lib/driver-store";

type Screen = "home" | "dispatch" | "navigation" | "details" | "vehicle" |
  "comms" | "trips" | "profile" | "safety";
type MainTab = "home" | "dispatch" | "trips" | "profile";
type TripSection = "incident" | "patient" | "handover";
const HERO_AMBULANCE = "https://images.unsplash.com/photo-1642438114426-bad6b9ce05da?auto=format&fit=crop&w=1000&q=82";
const HERO_CITY = "https://images.unsplash.com/photo-1771450092348-5f33e2cc2963?auto=format&fit=crop&w=900&q=78";

const panel = "overflow-hidden rounded-[21px] border border-[#E9EBF0] bg-white";
const small = "text-[13px] leading-[1.45] text-[#798392]";
const actionRed = "flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#C91E32] px-5 text-[15px] font-semibold text-white active:scale-[.99] disabled:opacity-45";
const actionDark = "flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#142235] px-5 text-[15px] font-semibold text-white active:scale-[.99] disabled:opacity-45";
const actionLight = "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-[#E4E7ED] bg-white px-4 text-[14px] font-semibold text-[#243449] disabled:opacity-45";
const hasActiveCall = (stage: DriverStage) => !["offDuty", "available", "completed"].includes(stage);
const mapDirections = (point: [number, number]) =>
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent(point.join(",")) + "&travelmode=driving";

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={"text-[10px] font-bold uppercase tracking-[0.16em] " + (light ? "text-white/60" : "text-[#8490A0]")}>{children}</p>;
}
function PageHeader({ title, onBack, trailing }: { title: string; onBack: () => void; trailing?: ReactNode }) {
  return <header className="flex items-center justify-between px-5 pt-[calc(var(--safe-top)+8px)] pb-4">
    <button type="button" aria-label="Go back" onClick={onBack}
      className="grid size-11 place-items-center rounded-full bg-white text-[#172235] active:bg-[#E9EDF1]"><ArrowLeft className="size-[21px]" /></button>
    <h1 className="text-[16px] font-semibold tracking-[-0.02em]">{title}</h1>
    <div className="flex size-11 items-center justify-center">{trailing || null}</div>
  </header>;
}
function ScreenTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <div className="px-5 pb-5">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1 className="mt-1 text-[31px] font-bold leading-[1.12] tracking-[-0.048em] text-[#162235]">{title}</h1>
    {detail && <p className={"mt-2 " + small}>{detail}</p>}
  </div>;
}
function GroupTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="mb-2 flex min-h-7 items-center justify-between px-1">
    <h2 className="text-[15px] font-semibold tracking-[-0.025em] text-[#1A283A]">{children}</h2>{right}
  </div>;
}
function StatePill({ stage }: { stage: DriverStage }) {
  const available = stage === "available";
  const active = hasActiveCall(stage);
  return <span className={"inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold " +
    (available ? "bg-[#E3F6E9] text-[#247A47]" : active ? "bg-[#FDE5E8] text-[#A92A38]" : "bg-[#E8EBEF] text-[#617084]")}>
    <span className={"size-[7px] rounded-full " + (available ? "bg-[#299D56]" : active ? "bg-[#CE2336]" : "bg-[#9AA5B3]")} />
    {stage === "offDuty" ? "Off shift" : stageLabel(stage)}
  </span>;
}
function InfoLine({ icon, title, children, alert = false }: { icon: ReactNode; title: string; children: ReactNode; alert?: boolean }) {
  return <div className="flex min-h-16 gap-3 py-3">
    <div className={"mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl " + (alert ? "bg-[#FCEAEC] text-[#BF2437]" : "bg-[#F0F3F7] text-[#34475E]")}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] font-semibold text-[#8993A0]">{title}</p>
      <div className="mt-1 text-[14px] font-medium leading-snug text-[#263447]">{children}</div>
    </div>
  </div>;
}

function HomeScreen({ go }: { go: (screen: Screen) => void }) {
  const state = useDriver();
  const ready = driver.readyToWork();
  const inspected = VEHICLE_ITEMS.filter(item => state.inspection[item.id]).length;
  const todayTrips = state.history.length;
  const quicks: { label: string; Icon: typeof Truck; action: () => void; red?: boolean; subtitle?: string }[] = [
    { label: "Dispatch", Icon: Radio, action: () => go("dispatch"), red: true, subtitle: state.stage === "offered" ? "New request" : "Assignments" },
    { label: "Navigation", Icon: Navigation, action: () => go("navigation"), subtitle: "Route preview" },
    { label: "Vehicle check", Icon: ClipboardCheck, action: () => go("vehicle"), subtitle: inspected + " of " + VEHICLE_ITEMS.length + " checks" },
    { label: "Equipment", Icon: Package, action: () => go("vehicle"), subtitle: driver.supplyIssues().length ? "Attention needed" : "Inventory" },
    { label: "Crew safety", Icon: ShieldCheck, action: () => go("safety"), subtitle: "Welfare & rest" },
    { label: "Messages", Icon: MessageCircle, action: () => go("comms"), subtitle: "Dispatch channel" },
  ];

  return <div className="min-h-full bg-[#F5F6F8]">
    <section className="relative h-[365px] overflow-hidden bg-[#142336] text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('" + HERO_AMBULANCE + "')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071324]/65 via-[#071324]/15 to-[#071324]/95" />
      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-8 pt-[calc(var(--safe-top)+16px)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[11px] bg-[#CD2335]"><HeartPulse className="size-[21px] stroke-[2.4]" /></span>
            <div className="leading-tight"><p className="text-[18px] font-extrabold tracking-[-0.055em]">CareNear</p><p className="text-[11px] tracking-wide text-white/75">Driver</p></div>
          </div>
          <button type="button" aria-label="Profile" onClick={() => go("profile")}
            className="grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm">
            <UserRound className="size-5" />
          </button>
        </div>
        <div>
          <p className="text-[15px] font-medium text-white/85">Your shift, at a glance.</p>
          <h1 className="mt-1 text-[39px] font-bold leading-none tracking-[-0.055em]">Driver workspace</h1>
          <button type="button" onClick={() => go("vehicle")}
            className="mt-6 flex min-h-[58px] w-full items-center gap-3 rounded-[17px] bg-white px-4 text-left text-[#172638] shadow-[0_8px_25px_rgba(0,0,0,.14)]">
            <span className={"size-2.5 rounded-full " + (state.stage === "available" ? "bg-[#21B86A]" : hasActiveCall(state.stage) ? "bg-[#D62437]" : "bg-[#95A1AC]")} />
            <span className="flex-1"><span className="block text-[14px] font-bold">{state.stage === "offDuty" ? "Off shift" : stageLabel(state.stage)}</span>
              <span className="block text-[12px] text-[#718096]">Ambulance {state.unitId} · Training</span></span>
            <ChevronRight className="size-[20px] text-[#69778A]" />
          </button>
        </div>
      </div>
    </section>

    <div className="space-y-6 px-5 pb-9 pt-6">
      <div>
        <GroupTitle>Workspace</GroupTitle>
        <div className="grid grid-cols-2 gap-3">
          {quicks.map(({label,Icon,action,red,subtitle}) => <button type="button" key={label} onClick={action}
            className={"flex min-h-[116px] flex-col items-start justify-between rounded-[21px] px-4 py-4 text-left transition-transform active:scale-[.985] " +
              (red ? "bg-[#C91D32] text-white" : "border border-[#EAECF0] bg-white text-[#1D2D40]")}>
            <Icon className="size-[23px]" strokeWidth={1.8} />
            <span><span className="block text-[15px] font-bold tracking-[-0.025em]">{label}</span>
              <span className={"mt-0.5 block text-[11px] " + (red ? "text-white/75" : "text-[#8591A0]")}>{subtitle}</span></span>
          </button>)}
        </div>
      </div>
      <section>
        <GroupTitle>Current shift <StatePill stage={state.stage}/></GroupTitle>
        <div className={panel + " p-4"}>
          <div className="grid grid-cols-3 divide-x divide-[#EBEDF0] text-center">
            <div><p className="text-[24px] font-bold tracking-tight">{todayTrips}</p><p className="mt-0.5 text-[12px] text-[#808B9B]">Demo trips</p></div>
            <div><p className="text-[24px] font-bold tracking-tight">—</p><p className="mt-0.5 text-[12px] text-[#808B9B]">Distance</p></div>
            <div><p className="text-[24px] font-bold tracking-tight">{inspected}/{VEHICLE_ITEMS.length}</p><p className="mt-0.5 text-[12px] text-[#808B9B]">Checks</p></div>
          </div>
          {state.stage === "offDuty" && <div className="mt-4 border-t border-[#EEF0F3] pt-4">
            <p className={small}>{ready ? "Vehicle checks complete. Start a training shift when ready." : "Complete your inspection and resolve any vehicle issues before starting."}</p>
            <button type="button" onClick={() => ready ? driver.startShift() : go("vehicle")} className={actionDark + " mt-3"}>
              {ready ? "Start training shift" : "Complete vehicle checks"} <ArrowRight className="size-[18px]" />
            </button>
          </div>}
          {state.stage === "available" && <div className="mt-4 border-t border-[#EEF0F3] pt-4">
            <p className={small}>Training mode. No operator is connected.</p>
            <button type="button" disabled={!ready} onClick={() => { if (driver.simulateOffer()) go("dispatch"); }} className={actionRed + " mt-3"}>
              <Radio className="size-5" /> Load sample dispatch
            </button>
            <button type="button" onClick={() => driver.endShift()} className="mt-2 min-h-11 w-full text-[13px] font-semibold text-[#738093]">End training shift</button>
          </div>}
          {hasActiveCall(state.stage) && <button type="button" onClick={() => go("dispatch")}
            className="mt-4 flex min-h-12 w-full items-center justify-between rounded-[14px] bg-[#F8EAEC] px-4 text-[13px] font-semibold text-[#AC2C3B]">
            Continue {state.assignment?.id ?? "training call"} <ChevronRight className="size-5" />
          </button>}
          {state.stage === "completed" && <button type="button" disabled={!ready} onClick={() => driver.readyForNext()} className={actionDark + " mt-4"}>
            Ready for next training call
          </button>}
        </div>
      </section>
      <p className="px-1 text-[11px] leading-relaxed text-[#9AA4B1]">Training interface. No ambulance, dispatcher, patient or hospital is connected.</p>
    </div>
  </div>;
}

function EmptyDispatch({ go }: { go: (screen: Screen) => void }) {
  const state = useDriver();
  return <div className="flex min-h-full flex-col bg-[#F5F6F8]">
    <PageHeader title="Dispatch" onBack={() => go("home")} trailing={<Radio className="size-5 text-[#4B617A]" />} />
    <div className="px-5 pt-5">
      <Eyebrow>Current assignment</Eyebrow>
      <h1 className="mt-2 text-[32px] font-bold tracking-[-0.045em]">No active dispatch.</h1>
      <p className={"mt-3 " + small}>New assignments will appear here once official dispatch connectivity is configured. The training environment can load a fictional incident.</p>
      <div className={panel + " mt-6 p-5"}>
        <div className="grid size-12 place-items-center rounded-2xl bg-[#EEF2F6] text-[#547089]"><Radio className="size-6"/></div>
        <p className="mt-4 text-[18px] font-bold">Ready for a sample call?</p>
        <p className={"mt-2 " + small}>{state.stage === "offDuty" ? "Start a training shift and complete vehicle checks first." : "Only sample assignments are available in this build."}</p>
        <button type="button" className={actionRed + " mt-5"} disabled={state.stage !== "available" || !driver.readyToWork()}
          onClick={() => driver.simulateOffer()}><Siren className="size-5" /> Load training dispatch</button>
      </div>
    </div>
  </div>;
}

function OfferScreen({ go, assignment }: { go: (screen: Screen) => void; assignment: DriverAssignment }) {
  const state = useDriver();
  const [confirmedDecline,setConfirmedDecline] = useState(false);
  return <div className="relative flex min-h-full flex-col overflow-hidden bg-[#0D1827] text-white">
    <div className="absolute inset-x-0 top-0 h-[310px] bg-cover bg-center" style={{ backgroundImage: "url('" + HERO_CITY + "')" }} />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D1827]/30 via-[#0D1827]/90 to-[#0D1827]" />
    <div className="relative z-10 flex flex-1 flex-col px-5 pb-6 pt-[calc(var(--safe-top)+18px)]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Back to home" onClick={() => go("home")} className="grid size-11 place-items-center rounded-full bg-white/10"><ArrowLeft className="size-5"/></button>
        <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-[12px] font-semibold backdrop-blur-sm">
          <Radio className="size-4"/> Training dispatch
        </span>
        <span className="size-11" />
      </div>
      <div className="mt-14">
        <Eyebrow light>Incoming assignment</Eyebrow>
        <h1 className="mt-3 text-[38px] font-bold tracking-[-0.055em]">New dispatch</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-[#D42B3E] px-3 py-1.5 text-[12px] font-semibold">Urgent</span>
          <span className="text-[13px] text-white/70">{assignment.id}</span>
        </div>
      </div>
      <section className="mt-6 rounded-[23px] border border-white/15 bg-[#172335]/90 p-4 backdrop-blur-lg">
        <div className="divide-y divide-white/10">
          <div className="flex items-start gap-3 py-2.5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-white/80"/>
            <div><p className="text-[12px] text-white/55">Pickup</p><p className="mt-1 text-[14px] font-semibold">{assignment.location}</p></div>
          </div>
          <div className="flex items-start gap-3 py-2.5">
            <Hospital className="mt-0.5 size-5 shrink-0 text-white/80"/>
            <div><p className="text-[12px] text-white/55">Destination</p><p className="mt-1 text-[14px] font-semibold">{assignment.hospital}</p></div>
          </div>
          <div className="flex items-start gap-3 py-2.5">
            <HeartPulse className="mt-0.5 size-5 shrink-0 text-white/80"/>
            <div><p className="text-[12px] text-white/55">Patient requirements</p><p className="mt-1 text-[13px] leading-snug">{assignment.patientRequirements}</p></div>
          </div>
          <div className="flex items-start gap-3 py-2.5">
            <Package className="mt-0.5 size-5 shrink-0 text-white/80"/>
            <div><p className="text-[12px] text-white/55">Equipment</p><p className="mt-1 text-[13px] leading-snug">{assignment.equipmentRequirements.join(" · ")}</p></div>
          </div>
          <div className="flex items-start gap-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#FF7581]"/>
            <div><p className="text-[12px] text-[#FF98A1]">Approach cautions</p>
              <p className="mt-1 text-[13px] leading-snug">{assignment.cautionFlags.join(" · ")}</p></div>
          </div>
        </div>
      </section>
      <button type="button" onClick={() => go("details")} className="mt-2 min-h-11 text-[13px] font-semibold text-white/70">Review full incident details <ChevronRight className="inline size-4"/></button>
      <div className="mt-auto space-y-3 pt-6">
        <button type="button" disabled={Boolean(state.outOfServiceReason || state.fatigueBreakRequested)}
          className={actionRed} onClick={() => { if (driver.accept()) go("details"); }}>
          <Check className="size-5"/> Accept dispatch
        </button>
        {confirmedDecline ?
          <div className="flex gap-2"><button type="button" className={actionLight + " flex-1"} onClick={()=>setConfirmedDecline(false)}>Cancel</button>
            <button type="button" className={actionRed + " flex-1"} onClick={()=>{ driver.decline(); go("home"); }}>Confirm decline</button></div> :
          <button type="button" className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-white/10 text-[14px] font-semibold text-white" onClick={()=>setConfirmedDecline(true)}><X className="size-4"/> Decline</button>}
        <p className="text-center text-[11px] leading-relaxed text-white/55">Fictional assignment. No emergency request has been received.</p>
      </div>
    </div>
  </div>;
}

function ProgressSteps({ stage }: { stage: DriverStage }) {
  const steps: { id: DriverStage; label: string }[] = [
    { id:"accepted",label:"Accepted" }, { id:"enRoute",label:"En route" },
    { id:"atScene",label:"At scene" }, { id:"transporting",label:"Departed" },
    { id:"atHospital",label:"At hospital" }, { id:"completed",label:"Completed" },
  ];
  const idx = steps.findIndex(x=>x.id===stage);
  return <ol className="space-y-0">
    {steps.map((step,i) => <li key={step.id} className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={"grid size-7 shrink-0 place-items-center rounded-full border-2 " +
          (i<=idx ? "border-[#24A15D] bg-[#24A15D] text-white" : "border-[#DCE1E8] bg-white text-[#A9B4C0]")}>{i<=idx ? <Check className="size-4"/> : <span className="size-1.5 rounded-full bg-current"/>}</span>
        {i!==steps.length-1 && <span className={"h-7 w-[2px] " + (i<idx ? "bg-[#24A15D]" : "bg-[#E5E9EE]")} />}
      </div>
      <p className={"pt-1 text-[14px] " + (i<=idx ? "font-semibold text-[#21354B]" : "text-[#8994A1]")}>{step.label}</p>
    </li>)}
  </ol>;
}

function DriverNextAction({ stage, go }: { stage: DriverStage; go: (s: Screen) => void }) {
  if (stage === "offered") return <button type="button" className={actionRed} disabled={!driver.readyToWork()} onClick={() => driver.accept()}><Check className="size-5"/> Accept training dispatch</button>;
  if (stage === "accepted") return <button type="button" className={actionRed} disabled={Boolean(driver.get().outOfServiceReason)}
    onClick={() => { if (driver.depart()) go("navigation"); }}><Navigation className="size-5"/> Start route to pickup</button>;
  if (stage === "enRoute") return <button type="button" className={actionRed} onClick={() => go("navigation")}><Navigation className="size-5"/> Continue navigation</button>;
  if (stage === "atScene") return <button type="button" className={actionRed} disabled={Boolean(driver.get().outOfServiceReason)}
    onClick={() => { if (driver.beginTransport()) go("navigation"); }}><Truck className="size-5"/> Begin transport</button>;
  if (stage === "transporting") return <button type="button" className={actionRed} onClick={() => go("navigation")}><Navigation className="size-5"/> Continue to hospital</button>;
  if (stage === "atHospital") return <button type="button" className={actionRed} onClick={() => driver.closeTrip()}><CheckCircle2 className="size-5"/> Complete logistics handover</button>;
  if (stage === "completed") return <button type="button" className={actionDark} disabled={!driver.readyToWork()}
    onClick={() => { if(driver.readyForNext()) go("home"); }}><CheckCircle2 className="size-5"/> Ready for next assignment</button>;
  return null;
}

function TripDetails({ go, back = "dispatch" }: { go: (s: Screen) => void; back?: Screen }) {
  const state = useDriver();
  const a = state.assignment;
  const [section,setSection] = useState<TripSection>("incident");
  if (!a) return <EmptyDispatch go={go}/>;
  return <div className="min-h-full bg-[#F5F6F8]">
    <PageHeader title="Trip details" onBack={() => go(back)} trailing={<span className="text-[12px] font-semibold text-[#7B8798]">{a.id.slice(-3)}</span>} />
    <div className="px-5 pb-7">
      <div className="flex items-center justify-between">
        <div><Eyebrow>Training incident</Eyebrow><h2 className="mt-1 text-[27px] font-bold tracking-[-0.04em]">{a.category}</h2></div>
        <span className="rounded-full bg-[#FDE5E7] px-3 py-1.5 text-[12px] font-semibold text-[#B52D3D]">{a.priority}</span>
      </div>
      <div role="tablist" aria-label="Trip sections" className="mt-5 grid grid-cols-3 rounded-[16px] bg-[#E9EBEF] p-1">
        {(["incident","patient","handover"] as const).map(k=><button type="button" role="tab" aria-selected={section===k}
          onClick={()=>setSection(k)} key={k} className={"min-h-10 rounded-[12px] text-[13px] font-semibold capitalize " +
            (section===k ? "bg-white text-[#19273C] shadow-sm" : "text-[#6F7B89]")}>{k}</button>)}
      </div>
      {section==="incident" && <div className="space-y-4 pt-5">
        <div className={panel+" divide-y divide-[#EEF0F3] px-4"}>
          <InfoLine icon={<MapPin className="size-5"/>} title="Pickup">{a.location}</InfoLine>
          <InfoLine icon={<Hospital className="size-5"/>} title="Destination">{a.hospital}</InfoLine>
          <InfoLine icon={<ClipboardCheck className="size-5"/>} title="Equipment required">{a.equipmentRequirements.join(" · ")}</InfoLine>
          <InfoLine icon={<AlertTriangle className="size-5"/>} title="Cautions" alert>{a.cautionFlags.join(" · ")}</InfoLine>
          <InfoLine icon={<Navigation className="size-5"/>} title="Approach instructions">{a.approachInstructions}</InfoLine>
        </div>
        <div className={panel+" p-4"}>
          <GroupTitle>Response status <StatePill stage={state.stage}/></GroupTitle>
          <ProgressSteps stage={state.stage} />
        </div>
      </div>}
      {section==="patient" && <div className={panel+" mt-5 p-5"}>
        <div className="grid size-12 place-items-center rounded-[15px] bg-[#F0F2F6] text-[#5D7489]"><HeartPulse className="size-6"/></div>
        <h3 className="mt-4 text-[20px] font-bold">Clinical record not connected</h3>
        <p className={small+" mt-2"}>{a.patientRequirements}</p>
        <p className={small+" mt-4"}>Patient vitals, intervention records and medications will be accessible only to authorised clinical personnel after secure integration. The driver preview does not invent clinical readings.</p>
      </div>}
      {section==="handover" && <div className={panel+" mt-5 p-5"}>
        <h3 className="text-[20px] font-bold">Hospital handover</h3>
        <p className={small+" mt-2"}>The driver confirms transport logistics. A qualified crew member completes the medical handover.</p>
        <div className="mt-5 space-y-2 border-y border-[#EEF0F3] py-4">
          {["Situation","Background","Assessment","Recommendation"].map((s,i)=><div key={s} className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-[#F8E7E9] text-[13px] font-bold text-[#B52536]">{s[0]}</span>
            <span className="text-[14px] font-medium">{s}</span>
          </div>)}
        </div>
        <button type="button" disabled className={actionLight+" mt-5"}>Encrypted QR handover unavailable</button>
        <p className={small+" mt-2"}>No hospital has been notified and no patient record has been transferred.</p>
      </div>}
      <div className="mt-6"><DriverNextAction stage={state.stage} go={go}/></div>
      <p className="mt-3 text-center text-[11px] text-[#909BAA]">Training flow · Local status changes only</p>
    </div>
  </div>;
}

function DispatchView({go}:{go:(s:Screen)=>void}) {
  const state=useDriver();
  if (!state.assignment) return <EmptyDispatch go={go}/>;
  if (state.stage==="offered") return <OfferScreen go={go} assignment={state.assignment}/>;
  return <TripDetails go={go} back="home"/>;
}

function NavigationView({ go }: { go: (s: Screen) => void }) {
  const state = useDriver();
  const a = state.assignment;
  const hospital = state.stage === "transporting" || state.stage === "atHospital" || state.stage === "completed";
  const destination = a ? (hospital ? a.hospitalPoint : a.locationPoint) : DRIVER_PREVIEW_BASE;
  const label = a ? (hospital ? a.hospital : a.location) : "No active destination";
  return <div className="relative flex h-full min-h-[600px] flex-col overflow-hidden bg-[#E0E5E9]">
    <div className="absolute inset-0 z-0">
      {a ? <LazyMap mode="driver" center={destination} from={DRIVER_PREVIEW_BASE} className="h-full w-full"
          label="Illustrative training route with no live location or ETA" /> :
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#E4E9E8] text-[#748295]"><MapIcon className="size-10"/><p>No active training route</p></div>}
    </div>
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-36 bg-gradient-to-b from-[#102033]/70 to-transparent"/>
    <div className="pointer-events-none relative z-[500] flex h-full flex-col">
      <div className="pointer-events-auto flex items-center justify-between px-5 pt-[calc(var(--safe-top)+8px)]">
        <button type="button" aria-label="Back" onClick={()=>go(a?"details":"home")} className="grid size-11 place-items-center rounded-full bg-[#142237] text-white shadow-lg"><ArrowLeft className="size-5"/></button>
        <span className="rounded-full bg-[#142237] px-4 py-2 text-[12px] font-semibold text-white">Route preview · Not live</span>
        <span className="size-11"/>
      </div>
      {a && <div className="pointer-events-auto mx-5 mt-4 rounded-[20px] bg-[#142237] px-4 py-4 text-white shadow-[0_6px_24px_rgba(0,0,0,.16)]">
        <div className="flex items-center gap-3">
          <Navigation className="size-7 shrink-0 text-white"/>
          <div><p className="text-[12px] text-white/55">Next destination</p>
            <p className="mt-1 text-[16px] font-bold leading-tight">{label}</p></div>
        </div>
      </div>}
      <div className="flex-1"/>
      <div className="pointer-events-auto rounded-t-[29px] bg-white px-5 pb-[calc(var(--safe-bottom)+18px)] pt-5 shadow-[0_-12px_50px_rgba(8,22,37,.13)]">
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-[#E2E6EA]"/>
        <div className="flex items-start justify-between gap-3">
          <div><Eyebrow>{hospital?"Hospital destination":"Pickup location"}</Eyebrow>
            <p className="mt-2 text-[18px] font-bold leading-snug tracking-[-0.03em]">{label}</p>
            <p className={small+" mt-1"}>Example coordinates · Windhoek training scenario</p></div>
          <span className="rounded-full bg-[#ECF2F8] px-3 py-2 text-[12px] font-bold text-[#386082]">ETA unavailable</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {a && <a href={mapDirections(destination)} target="_blank" rel="noopener noreferrer" className={actionLight}><Navigation className="size-4"/> Open Maps <ExternalLink className="size-4"/></a>}
          {a && <a href={"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint="+encodeURIComponent(destination.join(","))}
            target="_blank" rel="noopener noreferrer" className={actionLight}>Street View <ExternalLink className="size-4"/></a>}
        </div>
        <p className="mt-3 text-[11px] leading-[1.4] text-[#82909D]">Not emergency-exemption navigation. Vehicle restrictions, offline routing and live location are not verified. Stop safely before interacting.</p>
        {state.stage==="accepted" && <button type="button" onClick={()=>driver.depart()} disabled={Boolean(state.outOfServiceReason)} className={actionRed+" mt-4"}><Navigation className="size-5"/> Start route to scene</button>}
        {state.stage==="enRoute" && <button type="button" onClick={()=>driver.sceneArrival()} className={actionRed+" mt-4"}><MapPin className="size-5"/> Confirm scene arrival</button>}
        {state.stage==="atScene" && <button type="button" onClick={()=>driver.beginTransport()} disabled={Boolean(state.outOfServiceReason)} className={actionRed+" mt-4"}><Truck className="size-5"/> Begin transport to hospital</button>}
        {state.stage==="transporting" && <button type="button" onClick={()=>driver.hospitalArrival()} className={actionRed+" mt-4"}><Hospital className="size-5"/> Confirm hospital arrival</button>}
        {state.stage==="atHospital" && <button type="button" onClick={()=>{if(driver.closeTrip())go("details");}} className={actionRed+" mt-4"}><CheckCircle2 className="size-5"/> Complete logistics handover</button>}
        {!a && <button type="button" onClick={()=>go("dispatch")} className={actionDark+" mt-4"}>Go to Dispatch <ArrowRight className="size-5"/></button>}
      </div>
    </div>
  </div>;
}

function VehicleView({ go }: { go: (s: Screen) => void }) {
  const state = useDriver();
  const [section,setSection]=useState<"checklist"|"equipment"|"maintenance">("checklist");
  const [defect,setDefect]=useState("");
  const [confirmDefect,setConfirmDefect]=useState(false);
  const checked = VEHICLE_ITEMS.filter(item=>state.inspection[item.id]).length;
  const locked = hasActiveCall(state.stage);
  return <div className="min-h-full bg-[#F5F6F8] pb-8">
    <PageHeader title="Vehicle" onBack={()=>go("home")} trailing={<Truck className="size-5 text-[#566A80]"/>}/>
    <ScreenTitle eyebrow="Ambulance • Training unit" title={state.unitId} detail="Inspection, stock and maintenance checks before every shift."/>
    <div className="px-5">
      <div className={"rounded-[23px] px-5 py-5 text-white "+(state.outOfServiceReason?"bg-[#AE293A]":"bg-[#142337]")}>
        <div className="flex items-center justify-between">
          <div><Eyebrow light>Vehicle readiness</Eyebrow><p className="mt-1 text-[22px] font-bold">{state.outOfServiceReason?"Out of service":driver.readyToWork()?"Ready for shift":"Check required"}</p></div>
          <span className="text-[22px] font-bold tabular-nums">{checked}/{VEHICLE_ITEMS.length}</span>
        </div>
        <div className="mt-5 h-[6px] overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#67D49C] transition-[width]" style={{width:checked/VEHICLE_ITEMS.length*100+"%"}}/></div>
      </div>
      <div role="tablist" aria-label="Vehicle sections" className="mt-5 grid grid-cols-3 rounded-[15px] bg-[#E9EBEF] p-1">
        {(["checklist","equipment","maintenance"] as const).map(k=><button type="button" role="tab" key={k}
          aria-selected={section===k} onClick={()=>setSection(k)} className={"min-h-11 rounded-[11px] text-[12px] font-semibold capitalize "+(section===k?"bg-white text-[#14253A] shadow-sm":"text-[#718093]")}>{k}</button>)}
      </div>
      {section==="checklist" && <div className="mt-5 space-y-4">
        <GroupTitle>Pre-shift inspection</GroupTitle>
        <div className={panel+" divide-y divide-[#EDF0F3] px-4"}>
          {VEHICLE_ITEMS.map(item=><label key={item.id} className="flex min-h-[75px] items-center gap-3 py-3">
            <span className={"grid size-10 shrink-0 place-items-center rounded-[13px] "+(state.inspection[item.id]?"bg-[#E8F8EE] text-[#189859]":"bg-[#F1F3F7] text-[#72869B]")}>
              {state.inspection[item.id]?<Check className="size-5"/>:<ClipboardCheck className="size-5"/>}</span>
            <span className="flex-1"><span className="block text-[14px] font-semibold text-[#223447]">{item.label}</span>
              <span className="mt-0.5 block text-[11px] text-[#8C96A3]">{item.detail}</span></span>
            <input type="checkbox" aria-label={item.label} disabled={locked} checked={state.inspection[item.id]} onChange={e=>driver.checklist(item.id,e.target.checked)}
              className="size-[21px] accent-[#24A166] disabled:opacity-40" />
          </label>)}
        </div>
        {(state.outOfServiceReason||driver.supplyIssues().length>0||dateOverdue(state.maintenanceDue)) &&
          <div className="rounded-[18px] bg-[#FEEDF0] p-4 text-[13px] font-semibold text-[#A32D3D]">
            <AlertTriangle className="mr-2 inline size-4"/> Vehicle or equipment issue. New assignments are blocked.
          </div>}
        {state.stage==="offDuty" && <button type="button" disabled={!driver.readyToWork()} onClick={()=>{if(driver.startShift())go("home");}} className={actionRed}>Start training shift <ArrowRight className="size-5"/></button>}
      </div>}
      {section==="equipment" && <div className="mt-5 space-y-4">
        <GroupTitle>Medical equipment <span className="text-[12px] font-medium text-[#8792A0]">Sample inventory</span></GroupTitle>
        <div className={panel+" divide-y divide-[#EEF0F2] px-4"}>
          {SUPPLY_KEYS.map(key=>{
            const item=state.supplies[key];
            const issue=supplyIssue(item);
            return <div className="py-4" key={key}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1"><p className="text-[14px] font-semibold">{item.label}</p>
                  <p className={"mt-1 text-[12px] "+(issue?"font-semibold text-[#C52A3C]":"text-[#8C98A6]")}>{issue||"In stock"} · Minimum {item.minimum}</p></div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={"Reduce "+item.label} disabled={locked||item.count===0} onClick={()=>driver.setSupplyCount(key,item.count-1)}
                    className="grid size-9 place-items-center rounded-full bg-[#F0F2F5] disabled:opacity-30">−</button>
                  <span className="w-6 text-center text-[15px] font-bold">{item.count}</span>
                  <button type="button" aria-label={"Add "+item.label} disabled={locked} onClick={()=>driver.setSupplyCount(key,item.count+1)}
                    className="grid size-9 place-items-center rounded-full bg-[#F0F2F5] disabled:opacity-30">+</button>
                </div>
              </div>
              <label className="mt-3 flex items-center justify-between text-[12px] text-[#78879A]">Expiry date (optional)
                <input type="date" className="min-h-9 rounded-lg border border-[#E8EAF0] px-2 text-[12px] disabled:opacity-40" disabled={locked}
                  value={item.expiry||""} onChange={e=>driver.setSupplyExpiry(key,e.target.value||null)}/></label>
            </div>;
          })}
        </div>
        <p className={small}>Demo stock only. A real fleet integration must verify equipment availability and expiry dates.</p>
      </div>}
      {section==="maintenance" && <div className="mt-5 space-y-4">
        <GroupTitle>Vehicle condition</GroupTitle>
        <div className={panel+" p-4"}>
          <label className="flex items-center justify-between gap-2 text-[14px] font-semibold">Next service
            <input type="date" disabled={locked} value={state.maintenanceDue||""}
              onChange={e=>driver.setMaintenanceDue(e.target.value||null)}
              className="min-h-11 max-w-[160px] rounded-xl border border-[#E6E9EF] px-2 text-[13px] font-normal disabled:opacity-40"/></label>
          {dateOverdue(state.maintenanceDue) && <p className="mt-3 text-[13px] font-semibold text-[#B32938]">Service date overdue. Vehicle cannot take another training assignment.</p>}
        </div>
        <div className={panel+" p-4"}>
          <GroupTitle>Report a defect</GroupTitle>
          {state.outOfServiceReason ? <div className="rounded-[16px] bg-[#FDE8EC] p-4 text-[#A42D3B]">
            <p className="text-[14px] font-bold">Vehicle out of service</p><p className="mt-1 text-[13px]">{state.outOfServiceReason}</p>
            <p className="mt-3 text-[12px]">Training reset is available under Profile. Live clearance would require fleet authorisation.</p>
          </div> : <>
            <textarea aria-label="Describe vehicle issue" maxLength={280} value={defect} onChange={e=>setDefect(e.target.value)}
              rows={3} placeholder="Describe a vehicle safety issue..." className="w-full resize-none rounded-[14px] border border-[#E6E9EE] bg-[#F8F9FB] p-3 text-[14px]"/>
            {!confirmDefect ? <button type="button" disabled={!defect.trim()} onClick={()=>setConfirmDefect(true)} className={actionDark+" mt-3"}>Report a defect</button> :
              <div className="mt-3 space-y-2"><p className="text-[13px] font-semibold">Mark the training unit out of service?</p>
                <button type="button" className={actionRed} onClick={()=>{driver.reportDefect(defect);setConfirmDefect(false);setDefect("");}}>Confirm out of service</button>
                <button type="button" className={actionLight} onClick={()=>setConfirmDefect(false)}>Cancel</button></div>}
          </>}
        </div>
      </div>}
    </div>
  </div>;
}

function CommsView({go}:{go:(s:Screen)=>void}) {
  const state=useDriver();
  const online=useConnectivity();
  const [draft,setDraft]=useState("");
  const [showStatus,setShowStatus]=useState(false);
  const presets=["On scene","Departing to hospital","Request scene guidance","Vehicle issue reported"];
  const send=(text:string)=>{if(driver.addMessage(text))setDraft("");};
  return <div className="min-h-full bg-[#F5F6F8] pb-8">
    <PageHeader title="Communications" onBack={()=>go("home")} trailing={<Radio className="size-5 text-[#61758C]"/>} />
    <ScreenTitle eyebrow="Dispatch channel" title="Messages" detail="Local training communication. No control room is connected."/>
    <div className="space-y-5 px-5">
      <div className="flex items-start gap-3 rounded-[18px] bg-[#FFF0E8] p-3 text-[#925A28]">
        {online==="offline"?<WifiOff className="size-5 shrink-0"/>:<Radio className="size-5 shrink-0"/>}
        <p className="text-[12px] leading-relaxed">Device {online==="online"?"reports online":online==="offline"?"reports offline":"connectivity unknown"}. Messages and status changes are not transmitted, even when online.</p>
      </div>
      <div className="flex min-h-11 rounded-[14px] bg-[#E8EBF0] p-1">
        <button type="button" className={"flex-1 rounded-[11px] text-[13px] font-semibold "+(!showStatus?"bg-white text-[#203146] shadow-sm":"text-[#7B8999]")} onClick={()=>setShowStatus(false)}>Messages</button>
        <button type="button" className={"flex-1 rounded-[11px] text-[13px] font-semibold "+(showStatus?"bg-white text-[#203146] shadow-sm":"text-[#7B8999]")} onClick={()=>setShowStatus(true)}>Status log</button>
      </div>
      {!showStatus ? <>
        <GroupTitle>Quick messages</GroupTitle>
        <div className="grid grid-cols-2 gap-2.5">{presets.map(p=><button type="button" key={p} disabled={state.stage==="offDuty"} onClick={()=>send(p)}
          className="min-h-[61px] rounded-[16px] border border-[#E7EBEF] bg-white px-3 text-left text-[13px] font-medium text-[#203449] disabled:opacity-40">{p} <ArrowRight className="mt-1 size-4 text-[#7C91A5]"/></button>)}</div>
        <div>
          <GroupTitle>Current session</GroupTitle>
          <div className={panel+" p-4"}>
            {state.messages.length===0 ? <div className="py-5 text-center"><MessageCircle className="mx-auto size-7 text-[#A8B1BD]"/><p className={small+" mt-3"}>No messages saved yet.</p></div> :
              <div className="space-y-3">{state.messages.map(m=><div key={m.id} className="rounded-[14px] bg-[#ECF1F6] p-3">
                <p className="text-[14px] font-medium">{m.text}</p>
                <p className="mt-2 text-[11px] text-[#8A96A6]">{new Date(m.at).toLocaleTimeString()} · Local only, not sent</p>
              </div>)}</div>}
          </div>
        </div>
        <div className={panel+" p-3"}>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={400} rows={2} placeholder="Write a training message..."
            className="w-full resize-none px-2 py-1 text-[14px] outline-none placeholder:text-[#A1ABB6]" aria-label="Training message"/>
          <button type="button" disabled={!draft.trim()||state.stage==="offDuty"} onClick={()=>send(draft)} className={actionDark+" mt-2"}>Save message locally</button>
        </div>
      </> : <div className={panel+" divide-y divide-[#EDF0F3] px-4"}>
        {state.events.length?state.events.map((entry,i)=><div key={i} className="flex gap-3 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#EDF5F1] text-[#278D64]"><Check className="size-4"/></span>
          <div><p className="text-[14px] font-semibold">{stageLabel(entry.stage)}</p><p className={small}>{new Date(entry.time).toLocaleString()} · Local preview</p></div>
        </div>):<p className={small+" py-5 text-center"}>No training status changes.</p>}
      </div>}
      <div className={panel+" p-4"}>
        <GroupTitle>Voice and media</GroupTitle>
        <p className={small}>Push-to-talk, photo and video dispatch need an authenticated control-room connection.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled className={actionLight}><Mic className="size-4"/> PTT unavailable</button>
          <button type="button" disabled className={actionLight}><Video className="size-4"/> Video unavailable</button>
        </div>
      </div>
    </div>
  </div>;
}

function TripsView({go}:{go:(s:Screen)=>void}) {
  const state=useDriver();
  return <div className="min-h-full bg-[#F5F6F8] pb-8">
    <PageHeader title="Trip history" onBack={()=>go("home")} trailing={<Clock3 className="size-5 text-[#63778E]"/>}/>
    <ScreenTitle eyebrow="Training session" title="Your trips" detail="Timeline and logistics from this browser session only."/>
    <div className="space-y-5 px-5">
      <div className="rounded-[22px] bg-[#152538] px-5 py-5 text-white">
        <Eyebrow light>Completed training trips</Eyebrow>
        <p className="mt-3 text-[44px] font-bold tracking-tight">{state.history.length}</p>
        <p className="mt-1 text-[13px] text-white/60">This history resets when the page reloads.</p>
      </div>
      {state.history.length ? <div className="space-y-3">{state.history.map((trip,i)=><div key={trip.id+"-"+i} className={panel+" px-4 py-4"}>
        <div className="flex items-start justify-between"><div><p className="text-[15px] font-bold">{trip.id}</p><p className={small+" mt-1"}>{trip.area}</p></div><CheckCircle2 className="size-5 text-[#299E65]"/></div>
        <p className="mt-2 text-[13px] text-[#67788B]">To {trip.destination}</p>
        <details className="mt-4 border-t border-[#EDF0F3] pt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-[#42627D]">View timestamp history</summary>
          <div className="mt-3 space-y-3">{trip.timeline.map((ev,j)=><p key={j} className="flex justify-between gap-2 text-[12px]"><span>{stageLabel(ev.stage)}</span><span className="text-[#8793A1]">{new Date(ev.time).toLocaleTimeString()}</span></p>)}</div>
        </details>
      </div>)}</div> : <div className={panel+" px-5 py-10 text-center"}>
        <Clock3 className="mx-auto size-8 text-[#A0ABBA]"/><p className="mt-3 text-[18px] font-bold">No trips yet</p><p className={small+" mt-2"}>Completed sample assignments will appear here.</p>
        <button type="button" onClick={()=>go("dispatch")} className={actionDark+" mt-5"}>View Dispatch</button>
      </div>}
      <div className={panel+" p-4"}>
        <GroupTitle>Shift handover notes</GroupTitle>
        <p className={small}>Operational notes only. Do not enter patient information.</p>
        <textarea value={state.handoverNote} onChange={e=>driver.updateHandover(e.target.value)} maxLength={2000} rows={4}
          aria-label="Shift handover notes" placeholder="Vehicle, fuel, stock or crew notes..."
          className="mt-3 w-full resize-none rounded-[15px] bg-[#F5F6F8] p-3 text-[14px] outline-none"/>
        <p className="mt-2 text-[11px] text-[#929DA9]">Not saved to a server or shared with another crew.</p>
      </div>
    </div>
  </div>;
}

function SafetyView({go}:{go:(s:Screen)=>void}) {
  const state=useDriver();
  return <div className="min-h-full bg-[#F5F6F8] pb-8">
    <PageHeader title="Crew safety" onBack={()=>go("home")} trailing={<ShieldCheck className="size-5 text-[#617990]"/>}/>
    <ScreenTitle eyebrow="Shift welfare" title="Crew check-ins" detail="Safety, breaks and escalation readiness."/>
    <div className="space-y-4 px-5">
      <div className={panel+" p-4"}>
        <GroupTitle>Check in</GroupTitle>
        <p className={small}>Records a local check-in. No supervisor receives it.</p>
        <button type="button" className={actionDark+" mt-4"} disabled={state.stage==="offDuty"} onClick={()=>driver.checkInSafe()}>
          <ShieldCheck className="size-5"/> Record I'm safe
        </button>
        {state.safetyCheckins.length>0 && <p className={small+" mt-3"}>Last local check-in: {new Date(state.safetyCheckins[0]!).toLocaleTimeString()}</p>}
      </div>
      <div className={panel+" p-4"}>
        <GroupTitle>Fatigue and rest</GroupTitle>
        <p className={small}>Requesting rest blocks new training assignments but does not cancel an active response.</p>
        <button type="button" className={actionLight+" mt-4"} onClick={()=>driver.setFatigueBreak(!state.fatigueBreakRequested)}>
          {state.fatigueBreakRequested?"Clear training rest flag":"I need a break"}
        </button>
        {state.fatigueBreakRequested && <p className="mt-3 text-[12px] font-semibold text-[#9D6324]">Rest flag active. New sample assignments blocked.</p>}
      </div>
      <div className={panel+" p-4"}>
        <div className="flex gap-3"><ShieldAlert className="size-6 shrink-0 text-[#C02739]"/>
          <div><GroupTitle>Duress alert</GroupTitle><p className={small}>A silent SOS would require an active monitored channel and confirmed delivery. This prototype cannot alert anyone.</p></div></div>
        <button type="button" disabled className={actionRed+" mt-4"}>Duress alert unavailable</button>
        <p className={small+" mt-3"}>For immediate danger, use your organisation's established emergency radio or phone procedures.</p>
      </div>
    </div>
  </div>;
}

function ProfileView({go}:{go:(s:Screen)=>void}) {
  const state=useDriver();
  const [resetConfirm,setResetConfirm]=useState(false);
  return <div className="min-h-full bg-[#F5F6F8] pb-8">
    <PageHeader title="Profile" onBack={()=>go("home")} trailing={<UserRound className="size-5 text-[#617990]"/>}/>
    <div className="px-5">
      <div className={panel+" flex items-center gap-4 p-4"}>
        <div className="grid size-[65px] shrink-0 place-items-center rounded-full bg-[#DFE8F1] text-[#44637C]"><UserRound className="size-9"/></div>
        <div><p className="text-[20px] font-bold tracking-tight">Training driver</p><p className={small}>Identity verification not configured</p></div>
      </div>
      <div className="mt-6">
        <GroupTitle>Account and operations</GroupTitle>
        <div className={panel+" divide-y divide-[#EDEFF2] px-4"}>
          {[
            {label:"Assigned unit",value:state.unitId,go:()=>go("vehicle")},
            {label:"Crew safety",value:"Check-ins & rest",go:()=>go("safety")},
            {label:"Communications",value:"Local-only messages",go:()=>go("comms")},
            {label:"Trip history",value:state.history.length+" sample trips",go:()=>go("trips")},
          ].map(item=><button type="button" key={item.label} onClick={item.go} className="flex min-h-[68px] w-full items-center justify-between gap-3 text-left">
            <span><span className="block text-[14px] font-semibold">{item.label}</span><span className="mt-1 block text-[12px] text-[#8A96A4]">{item.value}</span></span>
            <ChevronRight className="size-5 text-[#B0B9C4]"/>
          </button>)}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Link to="/" className={actionLight}>Citizen experience <ArrowRight className="size-4"/></Link>
        {!resetConfirm?<button type="button" className="min-h-12 w-full text-[13px] font-semibold text-[#9A2B3C]" onClick={()=>setResetConfirm(true)}>Reset training data</button>:
          <div className={panel+" p-4"}><p className="text-[13px] font-semibold">Clear the current training shift and all local notes?</p>
            <button type="button" className={actionRed+" mt-3"} onClick={()=>{driver.resetPreview();setResetConfirm(false);go("home");}}>Clear training data</button>
            <button type="button" className={actionLight+" mt-2"} onClick={()=>setResetConfirm(false)}>Cancel</button>
          </div>}
      </div>
      <p className="mt-6 px-2 text-center text-[11px] leading-relaxed text-[#A2ACB6]">CareNear Driver · UI prototype. No verified users, incident routing or real emergency dispatch.</p>
    </div>
  </div>;
}

const bottom: { id:MainTab;label:string; Icon:typeof Truck }[]=[
  {id:"home",label:"Home",Icon:Truck},
  {id:"dispatch",label:"Dispatch",Icon:Radio},
  {id:"trips",label:"Trips",Icon:Clock3},
  {id:"profile",label:"Profile",Icon:UserRound},
];
export default function CareNearDriver() {
  const state = useDriver();
  const [screen,setScreen] = useState<Screen>("home");
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(scroll.current)scroll.current.scrollTop=0; },[screen]);
  const go = (next:Screen)=>setScreen(next);
  const showMainTabs = screen==="home" || screen==="trips" || screen==="profile" || (screen==="dispatch" && !state.assignment);
  const selected:MainTab = bottom.some(x=>x.id===screen) ? screen as MainTab :
    screen==="comms"||screen==="vehicle"||screen==="navigation"||screen==="safety" ? "home" : "dispatch";
  return <div className="carenear-driver flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F6F8] text-[#152438]" style={{fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif'}}>
    <div ref={scroll} className="carenear-driver-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {screen==="home" && <HomeScreen go={go}/>}
      {screen==="dispatch" && <DispatchView go={go}/>}
      {screen==="navigation" && <NavigationView go={go}/>}
      {screen==="details" && <TripDetails go={go}/>}
      {screen==="vehicle" && <VehicleView go={go}/>}
      {screen==="comms" && <CommsView go={go}/>}
      {screen==="trips" && <TripsView go={go}/>}
      {screen==="profile" && <ProfileView go={go}/>}
      {screen==="safety" && <SafetyView go={go}/>}
    </div>
    {showMainTabs && <nav aria-label="Driver app navigation" className="z-[550] shrink-0 border-t border-[#E6E8ED] bg-[#FAFAFC]/95 pb-[calc(var(--safe-bottom)+4px)] backdrop-blur-md">
      <ul className="grid grid-cols-4">{bottom.map(({id,label,Icon})=><li key={id}>
        <button type="button" onClick={()=>go(id)} aria-current={selected===id?"page":undefined}
          className={"flex min-h-[61px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors "+(selected===id?"text-[#C81F33]":"text-[#7D8795]")}>
          <Icon className="size-[21px]" strokeWidth={selected===id?2.4:1.8} />
          {label}
        </button>
      </li>)}</ul>
    </nav>}
  </div>;
}
