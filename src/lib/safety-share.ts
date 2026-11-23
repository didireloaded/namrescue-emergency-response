/**
 * User-controlled safety message composition, NOT dispatch or SMS delivery.
 * No alert is ever sent by this module.
 */
import type { LatLng } from "./demo-sim";

export interface SafetyLocation {
  pos: LatLng;
  accuracy: number | null;
  observedAt: number;
}

export const MAX_LOCATION_AGE_MS = 5 * 60 * 1000;

export function validSafetyLocation(location: SafetyLocation | null, now: number): boolean {
  if (!location || !Number.isFinite(now) || !Number.isFinite(location.observedAt)) return false;
  const [lat, lon] = location.pos;
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
    location.observedAt <= now + 30_000 &&
    now - location.observedAt <= MAX_LOCATION_AGE_MS;
}

export function locationLink(position: LatLng): string {
  const [lat, lon] = position;
  return "https://www.openstreetmap.org/?mlat=" + lat.toFixed(6) +
    "&mlon=" + lon.toFixed(6) + "#map=16/" + lat.toFixed(6) + "/" + lon.toFixed(6);
}

export function composeLocationText(location: SafetyLocation, now: number): string | null {
  if (!validSafetyLocation(location, now)) return null;
  const time = new Date(location.observedAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const accuracy = typeof location.accuracy === "number" && Number.isFinite(location.accuracy)
    ? " (approx. accuracy " + Math.round(location.accuracy) + " m)" : "";
  return "Please check on me. My last known location was recorded at " + time + accuracy +
    ": " + locationLink(location.pos) +
    ". This is a personal message, not an emergency-service dispatch.";
}

export function smsComposeUri(rawPhone: string, message: string): string | null {
  const phone = rawPhone.replace(/[\s().-]/g, "");
  if (!/^\+?[0-9]{6,15}$/.test(phone) || !message.trim()) return null;
  return "sms:" + phone + "?body=" + encodeURIComponent(message);
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLon = (b[1] - a[1]) * rad;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}

/** Keep a small in-memory, session-only trail. Never persist it or upload it. */
export function appendTrail(
  previous: SafetyLocation[],
  next: SafetyLocation,
  maxCount = 100,
): SafetyLocation[] {
  const last = previous[previous.length - 1];
  if (last && next.observedAt <= last.observedAt) return previous;
  if (last && distanceMeters(last.pos, next.pos) < 8 && next.observedAt - last.observedAt < 15_000) {
    return previous;
  }
  return [...previous.slice(-(maxCount - 1)), next];
}
