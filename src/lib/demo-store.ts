import { useSyncExternalStore } from "react";
import type { LatLng } from "./demo-sim";

/** No emergency request is transmitted by this store. It models the UI flow only. */
export type RequestStatus = "idle" | "received" | "assigned" | "arrived";
export type LocationSource = "gps" | "manual" | "default";
export type EmergencyType = "Medical emergency" | "Road accident" | "Injury" | "Other";
export interface DemoLocation {
  pos: LatLng;
  label: string;
  source: LocationSource;
  accuracy?: number;
  observedAt?: number;
}
export interface HistoryEntry {
  id: string;
  at: number;
  label: string;
  forOther: boolean;
  type?: EmergencyType;
}
export interface DemoState {
  status: RequestStatus;
  location: DemoLocation;
  forOther: boolean;
  recipientId: string | null;
  incidentType: EmergencyType;
  note: string;
  reference: string | null;
  requestedAt: number | null;
  assignedAt: number | null;
  arrivedAt: number | null;
  history: HistoryEntry[];
}
export const WINDHOEK: LatLng = [-22.5609, 17.0658];
const initial: DemoState = {
  status: "idle",
  location: { pos: WINDHOEK, label: "Windhoek, Namibia", source: "default" },
  forOther: false,
  recipientId: null,
  incidentType: "Medical emergency",
  note: "",
  reference: null,
  requestedAt: null,
  assignedAt: null,
  arrivedAt: null,
  history: [],
};
let state: DemoState = initial;
const listeners = new Set<() => void>();
function set(patch: Partial<DemoState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}
export const isActive = (status: RequestStatus) => status === "received" || status === "assigned";
export const canSubmit = (status: RequestStatus, source: LocationSource) =>
  !isActive(status) && source !== "default";

/**
 * Deliberately session-only. A production incident service must be authoritative,
 * authenticated and connected to an approved dispatch centre.
 */
export const demo = {
  get: () => state,
  setLocation: (location: DemoLocation) => { if (isActive(state.status)) return false; set({ location }); return true; },
  setDetails: (patch: Partial<Pick<DemoState, "incidentType" | "note" | "recipientId" | "forOther">>) =>
    set(patch),
  start: (forOther = false) => {
    if (isActive(state.status)) return false;
    set({
      status: "idle",
      forOther,
      recipientId: null,
      incidentType: "Medical emergency",
      note: "",
      reference: null,
      requestedAt: null,
      assignedAt: null,
      arrivedAt: null,
    });
    return true;
  },
  confirm: () => {
    if (!canSubmit(state.status, state.location.source)) return false;
    const at = Date.now();
    set({ status: "received", reference: "NR-" + at.toString(36).toUpperCase(), requestedAt: at });
    return true;
  },
  assign: () => {
    if (state.status !== "received") return false;
    set({ status: "assigned", assignedAt: Date.now() });
    return true;
  },
  arrive: () => {
    if (state.status !== "assigned") return false;
    const at = Date.now();
    set({
      status: "arrived",
      arrivedAt: at,
      history: [{ id: state.reference ?? String(at), at, label: state.location.label, forOther: state.forOther, type: state.incidentType }, ...state.history],
    });
    return true;
  },
  cancel: () => {
    if (state.status !== "received") return false;
    set({ status: "idle", reference: null, requestedAt: null, assignedAt: null, arrivedAt: null });
    return true;
  },
};
export function useDemo(): DemoState {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => initial,
  );
}
