import { describe, expect, it } from "vitest";
import { canCreatePreviewRequest } from "./connectivity";

describe("request connectivity guard", () => {
  it("blocks new preview submissions when the browser reports offline", () => {
    expect(canCreatePreviewRequest("offline")).toBe(false);
  });
  it("does not treat an unknown connection as online", () => {
    expect(canCreatePreviewRequest("unknown")).toBe(false);
  });
  it("allows a local demo preview only after a positive online hint", () => {
    expect(canCreatePreviewRequest("online")).toBe(true);
  });
});
