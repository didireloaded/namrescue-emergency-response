import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CareNearDriver from "./CareNearDriver";
import { driver, VEHICLE_ITEMS } from "@/lib/driver-store";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: import("react").ReactNode }) =>
    <a href={to}>{children}</a>,
}));

vi.mock("@/components/nr/LazyMap", () => ({
  LazyMap: () => <div role="img" aria-label="Illustrative training map"/>,
}));

beforeEach(() => driver.resetPreview());
const tap = (label: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: label }));
function startTraining() {
  tap("Complete vehicle checks");
  for (const item of VEHICLE_ITEMS) fireEvent.click(screen.getByRole("checkbox", { name: item.label }));
  tap("Start training shift");
}

describe("CareNear Driver iOS experience", () => {
  it("renders the photo-led home, four main tabs, and training disclaimer", () => {
    render(<CareNearDriver />);
    expect(screen.getByText("Driver workspace")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Driver app navigation" })).toBeInTheDocument();
    expect(screen.getByText(/No ambulance, dispatcher, patient or hospital is connected/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Navigation Route preview" })).toBeInTheDocument();
  });

  it("keeps the vehicle readiness checklist and shift start connected", () => {
    render(<CareNearDriver />);
    startTraining();
    expect(driver.get().stage).toBe("available");
    expect(screen.getByText("Current shift")).toBeInTheDocument();
    tap(/Load sample dispatch/);
    expect(screen.getByText("New dispatch")).toBeInTheDocument();
    expect(screen.getByText("Training dispatch")).toBeInTheDocument();
  });

  it("supports accept, route, arrival and transport without a backend claim", () => {
    render(<CareNearDriver />);
    startTraining();
    tap(/Load sample dispatch/);
    tap("Accept dispatch");
    expect(driver.get().stage).toBe("accepted");
    expect(screen.getByText("Trip details")).toBeInTheDocument();
    tap("Start route to pickup");
    expect(driver.get().stage).toBe("enRoute");
    expect(screen.getByText("ETA unavailable")).toBeInTheDocument();
    tap("Confirm scene arrival");
    expect(driver.get().stage).toBe("atScene");
    tap("Begin transport to hospital");
    expect(driver.get().stage).toBe("transporting");
  });

  it("does not fabricate live clinical records in the patient section", () => {
    render(<CareNearDriver />);
    startTraining();
    tap(/Load sample dispatch/);
    tap("Accept dispatch");
    fireEvent.click(screen.getByRole("tab", { name: "patient" }));
    expect(screen.getByText("Clinical record not connected")).toBeInTheDocument();
    expect(screen.queryByText(/108 bpm/)).not.toBeInTheDocument();
  });

  it("shows a safe no-assignment state when opening navigation", () => {
    render(<CareNearDriver />);
    tap("Navigation Route preview");
    expect(screen.getByText("No active destination")).toBeInTheDocument();
    expect(screen.getByText("No active training route")).toBeInTheDocument();
  });
});
