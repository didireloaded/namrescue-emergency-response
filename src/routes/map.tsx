import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/nr/chrome";
import { LazyMap } from "@/components/nr/LazyMap";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [
    { title: "Map — NamRescue demo" }, { name: "description", content: "Your location on the map." },
    { property: "og:title", content: "Map — NamRescue demo" }, { property: "og:description", content: "Your location on the map." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => { const s = useDemo(); return (
    <div className="flex h-full flex-col bg-ink"><div className="relative flex-1 isolate"><LazyMap mode="locate" center={s.location.pos} className="absolute inset-0" label="Map" /></div><BottomNav active="/map" /></div>
  ); },
});
