import { createFileRoute } from "@tanstack/react-router";
import CitizenProfile from "@/components/nr/CitizenProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Your Profile | CareNear" },
    { name: "description", content: "Manage your emergency contacts, medical ID and family information." },
  ] }),
  component: CitizenProfile,
});
