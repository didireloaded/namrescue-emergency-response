import { useCallback, useState } from "react";
import { demo } from "./demo-store";

export type GeoState = "idle" | "locating" | "ok" | "denied" | "unavailable";

export function useGeolocate() {
  const [state, setState] = useState<GeoState>("idle");
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setState("unavailable"); return; }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
        demo.setLocation({ pos, label: "Current location", source: "gps", accuracy: p.coords.accuracy, observedAt: p.timestamp });
        setState("ok");
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&lat=${pos[0]}&lon=${pos[1]}`);
          const j = await r.json();
          const a = j?.address ?? {};
          const place = a.suburb || a.city || a.town || a.village || a.county;
          const label = [place, a.country].filter(Boolean).join(", ");
          if (label) demo.setLocation({ pos, label, source: "gps", accuracy: p.coords.accuracy, observedAt: p.timestamp });
        } catch { /* keep generic label */ }
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);
  return { state, locate };
}
