/**
 * Central map-provider boundary.
 *
 * Leaflet + OpenStreetMap tiles are used in the current UI. Replace these
 * functions with authenticated Mapbox services later without changing
 * request, tracking or search screens.
 *
 * Public Nominatim/OSRM endpoints are development fallbacks, NOT a scalable
 * emergency production dependency. Replace with contracted services and
 * a server-side proxy, quotas, caching and operational monitoring.
 */
export type Coordinates = [latitude: number, longitude: number];
export interface Place {
  display_name: string;
  lat: string;
  lon: string;
}
export interface ReversePlace {
  address?: { suburb?: string; city?: string; town?: string; village?: string; county?: string; country?: string };
}
export const MAP_CONFIG = {
  renderer: "leaflet" as const,
  futureRenderer: "mapbox",
  countryCode: "na",
};
const searchCache = new Map<string, Place[]>();
export async function searchNamibia(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const key = q.toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&countrycodes=na&limit=5&q=" + encodeURIComponent(q));
  if (!r.ok) throw new Error("Location search temporarily unavailable");
  const json: unknown = await r.json();
  const places = Array.isArray(json) ? json.filter((p) =>
    typeof p?.display_name === "string" && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)),
  ).slice(0, 5) as Place[] : [];
  if (searchCache.size > 20) searchCache.clear();
  searchCache.set(key, places);
  return places;
}
export async function reverseLocation(position: Coordinates): Promise<string | null> {
  const r = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&lat=" + position[0] + "&lon=" + position[1]);
  if (!r.ok) return null;
  const json = await r.json() as ReversePlace;
  const a = json.address ?? {};
  return [a.suburb || a.city || a.town || a.village || a.county, a.country].filter(Boolean).join(", ") || null;
}
export async function roadRoute(from: Coordinates, to: Coordinates): Promise<Coordinates[] | null> {
  const url = "https://router.project-osrm.org/route/v1/driving/" + from[1] + "," + from[0] + ";" + to[1] + "," + to[0] + "?overview=full&geometries=geojson";
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json() as { routes?: { geometry?: { coordinates?: number[][] } }[] };
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return coords.filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])).map((p) => [p[1] as number, p[0] as number]);
}
