import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Ambulance, MapPin } from "lucide-react";
import { LazyMap } from "@/components/nr/LazyMap";
import { WINDHOEK } from "@/lib/demo-store";
import { DRIVER_PREVIEW_BASE } from "@/lib/driver-store";
import type { LatLng } from "@/lib/demo-sim";

type Role = "citizen" | "driver" | "dispatcher";
type Status = "requested" | "assigned" | "en_route" | "arrived";
interface AmbulanceRequest {
  id: string;
  latitude: number;
  longitude: number;
  status: Status;
  requested_at: number;
  assigned_at: number | null;
  departed_at: number | null;
  arrived_at: number | null;
}

const statusText: Record<Status, string> = {
  requested: "Request received by CareNear",
  assigned: "Ambulance assigned",
  en_route: "Ambulance en route",
  arrived: "Ambulance arrived",
};
const timeLabel = new Intl.DateTimeFormat("en-NA", { timeZone: "Africa/Windhoek", hour: "2-digit", minute: "2-digit" });
const button = "min-h-12 rounded-xl bg-[#17283e] px-4 py-3 text-base font-semibold text-white disabled:opacity-45";
const origin = "/api/control-center";

export const Route = createFileRoute("/drill")({
  validateSearch: (search: Record<string, unknown>): { role: Role } => ({
    role: search["role"] === "driver" || search["role"] === "dispatcher" ? search["role"] : "citizen",
  }),
  head: () => ({ meta: [{ title: "CareNear coordination workspace" }] }),
  component: ResponseRoute,
});

function ResponseRoute() {
  const { role } = Route.useSearch();
  return <ResponseWorkspace key={role} role={role} />;
}

