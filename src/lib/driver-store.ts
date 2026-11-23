import { useSyncExternalStore } from "react";
import type { LatLng } from "./demo-sim";

/** DRIVER PREVIEW ONLY. Never represents official assignment, fleet telemetry, or patient data. */
export type DriverStage =
  | "offDuty" | "available" | "offered" | "accepted" | "enRoute"
  | "atScene" | "transporting" | "atHospital" | "completed";
export type InspectionKey = "tyres" | "fuel" | "lights" | "radio" | "cleanliness";
export interface DriverAssignment {
  id: string;
  category: "Medical emergency" | "Road accident";
  priority: "Urgent";
  location: string;
  locationPoint: LatLng;
  hospital: string;
  hospitalPoint: LatLng;
  note: string;
}
export interface DriverTripRecord {
  id: string;
  completedAt: number;
  area: string;
  destination: string;
}
export interface DriverState {
  stage: DriverStage;
  unitId: string;
  serviceArea: string;
  inspection: Record<InspectionKey, boolean>;
  assignment: DriverAssignment | null;
  events: { stage: DriverStage; time: number }[];
  history: DriverTripRecord[];
}
export const VEHICLE_ITEMS: readonly { id: InspectionKey; label: string; detail: string }[] = [
  { id: "tyres", label: "Tyres and wheels", detail: "Visual condition and pressure" },
  { id: "fuel", label: "Fuel and fluids", detail: "Sufficient for dispatch" },
  { id: "lights", label: "Vehicle lights", detail: "Headlights, indicators and hazard lights" },
  { id: "radio", label: "Radio and communication", detail: "Check dispatch radio connectivity" },
  { id: "cleanliness", label: "Vehicle readiness", detail: "Cabin and external checks" },
];
const emptyInspection = (): DriverState["inspection"] => ({
  tyres: false, fuel: false, lights: false, radio: false, cleanliness: false,
});
export const SAMPLE_DISPATCH: DriverAssignment = {
  id: "CN-TRAIN-001",
  category: "Road accident",
  priority: "Urgent",
  location: "Windhoek · example incident",
  locationPoint: [-22.5609, 17.0658],
  hospital: "Example hospital destination",
  hospitalPoint: [-22.573, 17.074],
  note: "Training scenario only. No person, patient or dispatcher is connected.",
};
export const DRIVER_PREVIEW_BASE: LatLng = [-22.574, 17.079];
const initial: DriverState = {
  stage: "offDuty",
  unitId: "CN-TRAIN-01",
  serviceArea: "Windhoek · training area",
  inspection: emptyInspection(),
  assignment: null,
  events: [],
  history: [],
};
let state: DriverState = initial;
const subscribers = new Set<() => void>();
function emit(next: DriverState) { state = next; subscribers.forEach(f => f()); }
const set = (patch: Partial<DriverState>) => emit({ ...state, ...patch });
function nextStage(stage: DriverStage) {
  set({ stage, events: [...state.events, { stage, time: Date.now() }] });
  return true;
}
export const driver = {
  get: () => state,
  checklist: (key: InspectionKey, done: boolean) => {
    if (state.stage !== "offDuty" && state.stage !== "available") return false;
    set({ inspection: { ...state.inspection, [key]: done } });
    return true;
  },
  allChecksComplete: () => Object.values(state.inspection).every(Boolean),
  startShift: () => {
    if (state.stage !== "offDuty" || !driver.allChecksComplete()) return false;
    return nextStage("available");
  },
  endShift: () => {
    if (state.stage !== "available" && state.stage !== "completed") return false;
    set({ stage: "offDuty", assignment: null, events: [], inspection: emptyInspection() });
    return true;
  },
  simulateOffer: () => {
    if (state.stage !== "available") return false;
    set({ assignment: { ...SAMPLE_DISPATCH }, stage: "offered", events: [{ stage: "offered", time: Date.now() }] });
    return true;
  },
  decline: () => {
    if (state.stage !== "offered") return false;
    set({ stage: "available", assignment: null, events: [] });
    return true;
  },
  accept: () => state.stage === "offered" && nextStage("accepted"),
  depart: () => state.stage === "accepted" && nextStage("enRoute"),
  sceneArrival: () => state.stage === "enRoute" && nextStage("atScene"),
  beginTransport: () => state.stage === "atScene" && nextStage("transporting"),
  hospitalArrival: () => state.stage === "transporting" && nextStage("atHospital"),
  closeTrip: () => {
    if (state.stage !== "atHospital" || !state.assignment) return false;
    const caseFile = state.assignment;
    set({
      stage: "completed",
      events: [...state.events, { stage: "completed", time: Date.now() }],
      history: [{ id: caseFile.id, completedAt: Date.now(), area: caseFile.location, destination: caseFile.hospital }, ...state.history],
    });
    return true;
  },
  readyForNext: () => {
    if (state.stage !== "completed") return false;
    set({ stage: "available", assignment: null, events: [] });
    return true;
  },
  resetPreview: () => { emit({ ...initial, inspection: emptyInspection(), events: [], history: [] }); },
};
export function useDriver(): DriverState {
  return useSyncExternalStore(
    (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    () => state, () => initial,
  );
}
export function stageLabel(stage: DriverStage) {
  const names: Record<DriverStage, string> = {
    offDuty: "Off duty", available: "Available", offered: "New dispatch", accepted: "Assignment accepted",
    enRoute: "En route", atScene: "At scene", transporting: "Transporting", atHospital: "At hospital", completed: "Trip completed",
  };
  return names[stage];
}
