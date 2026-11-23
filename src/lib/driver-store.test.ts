import { beforeEach, describe, expect, it } from "vitest";
import { driver, stageLabel, VEHICLE_ITEMS, SAMPLE_DISPATCH, supplyIssue, dateOverdue } from "./driver-store";

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
  it("prevents starting a shift with a safety defect", () => {
    for (const item of VEHICLE_ITEMS) driver.checklist(item.id,true);
    expect(driver.reportDefect("Brakes require inspection")).toBe(true);
    expect(driver.startShift()).toBe(false);
    expect(driver.get().outOfServiceReason).toContain("Brakes");
  });
  it("takes an available vehicle off duty when a defect is raised", () => {
    ready();
    expect(driver.reportDefect("Vehicle lights not functioning")).toBe(true);
    expect(driver.get().stage).toBe("offDuty");
    expect(driver.simulateOffer()).toBe(false);
  });
  it("blocks new assignments when a critical supply is low or expired", () => {
    ready();
    expect(driver.setSupplyCount("oxygen",0)).toBe(true);
    expect(driver.simulateOffer()).toBe(false);
    expect(driver.supplyIssues()).toContain("oxygen");
    expect(driver.setSupplyCount("oxygen",2)).toBe(true);
    expect(driver.setSupplyExpiry("dressings","2020-01-01")).toBe(true);
    expect(driver.supplyIssues()).toContain("dressings");
    expect(driver.simulateOffer()).toBe(false);
    expect(supplyIssue(driver.get().supplies.dressings)).toBe("Expired");
  });
  it("blocks shift start when the service date is overdue", () => {
    for (const item of VEHICLE_ITEMS) driver.checklist(item.id,true);
    expect(driver.setMaintenanceDue("2020-01-01")).toBe(true);
    expect(dateOverdue("2020-01-01")).toBe(true);
    expect(driver.startShift()).toBe(false);
  });
  it("makes rest and crew flags local-only without changing a current call", () => {
    ready();
    expect(driver.setFatigueBreak(true)).toBe(true);
    expect(driver.simulateOffer()).toBe(false);
    expect(driver.setFatigueBreak(false)).toBe(true);
    driver.simulateOffer();
    driver.accept();
    driver.setFatigueBreak(true);
    expect(driver.get().stage).toBe("accepted");
    expect(driver.checkInSafe()).toBe(true);
    expect(driver.get().safetyCheckins).toHaveLength(1);
  });
  it("records quick messages locally without pretending to send to a control room", () => {
    expect(driver.addMessage("On scene")).toBe(false);
    ready();
    expect(driver.addMessage("At scene")).toBe(true);
    expect(driver.get().messages[0]?.delivery).toBe("local-only");
    expect(driver.get().messages[0]?.from).toBe("driver");
    expect(driver.addMessage("   ")).toBe(false);
  });
  it("preserves a full local status history inside completed trip records", () => {
    ready();
    driver.simulateOffer();
    driver.accept();
    driver.depart();
    driver.sceneArrival();
    driver.beginTransport();
    driver.hospitalArrival();
    driver.closeTrip();
    const timeline=driver.get().history[0]?.timeline;
    expect(timeline?.map(event=>event.stage)).toEqual([
      "offered","accepted","enRoute","atScene","transporting","atHospital","completed"
    ]);
  });
  it("accepts handover notes without medical record data synchronization", () => {
    expect(driver.updateHandover("Fuel refilled.")).toBe(true);
    expect(driver.get().handoverNote).toBe("Fuel refilled.");
    expect(driver.updateHandover("x".repeat(2100))).toBe(false);
  });

  it("prevents new driving stages after a reported mechanical defect", () => {
    ready();
    driver.simulateOffer();
    driver.accept();
    expect(driver.reportDefect("Steering fault")).toBe(true);
    expect(driver.depart()).toBe(false);
    expect(driver.get().stage).toBe("accepted");
  });
  it("keeps expiry changes locked during a response", () => {
    ready();
    driver.simulateOffer();
    expect(driver.setSupplyExpiry("oxygen","2025-01-01")).toBe(false);
    expect(driver.setMaintenanceDue("2020-01-01")).toBe(false);
  });

});
