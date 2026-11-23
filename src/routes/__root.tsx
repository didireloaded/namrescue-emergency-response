import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { StatusBar, HomeIndicator, DemoBadge } from "../components/nr/chrome";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "viewport-fit", content: "cover" },
      { name: "theme-color", content: "#101722" },
      { title: "NamRescue — Emergency ambulance prototype" },
      { name: "description", content: "Interactive demo prototype of an emergency ambulance request app for Namibia." },
      { property: "og:title", content: "NamRescue — Emergency ambulance prototype" },
      { property: "og:description", content: "Interactive demo prototype of an emergency ambulance request app for Namibia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <PhoneFrame>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </PhoneFrame>
    </QueryClientProvider>
  );
}

const SCREENS = [
  { to: "/", n: "01", label: "Home / SOS" },
  { to: "/request", n: "02", label: "Confirm location" },
  { to: "/tracking", n: "03", label: "Tracking" },
  { to: "/team", n: "04", label: "Response team" },
  { to: "/arrived", n: "05", label: "Arrived" },
  { to: "/medical", n: "06", label: "Medical ID" },
  { to: "/profile", n: "07", label: "Citizen profile" },
] as const;

const LIGHT_ROUTES = ["/summary", "/history", "/profile", "/medical"];

function PhoneFrame({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh md:flex md:items-center md:justify-center md:gap-14 md:py-8">
      <aside className="hidden w-56 md:block" aria-label="Screen picker">
        <p className="text-[13px] font-semibold text-on-photo">NamRescue</p>
        <p className="mb-6 text-[12px] text-muted-foreground">Interactive prototype · not a live service</p>
        <ul className="space-y-1">
          {SCREENS.map((s) => (
            <li key={s.to}>
              <Link to={s.to} className={"flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors " + (path === s.to ? "bg-ink-2 text-on-photo" : "text-muted-foreground hover:text-on-photo")}>
                <span className="tabular text-[11px] text-sos-bright">{s.n}</span>{s.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="device">
        <div className="device-screen device-screen-box">
          <StatusBar />
          {["/", "/request", "/tracking", "/team", "/arrived"].includes(path) && <DemoBadge />}
          {children}
          <HomeIndicator dark={LIGHT_ROUTES.includes(path)} />
        </div>
      </div>
      <div className="hidden w-56 md:block" />
    </div>
  );
}
