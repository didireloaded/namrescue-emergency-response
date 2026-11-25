import { Link } from "@tanstack/react-router";
import { Ambulance, Check, ChevronRight, ClipboardList, MapPin, Radio, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import type { AmbulanceRequest, Status } from "@/routes/drill";
import { WINDHOEK } from "@/lib/demo-store";
import { LazyMap } from "./LazyMap";

const labels: Record<Status, string> = {
  requested: "Awaiting assignment", assigned: "Assigned", en_route: "En route", arrived: "Arrived",
};
const tones: Record<Status, string> = {
  requested: "bg-[#fff2dd] text-[#805019]",
  assigned: "bg-[#edf0ff] text-[#3446aa]",
  en_route: "bg-[#e5efff] text-[#245593]",
  arrived: "bg-[#e6f4eb] text-[#286148]",
};
const dateFormat = new Intl.DateTimeFormat("en-NA", {
  timeZone: "Africa/Windhoek", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});
const reference = (request: AmbulanceRequest) => request.id.slice(0, 8).toUpperCase();

interface Props {
  requests: AmbulanceRequest[];
  loaded: boolean;
  disconnected: boolean;
  error: string;
  pending: boolean;
  assign: (id: string) => void;
}

export function ControlCenter({ requests, loaded, disconnected, error, pending, assign }: Props) {
  const [filter, setFilter] = useState<"active" | "arrived">("active");
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toUpperCase();
  const active = requests.filter(({ status }) => status !== "arrived");
  const recent = requests.filter(({ status }) => status === "arrived");
  const visible = (filter === "active" ? active : recent).filter((item) => reference(item).includes(normalized));
  const selected = requests.find(({ id }) => id === selectedId) ?? visible[0];
  const unit = active.find(({ status }) => status === "assigned" || status === "en_route");
  const waiting = active.filter(({ status }) => status === "requested").length;
  const canAssign = selected?.status === "requested" && !unit && !pending && !disconnected;
  const pickup: [number, number] = selected ? [selected.latitude, selected.longitude] : WINDHOEK;
  const milestones = selected ? [
    { label: "Request received", at: selected.requested_at },
    { label: "Unit assigned", at: selected.assigned_at },
    { label: "Driver started route", at: selected.departed_at },
    { label: "Arrival confirmed", at: selected.arrived_at },
  ] : [];
  const station = "min-w-0 rounded-[20px] border border-[#e5e8ee] bg-white";
  const workspaceLink = "flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-sm font-semibold text-[#536176] hover:bg-[#e8ecf5]";
  return (
    <div className="min-h-dvh bg-[#edeff3] text-[#182238] [&_:is(a,button,input):focus-visible]:outline-2 [&_:is(a,button,input):focus-visible]:outline-offset-2 [&_:is(a,button,input):focus-visible]:outline-[#385acf]">
      <div className="mx-auto grid max-w-[1740px] gap-4 px-3 pb-6 pt-3 sm:px-5 lg:grid-cols-[175px_minmax(0,1fr)] lg:gap-5 lg:px-5 lg:pt-5 xl:grid-cols-[192px_minmax(0,1fr)]">
        <aside className="flex flex-wrap items-center gap-3 rounded-[20px] border border-[#e3e7ee] bg-[#f7f8fa] p-3 lg:sticky lg:top-5 lg:self-start lg:min-h-[calc(100dvh-2.5rem)] lg:flex-col lg:items-stretch lg:justify-start lg:p-4">
          <div className="flex items-center gap-2.5 lg:mb-4 lg:px-1 lg:pt-1">
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#344fc2] text-white"><Radio className="size-5" aria-hidden /></span>
            <span className="text-lg font-bold tracking-tight">CareNear</span>
          </div>
          <nav aria-label="CareNear workspaces" className="flex min-w-0 flex-wrap gap-1 lg:flex-col">
            <a href="#dispatch-queue" aria-current="page" className={workspaceLink + " bg-[#e3eaff] text-[#2f46ab]"}><ClipboardList className="size-4" aria-hidden /> Dispatch</a>
            <Link to="/" className={workspaceLink}><UsersRound className="size-4" aria-hidden /> Citizen app</Link>
            <Link to="/driver" className={workspaceLink}><Ambulance className="size-4" aria-hidden /> Driver app</Link>
          </nav>
          <p className="hidden text-sm font-medium text-[#59687c] lg:mt-auto lg:block lg:border-t lg:border-[#e5e8ee] lg:px-1 lg:pt-4">Private workspace</p>
        </aside>
        <main className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4 pt-1">
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.045em] lg:text-[34px]">Control center</h1>
            <p role="status" className="flex items-center gap-2 rounded-full border border-[#e2e6ed] bg-[#f9fafc] px-3 py-2 text-sm font-semibold text-[#4c5c70]">
              <span aria-hidden className={"size-2 rounded-full " + (disconnected ? "bg-[#ad6324]" : loaded ? "bg-[#347553]" : "bg-slate-400")} />
              {disconnected ? "Connection interrupted" : loaded ? "Queue synced" : "Connecting to queue"}
            </p>
          </header>
          {disconnected && <p className="mb-4 rounded-xl bg-[#fff0d9] p-3 text-[#694516]">Showing the last confirmed state. Assignment resumes when the connection returns.</p>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-[#fbe9eb] p-3 font-semibold text-[#981f35]">{error}</p>}
          <dl className="mb-4 grid gap-2 sm:grid-cols-3 sm:gap-3 lg:gap-4">
            <div className={station + " grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[auto_1fr] sm:gap-y-1 sm:px-4"}>
              <span className="grid size-9 place-items-center rounded-[12px] bg-[#fff2dc] text-[#8a561d] sm:row-span-2"><ClipboardList className="size-4" aria-hidden /></span>
              <dt className="text-sm font-semibold text-[#536176]">Awaiting assignment</dt>
              <dd className="text-xl font-bold tabular-nums sm:col-start-2">{loaded ? waiting : "—"}</dd>
            </div>
            <div className={station + " grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[auto_1fr] sm:gap-y-1 sm:px-4"}>
              <span className="grid size-9 place-items-center rounded-[12px] bg-[#e8edff] text-[#354db2] sm:row-span-2"><Ambulance className="size-4" aria-hidden /></span>
              <dt className="text-sm font-semibold text-[#536176]">Unit 01</dt>
              <dd className="text-xl font-bold sm:col-start-2">{loaded ? unit ? labels[unit.status] : "Available" : "—"}</dd>
            </div>
            <div className={station + " grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[auto_1fr] sm:gap-y-1 sm:px-4"}>
              <span className="grid size-9 place-items-center rounded-[12px] bg-[#e6f4ec] text-[#286148] sm:row-span-2"><Check className="size-4" aria-hidden /></span>
              <dt className="text-sm font-semibold text-[#536176]">Recent arrivals</dt>
              <dd className="text-xl font-bold tabular-nums sm:col-start-2">{loaded ? recent.length : "—"}</dd>
            </div>
          </dl>
          <div className="overflow-hidden rounded-[20px] border border-[#e2e6ed] bg-white lg:grid lg:min-h-[640px] lg:grid-cols-[minmax(280px,0.92fr)_minmax(0,1.08fr)] xl:grid-cols-[minmax(375px,0.92fr)_minmax(0,1.08fr)]">
            <section aria-labelledby="dispatch-queue" className="min-w-0 bg-[#fafbfc] p-4 sm:p-5 xl:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 tabIndex={-1} id="dispatch-queue" className="text-xl font-bold tracking-tight">Dispatch queue</h2>
                {loaded && <span className="rounded-md bg-[#edf0f5] px-2 py-0.5 text-sm font-semibold text-[#536176]">{visible.length} {visible.length === 1 ? "request" : "requests"}</span>}
              </div>
              <label className="mt-4 flex min-h-11 items-center gap-2 rounded-[10px] border border-[#e0e5ed] bg-white px-3 text-[#5c6b7e] focus-within:border-[#385acf]">
                <Search className="size-4 shrink-0" aria-hidden />
                <input type="search" aria-label="Search by request ID" placeholder="Search by request ID" value={query}
                  onChange={(event) => { setQuery(event.target.value); setSelectedId(undefined); }}
                  className="min-w-0 flex-1 bg-transparent text-base text-[#182238] outline-none focus-visible:outline-none! sm:text-sm" />
              </label>
              <div role="group" aria-label="Filter requests" className="my-4 flex flex-wrap gap-1.5 rounded-xl bg-[#edf0f5] p-1">
                <button type="button" aria-pressed={filter === "active"} onClick={() => { setFilter("active"); setSelectedId(undefined); }}
                  className={"min-h-10 rounded-lg px-3 text-sm font-semibold " + (filter === "active" ? "bg-white text-[#3049ab] shadow-sm" : "text-[#536176]")}>Active</button>
                <button type="button" aria-pressed={filter === "arrived"} onClick={() => { setFilter("arrived"); setSelectedId(undefined); }}
                  className={"min-h-10 rounded-lg px-3 text-sm font-semibold " + (filter === "arrived" ? "bg-white text-[#3049ab] shadow-sm" : "text-[#536176]")}>Recent arrivals</button>
              </div>
              {!visible.length && <p className="mt-6 text-sm leading-relaxed text-[#536176]">
                {!loaded ? disconnected ? "Could not load the queue. Reconnecting…" : "Loading requests…" : normalized ? "No requests match that ID." : filter === "active" ? "New ambulance requests will appear here." : "No arrivals recorded yet."}
              </p>}
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {visible.map((item) => <li key={item.id} className="min-w-0">
                  <button type="button" aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}
                    className={"h-full w-full rounded-[13px] border p-3.5 text-left " + (selected?.id === item.id ? "border-[#5971d9] bg-[#f4f6ff] ring-1 ring-[#5971d9]/25" : "border-[#e2e6ee] bg-white hover:border-[#9da9c4]")}>
                    <span className="flex items-center justify-between gap-2 font-bold">#{reference(item)}<ChevronRight aria-hidden className="size-4 shrink-0 text-[#65758d]" /></span>
                    <span className={"mt-2 inline-block rounded-md px-2 py-1 text-[13px] font-semibold " + tones[item.status]}>{labels[item.status]}</span>
                    <span className="mt-3 flex items-center gap-1.5 border-t border-[#e4e8f0] pt-2.5 text-[13px] text-[#536176] tabular-nums"><MapPin aria-hidden className="size-3.5 shrink-0" />{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                    <time className="mt-1 block text-[13px] text-[#536176]" dateTime={new Date(item.requested_at).toISOString()}>{dateFormat.format(item.requested_at)}</time>
                  </button>
                </li>)}
              </ul>
            </section>
            <section aria-labelledby="request-detail" className="min-w-0 border-t border-[#e5e8ee] p-4 sm:p-5 lg:border-l lg:border-t-0 xl:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="request-detail" className="text-[23px] font-bold leading-tight tracking-tight">{selected ? "Request #" + reference(selected) : "Pickup map"}</h2>
                  {selected && <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#536176] tabular-nums"><MapPin aria-hidden className="size-4" />{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>}
                </div>
                {selected?.status === "requested" && <button type="button" disabled={!canAssign} onClick={() => { setSelectedId(selected.id); assign(selected.id); }}
                  className="min-h-11 rounded-[10px] bg-[#344fc2] px-4 text-sm font-semibold text-white hover:bg-[#273e9f] disabled:opacity-50">Assign Unit 01</button>}
                {selected && selected.status !== "requested" && <span className={"rounded-md px-2.5 py-1.5 text-sm font-semibold " + tones[selected.status]}>{labels[selected.status]}</span>}
              </div>
              {selected?.status === "requested" && unit && <p className="mb-3 text-sm text-[#536176]">Unit 01 is assigned to request #{reference(unit)}.</p>}
              <div className="h-[250px] overflow-hidden rounded-[13px] border border-[#e0e6ed] bg-[#e2e8ef] sm:h-[310px] xl:h-[335px]">
                <LazyMap key={selected?.id ?? "area"} mode="locate" center={pickup} showLocationMarker={Boolean(selected)} showZoomControls
                  label={selected ? "Selected ambulance pickup location" : "Windhoek area map"} className="cn-control-map h-full w-full" />
              </div>
              {selected ? <div className="mt-5">
                <h3 className="font-bold">Response timeline</h3>
                <p className="mt-1 text-sm text-[#536176]">The map shows the pickup point. Status follows dispatcher and driver updates.</p>
                <ol className="mt-3">
                  {milestones.map(({ label, at }) => <li key={label} className="relative flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-l border-[#e1e7f3] py-2 pl-4 text-sm">
                    <span aria-hidden className={"absolute -left-[5px] top-3 size-2.5 rounded-full border-2 border-white ring-1 " + (at === null ? "bg-[#c2cbd9] ring-[#c2cbd9]" : "bg-[#4a63ca] ring-[#4a63ca]")} />
                    <span className={at === null ? "text-[#56677a]" : "font-semibold"}>{label}</span>
                    {at !== null ? <time className="tabular-nums text-[#536176]" dateTime={new Date(at).toISOString()}>{dateFormat.format(at)}</time> : <span className="text-[#56677a]">Pending</span>}
                  </li>)}
                </ol>
              </div> : <p className="mt-4 text-sm text-[#536176]">Select a request to see its pickup and response timeline.</p>}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
