import type { DemoState } from "./demo-store";
import { isConfiguredArea, type HomeArea } from "./regions";

/**
 * A request contract for a future authorised national dispatch gateway.
 * This creates data only. It never sends a network request or assigns a crew.
 */
export interface DispatchRequestDraft {
  incidentLocation: {
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    observedAt: number | null;
    source: "gps" | "manual";
  };
  emergencyAreaHint: HomeArea | null;
  incidentType: DemoState["incidentType"];
  helpingSomeoneElse: boolean;
  description: string | null;
  ambulanceAssignment: "requires_authorised_dispatch";
}
export type DraftResult =
  | { ok: true; value: DispatchRequestDraft }
  | { ok: false; reason: "location_unconfirmed" | "coordinates_invalid" };
export function prepareDispatchDraft(incident: DemoState): DraftResult {
  const location = incident.location;
  if (location.source === "default") return { ok: false, reason: "location_unconfirmed" };
  const [latitude, longitude] = location.pos;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { ok: false, reason: "coordinates_invalid" };
  }
  return {
    ok: true,
    value: {
      incidentLocation: {
        latitude,
        longitude,
        accuracyMeters: location.accuracy ?? null,
        observedAt: location.observedAt ?? null,
        source: location.source,
      },
      emergencyAreaHint: isConfiguredArea(incident.incidentArea) ? incident.incidentArea : null,
      incidentType: incident.incidentType,
      helpingSomeoneElse: incident.forOther,
      description: incident.note.trim() || null,
      ambulanceAssignment: "requires_authorised_dispatch",
    },
  };
}
