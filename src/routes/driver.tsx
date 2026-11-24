import { createFileRoute } from "@tanstack/react-router";
import CareNearDriver from "@/components/nr/CareNearDriver";

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [
    { title: "CareNear Driver | iOS-style shift and dispatch experience" },
    { name: "description", content: "Mobile-first driver screens for dispatch, navigation, ambulance checks, transport and shift activity. Not a live emergency service." },
  ] }),
  component: CareNearDriver,
});
