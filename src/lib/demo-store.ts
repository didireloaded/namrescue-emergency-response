import { useSyncExternalStore } from "react";
import type { LatLng } from "./demo-sim";

export type RequestStatus = "idle" | "received" | "assigned" | "arrived";
export type LocationSource = "gps" | "manual" | "default";
export interface DemoLocation { pos: LatLng; label: string; source: LocationSource }
export interface HistoryEntry { id: string; at: number; label: string; forOther: boolean }

export interface DemoState {
  status: RequestStatus;
  location: DemoLocation;
  forOther: boolean;
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
  requestedAt: null,
  assignedAt: null,
  arrivedAt: null,
  history: [],
};

let state = initial;
const listeners = new Set<() => void>();
function set(patch: Partial<DemoState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const demo = {
  get: () => state,
  setLocation: (location: DemoLocation) => set({ location }),
  start: (forOther = false) => set({ status: "idle", forOther, requestedAt: null, assignedAt: null, arrivedAt: null }),
  confirm: () => set({ status: "received", requestedAt: Date.now() }),
  assign: () => set({ status: "assigned", assignedAt: state.assignedAt ?? Date.now(), requestedAt: state.requestedAt ?? Date.now() }),
  arrive: () => {
    const at = Date.now();
    set({
      status: "arrived",
      arrivedAt: at,
      assignedAt: state.assignedAt ?? at,
      history: [{ id: String(at), at, label: state.location.label, forOther: state.forOther }, ...state.history],
    });
  },
  cancel: () => set({ status: "idle", requestedAt: null, assignedAt: null, arrivedAt: null }),
};

export function useDemo(): DemoState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => initial,
  );
}
