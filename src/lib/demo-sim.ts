// Pure helpers for the simulated flow. No real dispatch, GPS or crew data.
export const DEMO_TRIP_SECONDS = 90;
export const DEMO_START_ETA_MIN = 7;

/** Verified emergency number for production. Null in this prototype: calling stays disabled. */
export const VERIFIED_EMERGENCY_NUMBER: string | null = null;

export function canDial(n: string | null = VERIFIED_EMERGENCY_NUMBER): n is string {
  return typeof n === "string" && n.trim().length > 0;
}

export function tripProgress(startedAt: number | null, now: number): number {
  if (startedAt == null) return 0;
  return Math.min(1, Math.max(0, (now - startedAt) / (DEMO_TRIP_SECONDS * 1000)));
}

export function etaMinutes(progress: number): number {
  return Math.max(0, Math.ceil(DEMO_START_ETA_MIN * (1 - progress)));
}

export type LatLng = [number, number];

/** Point along a polyline at fraction t (0..1) by distance. */
export function pointAlong(path: LatLng[], t: number): LatLng {
  if (path.length === 0) return [0, 0];
  const first = path[0] as LatLng;
  if (path.length === 1 || t <= 0) return first;
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as LatLng, b = path[i] as LatLng;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push(d); total += d;
  }
  let target = Math.min(1, t) * total;
  for (let i = 0; i < segs.length; i++) {
    const d = segs[i] as number;
    if (target <= d || i === segs.length - 1) {
      const a = path[i] as LatLng, b = path[i + 1] as LatLng;
      const f = d === 0 ? 0 : Math.min(1, target / d);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    target -= d;
  }
  return path[path.length - 1] as LatLng;
}
