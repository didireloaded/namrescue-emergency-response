import { beforeEach, describe, expect, it } from "vitest";
import { demo, canSubmit, isActive, WINDHOEK } from "./demo-store";
import { citizen } from "./citizen-store";

beforeEach(() => {
  if (demo.get().status === "received") demo.cancel();
  if (demo.get().status === "assigned") demo.arrive();
  if (demo.get().status === "arrived") demo.complete();
  demo.start(false);
  demo.setLocation({ pos: WINDHOEK, label: "Windhoek map preview", source: "default" });
  citizen.clear();
});

describe("emergency request guards", () => {
  it("does not submit a default map position as an emergency", () => {
    expect(canSubmit("idle", "default")).toBe(false);
    expect(demo.confirm()).toBe(false);
    expect(demo.get().status).toBe("idle");
  });
  it("requires location confirmation and returns a reference", () => {
    demo.setLocation({ pos: [-22.56, 17.06], label: "Pinned location", source: "manual" });
    expect(demo.confirm()).toBe(true);
    expect(demo.get().status).toBe("received");
    expect(demo.get().reference).toMatch(/^CN-/);
  });
  it("prevents duplicate submissions and accidental reset", () => {
    demo.setLocation({ pos: WINDHOEK, label: "Verified pin", source: "manual" });
    expect(demo.confirm()).toBe(true);
    expect(demo.confirm()).toBe(false);
    expect(demo.start()).toBe(false);
    expect(isActive(demo.get().status)).toBe(true);
  });
  it("rejects an ambulance assignment without a received incident", () => {
    expect(demo.assign()).toBe(false);
    expect(demo.arrive()).toBe(false);
  });
  it("enforces the response status order", () => {
    demo.setLocation({ pos: WINDHOEK, label: "Verified pin", source: "manual" });
    expect(demo.confirm()).toBe(true);
    expect(demo.arrive()).toBe(false);
    expect(demo.assign()).toBe(true);
    expect(demo.assign()).toBe(false);
    expect(demo.arrive()).toBe(true);
    expect(demo.get().history.length).toBe(0);
    expect(demo.complete()).toBe(true);
    expect(demo.get().history.length).toBeGreaterThan(0);
  });
  it("prevents incident location mutation after receipt", () => {
    demo.setLocation({ pos: WINDHOEK, label: "Initial pin", source: "manual" });
    demo.confirm();
    expect(demo.setLocation({ pos: [-22.50, 17.1], label: "Moved", source: "manual" })).toBe(false);
    expect(demo.get().location.label).toBe("Initial pin");
  });
  it("allows the user to cancel an unassigned incident", () => {
    demo.setLocation({ pos: WINDHOEK, label: "Verified pin", source: "manual" });
    demo.confirm();
    expect(demo.cancel()).toBe(true);
    expect(demo.get().status).toBe("idle");
  });
});

describe("sensitive citizen information", () => {
  it("supports editing personal and medical details and clearing them", () => {
    citizen.updateProfile({ name: "Test Citizen", completedOnboarding: true });
    citizen.updateMedical({ allergies: "Test allergy" });
    citizen.addDependant({ name: "Test Child", relationship: "Child" });
    citizen.addContact({ name: "Test Contact", phone: "+264 00 000 0000", relationship: "Friend" });
    expect(citizen.get().medical.allergies).toBe("Test allergy");
    expect(citizen.get().dependants).toHaveLength(1);
    expect(citizen.get().contacts).toHaveLength(1);
    citizen.clear();
    expect(citizen.get().profile.name).toBe("");
    expect(citizen.get().medical.allergies).toBe("");
    expect(citizen.get().contacts).toHaveLength(0);
  });
});
