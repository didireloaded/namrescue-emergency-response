import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LazyMap } from "@/components/nr/LazyMap";
import { driver, DRIVER_PREVIEW_BASE, SAMPLE_DISPATCH, useDriver } from "@/lib/driver-store";

type Role = "citizen" | "driver";
type Stage = "setup" | "waiting" | "offered" | "accepted" | "enRoute" | "atScene" |
  "transporting" | "atHospital" | "completed" | "declined" | "expired";
interface Drill {
  id: string;
  code: string | null;
  paired: boolean;
  status: Stage;
  version: number;
  events: { status: Stage; at: number }[];
}

const statusLabels: Record<Stage, string> = {
  setup: "Ready to request",
  waiting: "Waiting for training assignment",
  offered: "Waiting for driver acceptance",
  accepted: "Training crew assigned",
  enRoute: "Training crew en route",
  atScene: "Training crew arrived",
  transporting: "Training transport in progress",
  atHospital: "Training crew at the destination",
  completed: "Training exercise completed",
  declined: "Training offer declined",
  expired: "Training offer expired",
};

const driverActions: Partial<Record<Stage, { action: string; label: string }>> = {
  offered: { action: "accept", label: "Accept training offer" },
  accepted: { action: "depart", label: "Start route to pickup" },
  enRoute: { action: "arrive", label: "Confirm training scene arrival" },
  atScene: { action: "transport", label: "Begin training transport" },
  transporting: { action: "hospital", label: "Confirm training destination arrival" },
  atHospital: { action: "complete", label: "Complete training handover" },
};

const primary = "min-h-12 w-full rounded-2xl bg-[#17283e] px-4 py-3 text-base font-semibold text-white disabled:opacity-50";

export const Route = createFileRoute("/drill")({
  validateSearch: (search: Record<string, unknown>): { role: Role } => ({
    role: search["role"] === "driver" ? "driver" : "citizen",
  }),
  head: () => ({ meta: [{ title: "Shared training drill | CareNear" }] }),
  component: DrillRoute,
});

function DrillRoute() {
  const { role } = Route.useSearch();
  return <DrillScreen key={role} role={role} />;
}

