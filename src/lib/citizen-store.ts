import { EMPTY_AREA, type HomeArea } from "./regions";
import { useSyncExternalStore } from "react";

/**
 * Citizen information lives in memory until authenticated, encrypted storage
 * is configured. Never write medical history, photos, dependants or contacts
 * to localStorage or an unauthenticated endpoint.
 */
export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}
export interface Dependant {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  medicalNotes?: string;
}
export interface CitizenProfile {
  name: string;
  phone: string;
  email: string;
  avatar: string | null;
  dateOfBirth: string;
  completedOnboarding: boolean;
}
export interface MedicalRecord {
  bloodType: string;
  allergies: string;
  conditions: string;
  medication: string;
  notes: string;
}
export interface MedicalAid {
  provider: string;
  membershipNumber: string;
  scheme: string;
  mainMemberName: string;
}
export interface Preferences {
  language: "English" | "Oshiwambo" | "Afrikaans" | "Otjiherero" | "Khoekhoegowab";
  locationOnRequest: boolean;
  shareMedicalWithCrew: boolean;
  notifyContacts: boolean;
  largeText: boolean;
}
export interface CitizenState {
  profile: CitizenProfile;
  medical: MedicalRecord;
  medicalAid: MedicalAid;
  homeArea: HomeArea;
  contacts: Contact[];
  dependants: Dependant[];
  preferences: Preferences;
}
const empty: CitizenState = {
  profile: { name: "", phone: "", email: "", avatar: null, dateOfBirth: "", completedOnboarding: false },
  medical: { bloodType: "", allergies: "", conditions: "", medication: "", notes: "" },
  medicalAid: { provider: "", membershipNumber: "", scheme: "", mainMemberName: "" },
  homeArea: { ...EMPTY_AREA },
  contacts: [],
  dependants: [],
  preferences: {
    language: "English",
    locationOnRequest: true,
    shareMedicalWithCrew: false,
    notifyContacts: false,
    largeText: false,
  },
};
let snapshot: CitizenState = empty;
const listeners = new Set<() => void>();
const emit = (next: CitizenState) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};
const makeId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random());
export const citizen = {
  get: () => snapshot,
  updateProfile: (patch: Partial<CitizenProfile>) => emit({ ...snapshot, profile: { ...snapshot.profile, ...patch } }),
  updateMedical: (patch: Partial<MedicalRecord>) => emit({ ...snapshot, medical: { ...snapshot.medical, ...patch } }),
  updateMedicalAid: (patch: Partial<MedicalAid>) => emit({ ...snapshot, medicalAid: { ...snapshot.medicalAid, ...patch } }),
  updateHomeArea: (patch: Partial<HomeArea>) => emit({ ...snapshot, homeArea: { ...snapshot.homeArea, ...patch } }),
  updatePreferences: (patch: Partial<Preferences>) => emit({ ...snapshot, preferences: { ...snapshot.preferences, ...patch } }),
  addContact: (contact: Omit<Contact, "id">) =>
    emit({ ...snapshot, contacts: [...snapshot.contacts, { id: makeId(), ...contact }] }),
  removeContact: (id: string) => emit({ ...snapshot, contacts: snapshot.contacts.filter((x) => x.id !== id) }),
  addDependant: (dependant: Omit<Dependant, "id">) =>
    emit({ ...snapshot, dependants: [...snapshot.dependants, { id: makeId(), ...dependant }] }),
  removeDependant: (id: string) => emit({ ...snapshot, dependants: snapshot.dependants.filter((x) => x.id !== id) }),
  clear: () => emit({
    profile: { ...empty.profile },
    medical: { ...empty.medical },
    medicalAid: { ...empty.medicalAid },
    homeArea: { ...empty.homeArea },
    contacts: [],
    dependants: [],
    preferences: { ...empty.preferences },
  }),
};
/** SSR-safe external-store hook. Sensitive information is deliberately session-only. */
export function useCitizen(): CitizenState {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => snapshot,
    () => empty,
  );
}
