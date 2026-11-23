import { lazy, Suspense, type ComponentProps } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type MapViewType from "./MapView";

const MapView = lazy(() => import("./MapView"));

export function LazyMap(props: ComponentProps<typeof MapViewType>) {
  const fallback = <div className={props.className} aria-hidden style={{ background: "var(--ink-2)" }} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}><MapView {...props} /></Suspense>
    </ClientOnly>
  );
}