function DrillScreen({ role }: { role: Role }) {
  const isDriver = role === "driver";
  const storageKey = "carenear-drill-" + role;
  const [key, setKey] = useState<string | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const autoOfferVersion = useRef(-1);
  const state = useDriver();
  const ready = (state.stage === "available" || state.stage === "completed") && driver.readyToWork();

  useEffect(() => {
    setKey(sessionStorage.getItem(storageKey));
  }, [storageKey]);

  const update = useCallback((next: Drill) => {
    setDrill((current) => current?.id === next.id && current.version > next.version ? current : next);
    setReconnecting(false);
  }, []);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch("/api/training", {
          headers: { Authorization: "Bearer " + key },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.ok) update(await response.json() as Drill);
        else if (response.status !== 404) setReconnecting(true);
        else if (!inFlight.current) {
          setDrill(null);
          setReconnecting(false);
        }
      } catch {
        if (!controller.signal.aborted) setReconnecting(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => { void poll(); }, 2000);
      }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [key, update]);

  const command = useCallback(async (action: string, payload: { code?: string; ready?: boolean; version?: number } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const token = key ?? Array.from(crypto.getRandomValues(new Uint8Array(32)),
        (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (!key) {
        sessionStorage.setItem(storageKey, token);
        setKey(token);
      }
      const response = await fetch("/api/training", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = await response.json() as Drill | { error: string };
      if ("error" in result) setError(result.error);
      else if (response.ok) update(result);
      else setError("CareNear could not confirm that change. Try again.");
    } catch {
      setError("CareNear could not confirm that change. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [key, storageKey, update]);

  const stage = drill?.status;
  const version = drill?.version;
  useEffect(() => {
    if (!isDriver || !ready || busy || reconnecting || stage !== "waiting" ||
      version === undefined || autoOfferVersion.current === version) return;
    autoOfferVersion.current = version;
    void command("offer", { ready, version });
  }, [isDriver, ready, busy, reconnecting, stage, version, command]);

  function forget() {
    sessionStorage.removeItem(storageKey);
    autoOfferVersion.current = -1;
    setKey(null);
    setDrill(null);
    setReconnecting(false);
    setError("");
  }

  function act(action: string) {
    if (drill) void command(action, { version: drill.version, ready });
  }

  const next = stage ? driverActions[stage] : undefined;
  const routeVisible = stage && ["accepted", "enRoute", "atScene", "transporting", "atHospital"].includes(stage);
  const destination = stage === "transporting" || stage === "atHospital"
    ? SAMPLE_DISPATCH.hospitalPoint : SAMPLE_DISPATCH.locationPoint;

  return (
    <main className="h-full overflow-y-auto bg-[#f5f6f8] px-5 pb-safe pt-safe text-[#17283e]">
      <header className="flex min-h-12 items-center justify-between py-2">
        <Link to={isDriver ? "/driver" : "/"} className="flex min-h-11 items-center font-semibold underline underline-offset-4">
          {isDriver ? "Driver app" : "Citizen app"}
        </Link>
        <span className="text-sm font-semibold text-[#8c301c]">Training only</span>
      </header>
      <h1 className="mt-4 text-[30px] font-bold leading-tight tracking-tight">Shared training drill</h1>
      <p className="mt-2 text-base text-[#47566a]">Practice a dispatch handoff together using a fictional Windhoek incident.</p>
      {reconnecting && <p role="status" className="mt-4 rounded-xl bg-[#ffefcf] p-3">Reconnecting. Showing the last confirmed status.</p>}
      {!drill && <section className="mt-6">
        {isDriver ? <form onSubmit={(event) => { event.preventDefault(); void command("join", { code }); }}>
          <label htmlFor="drill-code" className="block font-semibold">Pairing code from the Citizen app</label>
          <input id="drill-code" autoCapitalize="characters" autoComplete="off" spellCheck={false} required
            value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 12))}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#aab5c2] bg-white px-4 font-mono text-base" />
          <button className={primary + " mt-3"} disabled={busy || code.length !== 12}>Join training drill</button>
        </form> : <button className={primary} disabled={busy} onClick={() => { void command("create"); }}>Start shared drill</button>}
      </section>}
      {drill && <section className="mt-6">
        <p className="text-sm font-semibold text-[#526277]">Drill {drill.id.slice(0, 8).toUpperCase()}</p>
        <h2 role="status" className="mt-1 text-xl font-bold">
          {isDriver && stage === "offered" ? "Incoming training offer" : statusLabels[drill.status]}
        </h2>
        {drill.code && <div className="mt-3 rounded-2xl border border-[#cbd4de] bg-white p-4">
          <p className="text-sm text-[#47566a]">Enter this code in the Driver app’s Shared training drill. It is valid for 15 minutes.</p>
          <p className="mt-2 break-all font-mono text-xl font-bold tracking-wider">{drill.code}</p>
        </div>}
        {!isDriver && drill.paired && <p className="mt-2 text-sm text-[#47566a]">Training driver paired.</p>}
        {!isDriver && !drill.paired && !drill.code && <p className="mt-2 text-sm">The pairing code expired. Leave this drill and start a new one.</p>}
        {routeVisible && <div className="mt-4 h-48 overflow-hidden rounded-xl bg-[#dbe2e9]">
          <LazyMap key={destination.join(",")} mode="driver" center={destination} from={DRIVER_PREVIEW_BASE}
            className="h-full w-full" label="Fictional training route preview" />
        </div>}
        {!isDriver && stage === "setup" && <button className={primary + " mt-4"} disabled={busy || reconnecting} onClick={() => act("request")}>Submit practice SOS</button>}
        {!isDriver && (stage === "declined" || stage === "expired") && <button className={primary + " mt-4"} disabled={busy || reconnecting} onClick={() => act("retry")}>Request another training offer</button>}
        {isDriver && !ready && (stage === "setup" || stage === "waiting" || stage === "offered") &&
          <p className="mt-3 text-base"><Link className="font-semibold underline" to="/driver">Complete vehicle checks and start a training shift</Link> to receive or accept an offer.</p>}
        {isDriver && ready && stage === "waiting" && error && <button className={primary + " mt-4"} disabled={busy || reconnecting} onClick={() => act("offer")}>Retry training offer</button>}
        {isDriver && next && <button className={primary + " mt-4"} disabled={busy || reconnecting ||
          (stage === "offered" && !ready) ||
          ((stage === "accepted" || stage === "atScene") && Boolean(state.outOfServiceReason))}
          onClick={() => act(next.action)}>{next.label}</button>}
        {isDriver && stage === "offered" && <button className="mt-2 min-h-11 w-full font-semibold text-[#8c301c]" disabled={busy || reconnecting} onClick={() => act("decline")}>Decline training offer</button>}
        {drill.events.length > 0 && <div className="mt-6">
          <h2 className="font-bold">Drill history</h2>
          <ol className="mt-2 divide-y divide-[#d9e0e8] rounded-xl bg-white px-3">
            {drill.events.map((event, index) => <li key={index} className="flex flex-wrap justify-between gap-1 py-3 text-sm">
              <span>{statusLabels[event.status]}</span>
              <time dateTime={new Date(event.at).toISOString()}>{new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            </li>)}
          </ol>
        </div>}
        <button className="mt-4 min-h-11 text-sm font-semibold underline" disabled={busy} onClick={forget}>Leave this drill on this device</button>
      </section>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#8c301c]">{error}</p>}
    </main>
  );
}
