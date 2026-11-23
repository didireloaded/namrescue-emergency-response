import { describe, expect, it } from "vitest";
import { canDial, etaMinutes, pointAlong, tripProgress, DEMO_TRIP_SECONDS } from "./demo-sim";

describe("demo simulation rules", () => {
  it("calling stays disabled until a verified number is configured", () => {
    expect(canDial(null)).toBe(false);
    expect(canDial("")).toBe(false);
  });
  it("simulated ETA starts at 7 min and reaches 0 on arrival", () => {
    expect(etaMinutes(0)).toBe(7);
    expect(etaMinutes(1)).toBe(0);
  });
  it("trip progress clamps between 0 and 1", () => {
    expect(tripProgress(null, 5)).toBe(0);
    expect(tripProgress(0, DEMO_TRIP_SECONDS * 2000)).toBe(1);
  });
  it("finds midpoint along a path", () => {
    expect(pointAlong([[0, 0], [0, 2]], 0.5)).toEqual([0, 1]);
  });
});
