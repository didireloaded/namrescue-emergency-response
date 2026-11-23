import { beforeEach, describe, expect, it } from "vitest";
import { driver, useDriver, stageLabel, VEHICLE_ITEMS, SAMPLE_DISPATCH } from "./driver-store";

beforeEach(() => driver.resetPreview());

function ready() {
  for (const item of VEHICLE_ITEMS) driver.checklist(item.id, true);
  expect(driver.startShift()).toBe(true);
}

describe("CareNear driver shift and readiness", () => {
  it("cannot go on duty until every required vehicle check is complete", () => {
    expect(driver.startShift()).toBe(false);
    for (const item of VEHICLE_ITEMS.slice(0, -1)) driver.checklist(item.id, true);
    expect(driver.startShift()).toBe(false);
    driver.checklist("cleanliness", true);
    expect(driver.startShift()).toBe(true);
    expect(driver.get().stage).toBe("available");
  });
  it("never creates an incoming assignment automatically", () => {
    ready();
    expect(driver.get().assignment).toBeNull();
    expect(driver.get().stage).toBe("available");
  });
  it("supports manually loading and declining a demonstration offer", () => {
    ready();
    expect(driver.simulateOffer()).toBe(true);
    expect(driver.get().assignment?.id).toBe(SAMPLE_DISPATCH.id);
    expect(driver.decline()).toBe(true);
    expect(driver.get().assignment).toBeNull();
    expect(driver.get().stage).toBe("available");
  });
  it("rejects skipping assignment states or leaving an active shift", () => {
    expect(driver.accept()).toBe(false);
    ready();
    expect(driver.depart()).toBe(false);
    expect(driver.beginTransport()).toBe(false);
    driver.simulateOffer();
    driver.accept();
    expect(driver.endShift()).toBe(false);
    expect(driver.hospitalArrival()).toBe(false);
  });
  it("closes an illustrative job only after driver arrival and transport", () => {
    ready();
    driver.simulateOffer();
    expect(driver.accept()).toBe(true);
    expect(driver.depart()).toBe(true);
    expect(driver.sceneArrival()).toBe(true);
    expect(driver.beginTransport()).toBe(true);
    expect(driver.hospitalArrival()).toBe(true);
    expect(driver.closeTrip()).toBe(true);
    expect(driver.get().stage).toBe("completed");
    expect(driver.get().history).toHaveLength(1);
    expect(driver.get().history[0]?.destination).toBe(SAMPLE_DISPATCH.hospital);
    expect(driver.readyForNext()).toBe(true);
    expect(driver.get().stage).toBe("available");
  });
  it("locks vehicle checks while the trip is active", () => {
    ready();
    driver.simulateOffer();
    expect(driver.checklist("fuel", false)).toBe(false);
    expect(driver.get().inspection.fuel).toBe(true);
  });
  it("only tracks fictional data until verified driver authentication and dispatch exist", () => {
    expect(SAMPLE_DISPATCH.id).toMatch(/^CN-TRAIN/);
    expect(stageLabel("offered")).toBe("New dispatch");
    expect(driver.get().history).toHaveLength(0);
  });
});
