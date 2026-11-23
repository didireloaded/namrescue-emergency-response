import { describe, expect, it } from "vitest";
import {
  appendTrail, composeLocationText, distanceMeters,
  locationLink, smsComposeUri, validSafetyLocation,
  type SafetyLocation,
} from "./safety-share";

const NOW = Date.UTC(2026, 10, 23, 13, 0, 0);
const point: SafetyLocation = {
  pos: [-22.5609, 17.0658],
  accuracy: 24,
  observedAt: NOW - 10_000,
};

describe("user-directed SMS location sharing", () => {
  it("includes clear coordinates, sample time and message that it is not dispatch", () => {
    const msg = composeLocationText(point, NOW);
    expect(msg).toContain("-22.560900");
    expect(msg).toContain("17.065800");
    expect(msg).toContain("not an emergency-service dispatch");
    expect(locationLink(point.pos)).toContain("openstreetmap.org");
  });
  it("does not compose an SMS from stale, future or missing coordinates", () => {
    expect(composeLocationText({ ...point, observedAt: NOW - 600_000 }, NOW)).toBeNull();
    expect(validSafetyLocation({ ...point, observedAt: NOW + 45_000 }, NOW)).toBe(false);
    expect(validSafetyLocation({ ...point, pos: [Infinity, 17] }, NOW)).toBe(false);
    expect(validSafetyLocation(null, NOW)).toBe(false);
  });
  it("only creates a user-activated compose URI, not a network request", () => {
    const msg = composeLocationText(point, NOW)!;
    const uri = smsComposeUri("+264 81 123 4567", msg);
    expect(uri).toMatch(/^sms:\+264811234567\?body=/);
    expect(decodeURIComponent(uri!.split("?body=")[1])).toBe(msg);
    expect(smsComposeUri("invalid", msg)).toBeNull();
    expect(smsComposeUri("+264811234567", "")).toBeNull();
  });
});

describe("consent-based foreground trail", () => {
  it("adds only fresh samples and rejects duplicates", () => {
    const a = appendTrail([], point);
    const repeated = appendTrail(a, { ...point, observedAt: NOW - 1000 });
    expect(repeated).toBe(a);
  });
  it("caps samples so background-like collection cannot accumulate indefinitely", () => {
    let trail: SafetyLocation[] = [];
    for (let i = 0; i < 150; i++) {
      trail = appendTrail(trail, {
        pos: [point.pos[0] + i * 0.0002, point.pos[1]],
        accuracy: 10,
        observedAt: NOW + i * 16_000,
      });
    }
    expect(trail).toHaveLength(100);
    expect(trail.at(-1)?.pos[0]).toBeCloseTo(point.pos[0] + 149 * 0.0002);
  });
  it("calculates nonzero distance between Namibian locations", () => {
    expect(distanceMeters([-22.5609, 17.0658], [-22.5619, 17.0658])).toBeGreaterThan(100);
  });
});
