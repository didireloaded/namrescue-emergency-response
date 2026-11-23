import { createFileRoute } from "@tanstack/react-router";
import DriverApp from "@/components/nr/DriverApp";

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [
    { title: "CareNear Driver | Shift and dispatch training UI" },
    { name: "description", content: "Mobile-first driver screens for dispatch, navigation, ambulance checks, transport and shift activity. Not a live emergency service." },
  ] }),
  component: DriverApp,
});
