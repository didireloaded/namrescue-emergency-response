import { beforeEach, describe, expect, it } from "vitest";
import { citizen } from "./citizen-store";
import { contactsFor, dialUri, isConfiguredArea, townsFor } from "./regions";
import { demo, WINDHOEK } from "./demo-store";
import { prepareDispatchDraft } from "./dispatch-contract";

describe("Namibia area and emergency directory", () => {
  it("supports regional onboarding and unlisted settlements", () => {
    expect(townsFor("Oshana")).toContain("Oshakati");
    expect(isConfiguredArea({ region: "Oshana", town: "Oshakati" })).toBe(true);
    expect(isConfiguredArea({ region: "Oshana", town: "" })).toBe(false);
  });
  it("retains nationwide fallback when there is no town", () => {
    const contacts = contactsFor({ region: "", town: "" });
    expect(contacts.some(c => c.number === "112")).toBe(true);
    expect(contacts.every(c => c.scope === "national")).toBe(true);
  });
  it("does not suggest Windhoek municipal services in Oshakati", () => {
    const contacts = contactsFor({ region: "Oshana", town: "Oshakati" });
    expect(contacts.some(c => c.id === "whk-fire")).toBe(false);
    expect(contacts.some(c => c.id === "outapi-ambulance")).toBe(true);
    expect(contacts.some(c => c.scope === "national")).toBe(true);
  });
  it("does not apply a town-specific provider to a different town in the same region", () => {
    const contacts = contactsFor({ region: "Erongo", town: "Karibib" });
    expect(contacts.some(c => c.id === "coast-code-red")).toBe(false);
  });
  it("preserves native dialer links and rejects invalid input", () => {
    expect(dialUri("061 211 111")).toBe("tel:061211111");
    expect(dialUri("+264 66 265 500")).toBe("tel:+26466265500");
    expect(() => dialUri("not a number")).toThrow();
  });
});

beforeEach(() => {
  if (demo.get().status === "received") demo.cancel();
  if (demo.get().status === "assigned") demo.arrive();
  demo.start(false);
  demo.setLocation({ pos: WINDHOEK, label: "Map preview", source: "default" });
  citizen.clear();
});

describe("emergency location is not home location", () => {
  it("does not assume the saved home town is the incident town", () => {
    citizen.updateHomeArea({ region: "Khomas", town: "Windhoek" });
    expect(demo.get().incidentArea.town).toBe("");
    demo.setLocation({ pos: [-17.921, 19.765], label: "Remote pin", source: "manual" });
    demo.setIncidentArea({ region: "Kavango East", town: "Rundu" });
    expect(citizen.get().homeArea.town).toBe("Windhoek");
    expect(demo.get().incidentArea.town).toBe("Rundu");
  });
  it("prepares dispatch draft from incident GPS, not the citizen home town", () => {
    citizen.updateHomeArea({ region: "Khomas", town: "Windhoek" });
    demo.setLocation({ pos: [-17.921, 19.765], label: "Rundu scene", source: "manual" });
    demo.setIncidentArea({ region: "Kavango East", town: "Rundu" });
    const draft = prepareDispatchDraft(demo.get());
    expect(draft.ok).toBe(true);
    if (draft.ok) {
      expect(draft.value.incidentLocation.latitude).toBeCloseTo(-17.921);
      expect(draft.value.emergencyAreaHint?.town).toBe("Rundu");
      expect(draft.value.ambulanceAssignment).toBe("requires_authorised_dispatch");
    }
  });
  it("rejects a default map centre instead of treating it as the patient's coordinates", () => {
    expect(prepareDispatchDraft(demo.get())).toEqual({ ok: false, reason: "location_unconfirmed" });
  });
  it("clears outdated incident area when the location pin moves", () => {
    demo.setIncidentArea({ region: "Khomas", town: "Windhoek" });
    demo.setLocation({ pos: [-17.9, 19.8], label: "Rundu", source: "manual" });
    expect(demo.get().incidentArea.town).toBe("");
  });
  it("does not auto-assign or show tracking without explicit simulation", () => {
    demo.setLocation({ pos: WINDHOEK, label: "Chosen", source: "manual" });
    expect(demo.confirm()).toBe(true);
    expect(demo.get().status).toBe("received");
    expect(demo.get().assignedAt).toBeNull();
  });
  it("stores optional accident details after request without blocking confirmation", () => {
    demo.start(true, "Road accident");
    demo.setLocation({ pos: WINDHOEK, label: "Scene", source: "manual" });
    expect(demo.confirm()).toBe(true);
    demo.setAccidentDetails({ vehicleCount: "2", injuredCount: "Not sure", onScene: "yes" });
    expect(demo.get().accident.vehicleCount).toBe("2");
    expect(demo.get().accident.injuredCount).toBe("Not sure");
  });
  it("accepts a rating only after the arrival state", () => {
    expect(demo.setFeedback(5, "Good")).toBe(false);
    demo.setLocation({ pos: WINDHOEK, label: "Scene", source: "manual" });
    demo.confirm();
    demo.assign();
    demo.arrive();
    expect(demo.setFeedback(6, "Too many stars")).toBe(false);
    expect(demo.setFeedback(4, "Thank you")).toBe(true);
    expect(demo.get().history[0]?.rating).toBe(4);
  });
});
