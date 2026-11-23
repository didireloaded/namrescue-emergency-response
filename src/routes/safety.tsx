import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Clock3, Copy, MapPin, MessageSquareText,
  Navigation, Phone, ShieldCheck, Square, UsersRound,
} from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { useCitizen } from "@/lib/citizen-store";
import {
  appendTrail, composeLocationText, smsComposeUri,
  validSafetyLocation, type SafetyLocation,
} from "@/lib/safety-share";

export const Route = createFileRoute("/safety")({
  head: () => ({ meta: [
    { title: "Safety tools | NamRescue" },
    { name: "description", content: "User-controlled location check-in and trusted contact messaging." },
  ] }),
  component: SafetyTools,
});

const button = "flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[14px] font-semibold";
const info = "text-[13px] leading-relaxed text-[#63728B]";
type Tracking = "idle" | "active" | "paused" | "unavailable";

function SafetyTools() {
  const { contacts } = useCitizen();
  const [tracking, setTracking] = useState<Tracking>("idle");
  const [last, setLast] = useState<SafetyLocation | null>(null);
  const [trail, setTrail] = useState<SafetyLocation[]>([]);
  const [contactId, setContactId] = useState("");
  const [notice, setNotice] = useState("");
  const watch = useRef<number | null>(null);

  useEffect(() => {
    const hide = () => {
      if (document.hidden && watch.current !== null) {
        navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
        setTracking("paused");
        setNotice("Location tracking paused when this screen went into the background.");
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      if (watch.current !== null && "geolocation" in navigator) navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    };
  }, []);

  const start = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setTracking("unavailable");
      setNotice("Your device does not provide browser location access.");
      return;
    }
    if (watch.current !== null) return;
    setNotice("");
    setLast(null);
    setTrail([]);
    setTracking("active");
    watch.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: SafetyLocation = {
          pos: [position.coords.latitude, position.coords.longitude],
          accuracy: position.coords.accuracy,
          observedAt: position.timestamp,
        };
        setLast(point);
        setTrail((previous) => appendTrail(previous, point));
        setNotice("");
      },
      (error) => {
        if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
        setTracking("unavailable");
        setNotice(error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Enable it in your device settings to use this feature."
          : "Your location could not be determined. Try again with location services enabled.");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  };

  const stop = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setTracking("paused");
  };

  const latestText = last ? composeLocationText(last, Date.now()) : null;
  const selected = contacts.find((person) => person.id === contactId);
  const smsLink = selected && latestText ? smsComposeUri(selected.phone, latestText) : null;
  const canShare = validSafetyLocation(last, Date.now());

  const copy = async () => {
    if (!latestText) return;
    try {
      await navigator.clipboard.writeText(latestText);
      setNotice("Location message copied. No message has been sent.");
    } catch {
      setNotice("Clipboard unavailable. Use the SMS button on a supported phone.");
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#F7F9FC] text-[#172437]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <header className="bg-[#162235] px-6 pb-8 pt-safe text-white">
          <Link to="/profile" className="mt-3 flex min-h-11 items-center gap-2 text-[14px] font-semibold text-white/85">
            <ArrowLeft className="size-4" /> Profile
          </Link>
          <div className="mt-6 grid size-13 place-items-center rounded-[17px] bg-white/10">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-5 text-[32px] font-bold tracking-tight">Safety tools</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-white/75">
            Check your location and choose whether to send it to someone you trust.
          </p>
        </header>

        <main className="-mt-4 space-y-5 rounded-t-[28px] bg-[#F7F9FC] px-5 pb-8 pt-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold">My location</h2>
                <p className={info}>Only while this screen is open.</p>
              </div>
              <span className={"rounded-full px-3 py-1.5 text-[12px] font-semibold " +
                (tracking === "active" ? "bg-[#E7F4EC] text-[#196B49]" : "bg-[#E9EEF4] text-[#596A81]")}>
                {tracking === "active" ? "Location active" : tracking === "paused" ? "Paused" : "Not tracking"}
              </span>
            </div>

            {last ? <div className="relative isolate h-[216px] overflow-hidden rounded-[22px] bg-[#172434]">
              <LazyMap
                mode="locate"
                center={last.pos}
                accuracy={last.accuracy ?? undefined}
                trail={trail.map(point => point.pos)}
                pickEnabled={false}
                className="absolute inset-0"
                label="Your foreground-only recorded location trail"
              />
            </div> :
              <div className="flex h-[174px] flex-col items-center justify-center rounded-[22px] bg-[#E7EDF4] text-[#61738C]">
                <MapPin className="size-8" />
                <p className="mt-2 text-[13px]">Location not yet collected</p>
              </div>
            }

            {last && <div className="rounded-2xl bg-white p-4">
              <p className="text-[13px] font-semibold">Last known position</p>
              <p className="mt-1 text-[13px] text-[#576B84]">
                {last.pos[0].toFixed(5)}, {last.pos[1].toFixed(5)}
              </p>
              <p className="mt-1 text-[12px] text-[#77869A]">
                {new Date(last.observedAt).toLocaleTimeString()}
                {last.accuracy !== null ? " · Accuracy ±" + Math.round(last.accuracy) + " m" : ""}
                {" · " + trail.length + " samples in this session"}
              </p>
              {!canShare && <p role="alert" className="mt-2 text-[12px] font-semibold text-[#B93242]">Location is older than five minutes. Restart location before sharing.</p>}
            </div>}

            {tracking === "active" ?
              <button className={button + " bg-[#E8EEF5] text-[#233953]"} onClick={stop}>
                <Square className="size-4" /> Stop location tracking
              </button> :
              <button className={button + " bg-[#162235] text-white"} onClick={start}>
                <Navigation className="size-5" /> {tracking === "paused" ? "Restart location" : "Get my location"}
              </button>
            }
            <p className={info}>GPS samples stay in this screen's memory. They are not continuously shared, uploaded, or recorded after you leave this page.</p>
          </section>

          <section className="space-y-3 rounded-[22px] bg-white p-4">
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-[#2E506E]" />
              <h2 className="text-[17px] font-bold">Message a trusted contact</h2>
            </div>
            {contacts.length > 0 ? <>
              <label htmlFor="safety-contact" className="block text-[13px] font-semibold text-[#485970]">Choose a contact</label>
              <select id="safety-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} className="min-h-12 w-full rounded-2xl border border-[#DCE3EB] bg-white px-3 text-[14px]">
                <option value="">Select someone</option>
                {contacts.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
              </select>
              <a
                href={smsLink ?? undefined}
                aria-disabled={!smsLink}
                onClick={(e) => { if (!smsLink) e.preventDefault(); }}
                className={button + " " + (smsLink ? "bg-[#162235] text-white" : "pointer-events-none bg-[#DDE3EB] text-[#69788A]")}>
                <MessageSquareText className="size-5" /> Open SMS composer
              </a>
              <button disabled={!latestText} className={button + " border border-[#E0E6EC] bg-white text-[#2B4E73] disabled:opacity-50"} onClick={copy}>
                <Copy className="size-4" /> Copy location message
              </button>
              <p className={info}>Your phone opens a draft SMS. You must review and send it yourself. Sending and delivery are not verified by NamRescue.</p>
            </> : <>
              <p className={info}>Add a trusted contact in your profile before composing a location message.</p>
              <Link to="/profile" className={button + " bg-[#162235] text-white"}>Manage emergency contacts</Link>
            </>}
          </section>

          {notice && <p role="status" className="rounded-2xl bg-[#E8EDF3] px-4 py-3 text-[13px] text-[#36506A]">{notice}</p>}

          <div className="space-y-3 rounded-[22px] bg-[#EEF2F7] p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="size-5 text-[#40556F]" />
              <h2 className="text-[15px] font-bold">Background safety monitoring</h2>
            </div>
            <p className={info}>
              Automatic missed check-in alerts, safe-arrival timers, silent SOS, and continuous family tracking are not connected yet. They require a native mobile app and monitored alert delivery.
            </p>
          </div>

          <div className="rounded-[22px] border border-[#E7CBD0] bg-[#FFF4F5] p-4 text-[13px] leading-relaxed text-[#8D3341]">
            <strong>Emergency help.</strong> This tool does not send requests to emergency services. In a real emergency, use the verified phone numbers in the Call directory.
            <Link to="/" className="mt-3 flex min-h-11 items-center gap-2 font-semibold text-[#AE2836]">
              <Phone className="size-5" /> Go to emergency calling
            </Link>
          </div>
        </main>
      </div>
      <BottomNav active="/profile" />
    </div>
  );
}
