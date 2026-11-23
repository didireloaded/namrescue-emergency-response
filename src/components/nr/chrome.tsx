import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Home, Map, HeartPulse, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBar() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[60] hidden h-[54px] md:block">
      <div className="absolute left-1/2 top-[11px] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-[var(--stage)]" />
      <span className="absolute left-[38px] top-[17px] text-[16px] font-semibold tabular text-on-photo mix-blend-difference">09:41</span>
      <span className="absolute right-[30px] top-[19px] flex items-center gap-1.5 text-on-photo mix-blend-difference">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/><rect x="23.5" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".5"/></svg>
      </span>
    </div>
  );
}

export function HomeIndicator({ dark = false }: { dark?: boolean }) {
  return <div aria-hidden className={cn("pointer-events-none absolute bottom-[8px] left-1/2 z-[60] hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full md:block", dark ? "bg-sheet-foreground" : "bg-on-photo")} />;
}

export function DemoBadge() {
  return (
    <div className="pointer-events-none absolute left-1/2 z-[55] -translate-x-1/2" style={{ top: "calc(var(--safe-top) + 6px)" }}>
      <span className="rounded-full border border-caution/50 bg-ink/70 px-2.5 py-[3px] text-[10px] font-semibold tracking-[0.14em] text-caution">DEMO</span>
    </div>
  );
}

export function BackButton({ to, light = false, label = "Back" }: { to?: "/" | "/request" | "/tracking"; light?: boolean; label?: string }) {
  const router = useRouter();
  const cls = cn(
    "press grid size-11 place-items-center rounded-full",
    light ? "bg-sheet text-sheet-foreground shadow-card" : "bg-ink/55 text-on-photo border border-hairline",
  );
  if (to) return <Link to={to} aria-label={label} className={cls}><ChevronLeft className="size-6" strokeWidth={2.2} /></Link>;
  return <button type="button" aria-label={label} className={cls} onClick={() => router.history.back()}><ChevronLeft className="size-6" strokeWidth={2.2} /></button>;
}

const TABS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/map", label: "Map", Icon: Map },
  { to: "/medical", label: "Medical ID", Icon: HeartPulse },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav({ active }: { active: (typeof TABS)[number]["to"] }) {
  return (
    <nav aria-label="Main" className="relative z-20 border-t border-hairline bg-ink pb-safe">
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, Icon }) => {
          const on = to === active;
          return (
            <li key={to}>
              <Link to={to} aria-current={on ? "page" : undefined} className={cn("flex min-h-[56px] flex-col items-center justify-center gap-1 pt-2 text-[12px] font-medium", on ? "text-sos-bright" : "text-on-photo-muted")}>
                <Icon className="size-[22px]" strokeWidth={on ? 2.3 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sheet({ open, onClose, children, title, dark = false }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string; dark?: boolean }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-ink/60" />
      <div className={cn("animate-sheet-up absolute inset-x-0 bottom-0 max-h-[92%] overflow-y-auto overscroll-contain rounded-t-[28px] px-5 pb-safe pt-2.5 shadow-sheet", dark ? "bg-ink-2 text-on-photo" : "bg-sheet text-sheet-foreground")}>
        <div className={cn("mx-auto mb-4 h-[5px] w-10 rounded-full", dark ? "bg-hairline" : "bg-sheet-line")} />
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}