function ResponseWorkspace({ role }: { role: Role }) {
  const citizen = role === "citizen";
  const control = role === "dispatcher";
  const endpoint = origin + "?view=" + (control ? "control" : role);
  const [key, setKey] = useState<string | null>(null);
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pickup, setPickup] = useState<LatLng>(WINDHOEK);
  const mutation = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    if (citizen) setKey(sessionStorage.getItem("carenear-request"));
  }, [citizen]);

  useEffect(() => {
    if (citizen && !key) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        if (mutation.current) return;
        const observedRevision = revision.current;
        const response = await fetch(endpoint, {
          ...(key ? { headers: { Authorization: "Bearer " + key } } : {}),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Request failed");
        const result = await response.json() as { requests: AmbulanceRequest[] };
        if (!controller.signal.aborted && !mutation.current && observedRevision === revision.current) {
          setRequests(result.requests);
          setLoaded(true);
          setDisconnected(false);
        }
      } catch {
        if (!controller.signal.aborted) setDisconnected(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => { void refresh(); }, 2000);
      }
    };
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [citizen, endpoint, key]);

  async function send(action: string, id?: string) {
    if (mutation.current) return;
    mutation.current = true;
    revision.current += 1;
    setPending(true);
    setError("");
    try {
      let token = key;
      if (citizen && !token) {
        token = Array.from(crypto.getRandomValues(new Uint8Array(32)),
          (byte) => byte.toString(16).padStart(2, "0")).join("");
        sessionStorage.setItem("carenear-request", token);
        setKey(token);
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: JSON.stringify({ action, id, ...(citizen ? { latitude: pickup[0], longitude: pickup[1] } : {}) }),
      });
      const result = await response.json() as { error?: string; request?: AmbulanceRequest; requests?: AmbulanceRequest[] };
      if (!response.ok) setError(result.error ?? "CareNear could not confirm the change.");
      else if (result.requests) {
        setRequests(result.requests);
        setLoaded(true);
      } else if (result.request) {
        const changed = result.request;
        setRequests((current) => current.map((item) => item.id === changed.id ? changed : item));
      }
    } catch {
      setError("CareNear could not confirm the change. Check your connection and try again.");
    } finally {
      setPending(false);
      mutation.current = false;
    }
  }

  const request = requests[0];
  const unitBusy = requests.some(({ status }) => status === "assigned" || status === "en_route");
  const title = control ? "Control center" : citizen ? "Request an ambulance" : "Driver assignment";
  return (
    <main className="h-full overflow-y-auto bg-[#f5f6f8] px-5 pb-safe pt-safe text-[#17283e]">
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2">
        <Link to={role === "driver" ? "/driver" : "/"} className="min-h-11 content-center font-semibold underline underline-offset-4">CareNear</Link>
        <span className="text-sm font-medium text-[#526277]">Private workspace</span>
      </header>
      <h1 className="mt-4 text-[30px] font-bold leading-tight tracking-tight">{title}</h1>
      {disconnected && <p role="status" className="mt-4 rounded-xl bg-[#ffefcf] p-3">Connection interrupted. Showing the last confirmed status.</p>}
      {error && <p role="alert" className="mt-4 text-base font-semibold text-[#942437]">{error}</p>}
      {citizen && !request && (!key || loaded) && <section className="mt-5">
        <p className="mb-3 text-base">Confirm the Windhoek pickup point or tap the map to move it.</p>
        <div className="h-52 overflow-hidden rounded-2xl bg-[#dbe2e9]">
          <LazyMap mode="locate" center={pickup} pickEnabled onPick={setPickup}
            label="Pickup location map" className="h-full w-full" />
        </div>
        <p className="my-4 text-sm text-[#526277]">This workspace coordinates a test unit. For a real emergency, call emergency services directly.</p>
        <button className={button + " w-full bg-[#b91e34]"} disabled={pending || disconnected}
          onClick={() => { void send("request"); }}>Send ambulance request</button>
      </section>}
      {citizen && request && <section className="mt-5">
        <p role="status" className="text-xl font-bold">{statusText[request.status]}</p>
        <p className="mb-4 mt-2 text-sm text-[#526277]">Request {request.id.slice(0, 8).toUpperCase()}</p>
        <RequestTimes request={request} />
        {request.status === "arrived" && <button className={button + " mt-4"} onClick={() => {
          sessionStorage.removeItem("carenear-request");
          setKey(null);
          setRequests([]);
          setLoaded(false);
          setError("");
        }}>Start a new request</button>}
      </section>}
      {control && loaded && <section className="mt-5">
        <p className="mb-3 flex items-center gap-2 font-semibold"><Ambulance className="size-5" /> Unit 01 · {unitBusy ? "On assignment" : "Available"}</p>
        {requests.length === 0 && <p className="text-[#526277]">New ambulance requests will appear here.</p>}
        <ul className="divide-y divide-[#d7dee7] rounded-2xl bg-white px-4">
          {requests.map((item) => <li key={item.id} className="py-4">
            <p className="text-sm text-[#526277]">Request {item.id.slice(0, 8).toUpperCase()} · {timeLabel.format(item.requested_at)}</p>
            <p className="mt-1 font-bold">{item.status === "requested" ? "New ambulance request" : statusText[item.status]}</p>
            <p className="mt-1 text-sm tabular-nums">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p>
            {item.status === "requested" && <button className={button + " mt-3 w-full"}
              disabled={unitBusy || pending || disconnected} onClick={() => { void send("assign", item.id); }}>Assign Unit 01</button>}
          </li>)}
        </ul>
      </section>}
      {role === "driver" && loaded && (!request ? <p className="mt-5 text-[#526277]">Waiting for an assignment from the control center.</p> :
        <section className="mt-5">
          <p role="status" className="text-xl font-bold">{request.status === "assigned" ? "New pickup assignment" : statusText[request.status]}</p>
          <p className="mb-3 mt-1 flex items-center gap-2 text-sm"><MapPin className="size-4" />
            {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}</p>
          <div className="h-60 overflow-hidden rounded-2xl bg-[#dbe2e9]">
            <LazyMap key={request.id} mode="driver" center={[request.latitude, request.longitude]} from={DRIVER_PREVIEW_BASE}
              label="Route to the pickup location" className="h-full w-full" />
          </div>
          <button className={button + " mt-4 w-full"} disabled={pending || disconnected || request.status === "arrived"}
            onClick={() => { void send(request.status === "assigned" ? "depart" : "arrive", request.id); }}>
            {request.status === "assigned" ? "Start route to pickup" : request.status === "arrived" ? "Arrival confirmed" : "Confirm arrival"}
          </button>
          {request.status === "en_route" && <a className="mt-2 flex min-h-11 items-center justify-center font-semibold underline"
            href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(request.latitude + "," + request.longitude)}
            target="_blank" rel="noreferrer">Open directions</a>}
        </section>)}
      {!loaded && (!citizen || key) && <p role="status" className="mt-5">Checking for requests…</p>}
    </main>
  );
}

function RequestTimes({ request }: { request: AmbulanceRequest }) {
  const milestones = [
    ["Requested", request.requested_at],
    ["Assigned", request.assigned_at],
    ["En route", request.departed_at],
    ["Arrived", request.arrived_at],
  ] as const;
  return <dl className="divide-y divide-[#d7dee7] rounded-xl bg-white px-4">
    {milestones.map(([label, at]) => at !== null && <div key={label} className="flex justify-between gap-2 py-3">
      <dt>{label}</dt><dd>{timeLabel.format(at)}</dd>
    </div>)}
  </dl>;
}
