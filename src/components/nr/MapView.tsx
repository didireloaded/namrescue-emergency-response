import { useEffect, useRef } from "react";
import type { Map as LMap, Marker, Polyline, Circle } from "leaflet";
import { pointAlong, type LatLng } from "@/lib/demo-sim";

const AMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

export type MapMode = "locate" | "tracking";

interface Props {
  mode: MapMode;
  center: LatLng;
  /** tracking: ambulance start */
  from?: LatLng;
  progress?: number;
  accuracy?: number | undefined;
  onPick?: (pos: LatLng) => void;
  pickEnabled?: boolean;
  recenterKey?: number;
  className?: string;
  label: string;
}

export default function MapView({ mode, center, from, progress = 0, accuracy, onPick, pickEnabled, recenterKey = 0, className, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const userRef = useRef<Marker | null>(null);
  const accuracyRef = useRef<Circle | null>(null);
  const ambRef = useRef<Marker | null>(null);
  const routeRef = useRef<LatLng[]>([]);
  const lineRef = useRef<Polyline | null>(null);
  const pickRef = useRef({ onPick, pickEnabled });
  pickRef.current = { onPick, pickEnabled };
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    let cancelled = false;
    let map: LMap | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(center, mode === "locate" ? 15 : 14);
      mapRef.current = map;
      if (mode === "tracking") {
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
        }).addTo(map);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, opacity: 0.55 }).addTo(map);
        el.current.classList.add("nr-dark-tiles");
      } else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      }

      if (mode === "locate") {
        if (typeof accuracy === "number" && accuracy > 0) accuracyRef.current = L.circle(center, { radius: accuracy, color: "transparent", fillColor: "#237AD5", fillOpacity: 0.16 }).addTo(map);
        userRef.current = L.marker(center, { icon: L.divIcon({ className: "", html: '<div class="nr-user-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), keyboard: false }).addTo(map);
        map.on("click", (e) => {
          if (pickRef.current.pickEnabled && pickRef.current.onPick) pickRef.current.onPick([e.latlng.lat, e.latlng.lng]);
        });
      } else if (from) {
        L.marker(center, { icon: L.divIcon({ className: "", html: '<div class="nr-pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30] }), title: "Your location" }).addTo(map);
        let path: LatLng[] = [from, [(from[0] + center[0]) / 2, from[1]], center];
        try {
          const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${center[1]},${center[0]}?overview=full&geometries=geojson`);
          const j = await r.json();
          const coords: [number, number][] | undefined = j?.routes?.[0]?.geometry?.coordinates;
          if (coords && coords.length > 1) path = coords.map(([lng, lat]) => [lat, lng] as LatLng);
        } catch { /* keep fallback path */ }
        if (cancelled) return;
        routeRef.current = path;
        L.polyline(path, { color: "#0b1220", weight: 9, opacity: 0.55 }).addTo(map);
        lineRef.current = L.polyline(path, { color: "#ffffff", weight: 5, opacity: 0.95, lineCap: "round" }).addTo(map);
        ambRef.current = L.marker(pointAlong(path, progressRef.current), { icon: L.divIcon({ className: "", html: `<div class="nr-amb">${AMB_SVG}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] }), title: "Demo ambulance" }).addTo(map);
        map.fitBounds(L.latLngBounds(path), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 330] });
      }
    })();
    return () => { cancelled = true; map?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // move user marker / recenter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "locate") return;
    userRef.current?.setLatLng(center);
    accuracyRef.current?.setLatLng(center);
    if (typeof accuracy === "number" && accuracy > 0) {
      if (accuracyRef.current) accuracyRef.current.setRadius(accuracy);
      else import("leaflet").then(({ default: L }) => {
        if (!mapRef.current || accuracyRef.current) return;
        accuracyRef.current = L.circle(center, { radius: accuracy, color: "transparent", fillColor: "#237AD5", fillOpacity: 0.16 }).addTo(mapRef.current);
      });
    } else if (accuracyRef.current) {
      accuracyRef.current.remove();
      accuracyRef.current = null;
    }
    map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [center[0], center[1], recenterKey, mode, accuracy]);

  useEffect(() => {
    if (mode === "tracking" && ambRef.current && routeRef.current.length) ambRef.current.setLatLng(pointAlong(routeRef.current, progress));
  }, [progress, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (mode === "tracking" && map && recenterKey && routeRef.current.length) {
      import("leaflet").then(({ default: L }) => map.fitBounds(L.latLngBounds(routeRef.current), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 330] }));
    }
  }, [recenterKey, mode]);

  return <div ref={el} role="application" aria-label={label} className={className} />;
}
