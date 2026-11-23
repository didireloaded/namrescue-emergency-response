import { useSyncExternalStore } from "react";
import type { LatLng } from "./demo-sim";
import { EMPTY_AREA, type HomeArea } from "./regions";

/** No emergency request is transmitted by this store. It models the UI flow only. */
export type RequestStatus = "idle" | "received" | "assigned" | "arrived" | "completed";
export type LocationSource = "gps" | "manual" | "default";
export type EmergencyType = "Medical emergency" | "Road accident" | "Injury" | "Other";
export interface DemoLocation {
  pos: LatLng;
  label: string;
  source: LocationSource;
  accuracy?: number;
  observedAt?: number;
}
export interface PersonDetails {
  name: string;
  approximateAge: string;
  relationship: string;
  callbackNumber: string;
}
export interface AccidentDetails {
  injuredCount: string;
  vehicleCount: string;
  road: string;
  direction: string;
  danger: string;
  onScene: "yes" | "no" | "unsure";
}
export interface HistoryEntry {
  id: string;
  at: number;
  label: string;
  forOther: boolean;
  type?: EmergencyType;
  rating?: number;
  feedback?: string;
}
export interface DemoState {
  status: RequestStatus;
  location: DemoLocation;
  incidentArea: HomeArea;
  accident: AccidentDetails;
  person: PersonDetails;
  patientCondition: string;
  forOther: boolean;
  remoteIncident: boolean;
  recipientId: string | null;
  incidentType: EmergencyType;
  note: string;
  reference: string | null;
  requestedAt: number | null;
  assignedAt: number | null;
  arrivedAt: number | null;
  history: HistoryEntry[];
  rating: number;
  feedback: string;
}
export const WINDHOEK: LatLng = [-22.5609, 17.0658];
const initial: DemoState = {
  status: "idle",
  location: { pos: WINDHOEK, label: "Windhoek, Namibia", source: "default" },
  incidentArea: { ...EMPTY_AREA },
  accident: { injuredCount: "", vehicleCount: "", road: "", direction: "", danger: "", onScene: "unsure" },
  person: { name: "", approximateAge: "", relationship: "", callbackNumber: "" },
  patientCondition: "",
  forOther: false,
  remoteIncident: false,
  recipientId: null,
  incidentType: "Medical emergency",
  note: "",
  reference: null,
  requestedAt: null,
  assignedAt: null,
  arrivedAt: null,
  history: [],
  rating: 0,
  feedback: "",
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
  setLocation: (location: DemoLocation) => { if (isActive(state.status)) return false; set({ location, incidentArea: { ...EMPTY_AREA } }); return true; },
  setIncidentArea: (incidentArea: HomeArea) => { if (isActive(state.status)) return false; set({ incidentArea }); return true; },
  setAccidentDetails: (patch: Partial<AccidentDetails>) => set({ accident: { ...state.accident, ...patch } }),
  setPersonDetails: (patch: Partial<PersonDetails>) => set({ person: { ...state.person, ...patch } }),
  setPatientCondition: (patientCondition: string) => set({ patientCondition }),
  setRemoteIncident: (remoteIncident: boolean) => set({ remoteIncident }),
  setFeedback: (rating: number, feedback: string) => {
    if (state.status !== "completed" || !Number.isInteger(rating) || rating < 1 || rating > 5) return false;
    const safe = feedback.trim().slice(0, 500);
    set({ rating, feedback: safe, history: state.history.map(entry => entry.id === state.reference ? { ...entry, rating, feedback: safe } : entry) });
    return true;
  },
  setDetails: (patch: Partial<Pick<DemoState, "incidentType" | "note" | "recipientId" | "forOther">>) =>
    set(patch),
  start: (forOther = false, incidentType: EmergencyType = "Medical emergency") => {
    if (isActive(state.status)) return false;
    set({
      status: "idle",
      forOther,
      remoteIncident: false,
      recipientId: null,
      incidentType,
      note: "",
      incidentArea: { ...EMPTY_AREA },
      accident: { injuredCount: "", vehicleCount: "", road: "", direction: "", danger: "", onScene: "unsure" },
      person: { name: "", approximateAge: "", relationship: "", callbackNumber: "" },
      patientCondition: "",
      rating: 0,
      feedback: "",
      reference: null,
      requestedAt: null,
      assignedAt: null,
      arrivedAt: null,
    });
    return true;
  },
  confirm: () => {
    if (state.status !== "idle" || !canSubmit(state.status, state.location.source)) return false;
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
  complete: () => {
    if (state.status !== "arrived") return false;
    set({ status: "completed" });
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
