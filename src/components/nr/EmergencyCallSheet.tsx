import { useState } from "react";
import { ChevronDown, Phone, ExternalLink, MapPin } from "lucide-react";
import { Sheet } from "./chrome";
import { AreaSelector } from "./AreaSelector";
import { areaLabel, contactsFor, dialUri, type HomeArea, type EmergencyCategory } from "@/lib/regions";

const order: EmergencyCategory[] = ["Ambulance", "Police", "Fire & rescue", "Road accident", "Hospital"];
export function EmergencyCallSheet({ open, onClose, initialArea }: {
  open: boolean;
  onClose: () => void;
  initialArea: HomeArea;
}) {
  // Selection is independent of saved home area, useful for travellers and witnesses.
  const [override, setOverride] = useState<HomeArea | null>(null);
  const [changing, setChanging] = useState(false);
  const area = override ?? initialArea;
  const contacts = contactsFor(area);
  return <Sheet open={open} onClose={onClose} title="Emergency numbers">
    <h2 className="text-[22px] font-bold">Emergency contacts</h2>
    <p className="mt-1 text-[13px] text-sheet-muted">Choose the area where help is needed. Calls open your phone dialer.</p>
    <button onClick={() => setChanging(x => !x)} className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl bg-[#EFF3F8] px-4 text-left text-[#19273B]">
      <MapPin className="size-5 text-[#2864B5]" /><span className="flex-1 text-[14px] font-semibold">{areaLabel(area)}</span><ChevronDown className="size-4" />
    </button>
    {changing && <div className="mt-3 rounded-2xl border border-[#DEE5EC] bg-white p-3 text-[#142236]">
      <AreaSelector value={area} onChange={setOverride} />
      <button onClick={() => setChanging(false)} className="mt-3 min-h-11 w-full rounded-xl bg-[#162235] text-[14px] font-semibold text-white">Use this area</button>
    </div>}
    {order.map(category => {
      const group = contacts.filter(c => c.category === category);
      if (!group.length) return null;
      return <section className="mt-4" key={category}>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[.08em] text-[#6C7889]">{category}</h3>
        <div className="divide-y divide-[#E9EEF3] overflow-hidden rounded-2xl border border-[#E9EEF3] bg-white">
          {group.map(contact => <div key={contact.id} className="flex items-center gap-3 p-3 text-[#19273B]">
            <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{contact.name}</p>
              <p className="mt-0.5 text-[12px] text-[#778397]">{contact.number} · {contact.scope === "national" ? "Nationwide" : "Listed coverage"}</p>
              {contact.note && <p className="mt-1 text-[11px] leading-normal text-[#778397]">{contact.note}</p>}
              <a href={contact.source} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#266AC0]">Source <ExternalLink className="size-3" /></a>
            </div>
            <a href={dialUri(contact.number)} aria-label={"Call " + contact.name} className="grid size-12 shrink-0 place-items-center rounded-full bg-[#E9F2FD] text-[#1E68BC]"><Phone className="size-5"/></a>
          </div>)}
        </div>
      </section>;
    })}
    <p className="mt-4 text-[12px] leading-relaxed text-sheet-muted">Not a complete provider directory. Numbers are based on published sources and must be regularly reverified. This app does not place calls itself or send ambulance requests.</p>
  </Sheet>;
}
