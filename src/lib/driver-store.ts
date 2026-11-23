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
  /** Dispatch-only guidance in a fictional training call, not a clinical record. */
  cautionFlags: string[];
  approachInstructions: string;
  equipmentRequirements: string[];
  patientRequirements: string;
}
export type SupplyKey = "oxygen" | "gloves" | "dressings" | "stretcher";
export interface SupplyItem {
  label: string;
  count: number;
  minimum: number;
  expiry: string | null;
  critical: boolean;
}
export interface DriverMessage {
  id: string;
  at: number;
  from: "training-dispatch" | "driver";
  text: string;
  delivery: "local-only";
}
export interface DriverTripRecord {
  id: string;
  completedAt: number;
  area: string;
  destination: string;
  timeline: { stage: DriverStage; time: number }[];
}
export interface DriverState {
  stage: DriverStage;
  unitId: string;
  serviceArea: string;
  inspection: Record<InspectionKey, boolean>;
  assignment: DriverAssignment | null;
  events: { stage: DriverStage; time: number }[];
  history: DriverTripRecord[];
  outOfServiceReason: string | null;
  maintenanceDue: string | null;
  supplies: Record<SupplyKey, SupplyItem>;
  messages: DriverMessage[];
  handoverNote: string;
  fatigueBreakRequested: boolean;
  safetyCheckins: number[];
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
  cautionFlags: ["Traffic exposure near the scene", "Approach and parking guidance unverified"],
  approachInstructions: "Demonstration only: stop safely and await instructions from the authorised control room.",
  equipmentRequirements: ["High visibility clothing", "Stretcher access"],
  patientRequirements: "No patient record supplied. Medical assessment belongs to the qualified crew.",
};
export const DRIVER_PREVIEW_BASE: LatLng = [-22.574, 17.079];
const freshSupplies = (): DriverState["supplies"] => ({
  oxygen: { label: "Oxygen cylinder", count: 2, minimum: 1, expiry: null, critical: true },
  gloves: { label: "Disposable gloves (boxes)", count: 6, minimum: 2, expiry: null, critical: true },
  dressings: { label: "Sterile dressings (packs)", count: 8, minimum: 4, expiry: null, critical: true },
  stretcher: { label: "Patient stretcher", count: 1, minimum: 1, expiry: null, critical: true },
});
export const SUPPLY_KEYS: readonly SupplyKey[] = ["oxygen", "gloves", "dressings", "stretcher"];
export function dateOverdue(isoDate: string | null, now = new Date()): boolean {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const end = new Date(isoDate + "T23:59:59");
  return !Number.isNaN(end.getTime()) && end.getTime() < now.getTime();
}
export function supplyIssue(item: SupplyItem, today = new Date()): string | null {
  if (item.critical && item.count < item.minimum) return "Low stock";
  if (dateOverdue(item.expiry, today)) return "Expired";
  return null;
}
const initial: DriverState = {
  stage: "offDuty",
  unitId: "CN-TRAIN-01",
  serviceArea: "Windhoek · training area",
  inspection: emptyInspection(),
  assignment: null,
  events: [],
  history: [],
  outOfServiceReason: null,
  maintenanceDue: null,
  supplies: freshSupplies(),
  messages: [],
  handoverNote: "",
  fatigueBreakRequested: false,
  safetyCheckins: [],
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
  supplyIssues: () => SUPPLY_KEYS.filter(key => supplyIssue(state.supplies[key]) !== null),
  readyToWork: () => driver.allChecksComplete() && !state.outOfServiceReason && !dateOverdue(state.maintenanceDue) &&
    !state.fatigueBreakRequested && driver.supplyIssues().length === 0,
  startShift: () => {
    if (state.stage !== "offDuty" || !driver.readyToWork()) return false;
    return nextStage("available");
  },
  endShift: () => {
    if (state.stage !== "available" && state.stage !== "completed") return false;
    set({ stage: "offDuty", assignment: null, events: [], inspection: emptyInspection() });
    return true;
  },
  simulateOffer: () => {
    if (state.stage !== "available" || !driver.readyToWork()) return false;
    set({ assignment: { ...SAMPLE_DISPATCH }, stage: "offered", events: [{ stage: "offered", time: Date.now() }] });
    return true;
  },
  decline: () => {
    if (state.stage !== "offered") return false;
    set({ stage: "available", assignment: null, events: [] });
    return true;
  },
  accept: () => state.stage === "offered" && !state.outOfServiceReason && !state.fatigueBreakRequested && nextStage("accepted"),
  depart: () => state.stage === "accepted" && !state.outOfServiceReason && nextStage("enRoute"),
  sceneArrival: () => state.stage === "enRoute" && nextStage("atScene"),
  beginTransport: () => state.stage === "atScene" && !state.outOfServiceReason && nextStage("transporting"),
  hospitalArrival: () => state.stage === "transporting" && nextStage("atHospital"),
  closeTrip: () => {
    if (state.stage !== "atHospital" || !state.assignment) return false;
    const caseFile = state.assignment;
    set({
      stage: "completed",
      events: [...state.events, { stage: "completed", time: Date.now() }],
      history: [{ id: caseFile.id, completedAt: Date.now(), area: caseFile.location, destination: caseFile.hospital, timeline: [...state.events, { stage: "completed", time: Date.now() }] }, ...state.history],
    });
    return true;
  },
  readyForNext: () => {
    if (state.stage !== "completed" || !driver.readyToWork()) return false;
    set({ stage: "available", assignment: null, events: [] });
    return true;
  },
  reportDefect: (reason: string) => {
    const clean = reason.trim().slice(0, 280);
    if (!clean) return false;
    set({ outOfServiceReason: clean, stage: state.stage === "available" ? "offDuty" : state.stage });
    return true;
  },
  setMaintenanceDue: (date: string | null) => {
    if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    if (!["offDuty", "available", "completed"].includes(state.stage)) return false;
    set({ maintenanceDue: date });
    return true;
  },
  setSupplyExpiry: (key: SupplyKey, expiry: string | null) => {
    if (expiry !== null && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return false;
    if (!["offDuty", "available", "completed"].includes(state.stage)) return false;
    set({ supplies: { ...state.supplies, [key]: { ...state.supplies[key], expiry } } });
    return true;
  },
  setSupplyCount: (key: SupplyKey, count: number) => {
    if (!Number.isSafeInteger(count) || count < 0 || count > 500) return false;
    if (state.stage !== "offDuty" && state.stage !== "available" && state.stage !== "completed") return false;
    set({ supplies: { ...state.supplies, [key]: { ...state.supplies[key], count } } });
    return true;
  },
  setFatigueBreak: (requested: boolean) => {
    set({ fatigueBreakRequested: requested });
    return true;
  },
  checkInSafe: () => {
    if (state.stage === "offDuty") return false;
    set({ safetyCheckins: [Date.now(), ...state.safetyCheckins].slice(0, 30) });
    return true;
  },
  addMessage: (message: string) => {
    const content = message.trim().slice(0, 400);
    if (!content || state.stage === "offDuty") return false;
    set({ messages: [{ id: String(Date.now()) + "-" + state.messages.length, at: Date.now(), from: "driver", text: content, delivery: "local-only" }, ...state.messages].slice(0, 60) });
    return true;
  },
  updateHandover: (note: string) => {
    if (note.length > 2000) return false;
    set({ handoverNote: note });
    return true;
  },
  resetPreview: () => { emit({ ...initial, inspection: emptyInspection(), supplies: freshSupplies(), events: [], history: [], messages: [], safetyCheckins: [] }); },
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
