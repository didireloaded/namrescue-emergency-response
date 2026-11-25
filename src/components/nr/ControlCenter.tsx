import { Link } from "@tanstack/react-router";
import { Ambulance, ClipboardList, MapPin, Radio, Route as RouteIcon, UsersRound } from "lucide-react";
import { useState } from "react";
import type { AmbulanceRequest, Status } from "@/routes/drill";
import { WINDHOEK } from "@/lib/demo-store";
import { LazyMap } from "./LazyMap";

const labels: Record<Status, string> = {
  requested: "Awaiting assignment",
  assigned: "Assigned",
  en_route: "En route",
  arrived: "Arrived",
};
const tones: Record<Status, string> = {
  requested: "bg-[#fbe9eb] text-[#981f35]",
  assigned: "bg-[#e7eef8] text-[#264c75]",
  en_route: "bg-[#e7eef8] text-[#264c75]",
  arrived: "bg-[#e4f0e9] text-[#235a3e]",
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
  const visible = requests.filter(({ status }) => (status === "arrived") === (filter === "arrived"));
  const selected = requests.find(({ id }) => id === selectedId) ?? visible[0];
  const unit = requests.find(({ status }) => status === "assigned" || status === "en_route");
  const waiting = requests.filter(({ status }) => status === "requested").length;
  const canAssign = selected?.status === "requested" && !unit && !pending && !disconnected;
  const pickup: [number, number] = selected ? [selected.latitude, selected.longitude] : WINDHOEK;
  const events = selected ? [
    { label: "Request received", at: selected.requested_at },
    { label: "Unit assigned", at: selected.assigned_at },
    { label: "Driver started route", at: selected.departed_at },
    { label: "Arrival confirmed", at: selected.arrived_at },
  ] : [];
  // Show real map tiles for the area without drawing a pickup marker until a request is selected.
  return (
    <div className="min-h-dvh bg-[#f2f4f6] text-[#162539] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#23628b]">
      <header className="border-b border-[#2a3b50] bg-[#142337] text-white">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#b82136]"><Radio className="size-5" aria-hidden /></span>
            <div><p className="text-lg font-bold tracking-tight">CareNear</p><p className="text-sm text-slate-300">Private workspace</p></div>
          </div>
          <nav aria-label="CareNear workspaces" className="flex flex-wrap gap-x-4 text-sm font-semibold">
            <Link to="/" className="flex min-h-11 items-center gap-2 text-slate-200 hover:underline"><UsersRound className="size-4" aria-hidden />Citizen app</Link>
            <Link to="/driver" className="flex min-h-11 items-center gap-2 text-slate-200 hover:underline"><Ambulance className="size-4" aria-hidden />Driver app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1680px] px-4 pb-8 pt-6 sm:px-7 lg:px-10 lg:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Control center</h1>
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-[#405568]">
            <span aria-hidden className={"size-2 rounded-full " + (disconnected ? "bg-[#ad6324]" : loaded ? "bg-[#347553]" : "bg-slate-400")} />
            {disconnected ? "Connection interrupted" : loaded ? "Queue synced" : "Connecting to queue"}
          </p>
        </div>
        {disconnected && <p className="mt-4 rounded-lg bg-[#fff0d9] p-3 text-[#694516]">Showing the last confirmed state. Assignment resumes when the connection returns.</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-[#fbe9eb] p-3 font-semibold text-[#981f35]">{error}</p>}
        <dl className="mt-5 grid grid-cols-2 divide-x divide-[#dbe1e7] rounded-xl border border-[#dbe1e7] bg-white">
          <div className="min-w-0 px-4 py-4 sm:px-6"><dt className="text-sm font-semibold text-[#485c70]">Awaiting assignment</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{loaded ? waiting : "—"}</dd></div>
          <div className="min-w-0 px-4 py-4 sm:px-6"><dt className="text-sm font-semibold text-[#485c70]">Unit 01</dt><dd className="mt-1 text-2xl font-bold">{loaded ? unit ? labels[unit.status] : "Available" : "—"}</dd></div>
        </dl>

        <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(300px,0.95fr)_minmax(0,1.65fr)] xl:gap-6">
          <section aria-labelledby="dispatch-queue" className="min-w-0 overflow-hidden rounded-xl border border-[#dbe1e7] bg-white">
            <div className="px-4 pt-4 sm:px-5">
              <h2 id="dispatch-queue" className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="size-5 text-[#485c70]" aria-hidden />Dispatch queue</h2>
              <div aria-label="Filter requests" role="group" className="mt-2 flex gap-4 text-sm font-semibold">
                <button type="button" aria-pressed={filter === "active"} onClick={() => { setFilter("active"); setSelectedId(undefined); }} className={"min-h-11 border-b-2 " + (filter === "active" ? "border-[#a92237] text-[#981f35]" : "border-transparent text-[#485c70]")}>Active</button>
                <button type="button" aria-pressed={filter === "arrived"} onClick={() => { setFilter("arrived"); setSelectedId(undefined); }} className={"min-h-11 border-b-2 " + (filter === "arrived" ? "border-[#a92237] text-[#981f35]" : "border-transparent text-[#485c70]")}>Recent arrivals</button>
              </div>
            </div>
            <div className="border-t border-[#dbe1e7]">
              {!visible.length && <p className="px-4 py-6 text-sm leading-relaxed text-[#485c70] sm:px-5">
                {!loaded ? disconnected ? "Could not load the queue. Reconnecting…" : "Loading requests…" : filter === "active" ? "New ambulance requests will appear here." : "No arrivals recorded yet."}
              </p>}
              <ul className="divide-y divide-[#e1e6eb] lg:max-h-[60vh] lg:overflow-y-auto">
                {visible.map((item) => <li key={item.id}>
                  <button type="button" aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}
                    className={"flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 border-l-4 px-4 py-4 text-left outline-offset-[-3px]! " +
                      (selected?.id === item.id ? "border-[#a92237] bg-[#f7f2f3]" : "border-transparent hover:bg-[#f5f7f9]")}>
                    <span><span className="block font-semibold">Request {reference(item)}</span>
                      <time className="text-sm text-[#485c70]" dateTime={new Date(item.requested_at).toISOString()}>{dateFormat.format(item.requested_at)}</time></span>
                    <span className={"rounded-md px-2 py-1 text-sm font-semibold " + tones[item.status]}>{labels[item.status]}</span>
                  </button>
                </li>)}
              </ul>
            </div>
          </section>

          <section aria-labelledby="request-detail" className="min-w-0 overflow-hidden rounded-xl border border-[#dbe1e7] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
              <div>
                <h2 id="request-detail" className="text-xl font-bold">{selected ? "Request " + reference(selected) : "Pickup map"}</h2>
                {selected && <p className="mt-1 flex items-center gap-1.5 text-sm text-[#485c70] tabular-nums"><MapPin aria-hidden className="size-4" />{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>}
              </div>
              {selected?.status === "requested" && <button type="button" disabled={!canAssign} onClick={() => { setSelectedId(selected.id); assign(selected.id); }}
                className="min-h-11 rounded-lg bg-[#a92237] px-4 text-sm font-semibold text-white hover:bg-[#891c2d] disabled:opacity-50">Assign Unit 01</button>}
              {selected && selected.status !== "requested" && <span className={"rounded-md px-2.5 py-1.5 text-sm font-semibold " + tones[selected.status]}>{labels[selected.status]}</span>}
            </div>
            {selected?.status === "requested" && unit && <p className="px-4 pb-3 text-sm text-[#485c70] sm:px-5">Unit 01 is assigned to request {reference(unit)}.</p>}
            <div className="h-[260px] border-y border-[#dbe1e7] bg-[#dbe4ea] sm:h-[330px] xl:h-[390px]">
              <LazyMap key={selected?.id ?? "area"} mode="locate" center={pickup} showLocationMarker={Boolean(selected)}
                label={selected ? "Selected ambulance pickup location" : "Windhoek coverage map"} className="h-full w-full" />
            </div>
            {selected ? <div className="p-4 sm:px-5">
              <h3 className="flex items-center gap-2 font-bold"><RouteIcon className="size-4 text-[#485c70]" aria-hidden />Response timeline</h3>
              <p className="mt-1 text-sm text-[#485c70]">Status updates come from dispatch and the driver. The map shows the pickup point.</p>
              <ol className="mt-3 divide-y divide-[#e1e6eb]">
                {events.map(({ label, at }) => <li key={label} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className={"flex items-center gap-2 " + (at === null ? "text-[#56677a]" : "font-semibold")}>
                    <span aria-hidden className={"size-2.5 rounded-full border " + (at === null ? "border-[#8797a8]" : "border-[#347553] bg-[#347553]")} />{label}
                  </span>
                  {at !== null ? <time className="tabular-nums text-[#485c70]" dateTime={new Date(at).toISOString()}>{dateFormat.format(at)}</time> : <span className="text-[#56677a]">Pending</span>}
                </li>)}
              </ol>
            </div> : <p className="p-4 text-sm text-[#485c70] sm:px-5">Select a request to see its pickup location and response timeline.</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
