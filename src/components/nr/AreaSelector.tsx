import { REGIONS, townsFor, type HomeArea, type Region } from "@/lib/regions";

const input = "min-h-12 w-full rounded-2xl border border-[#DCE2EA] bg-white px-4 text-[15px] text-[#152236] outline-none focus:border-[#206AC0]";
export function AreaSelector({ value, onChange, heading, help }: {
  value: HomeArea;
  onChange: (area: HomeArea) => void;
  heading?: string;
  help?: string;
}) {
  return <section className="space-y-3">
    {heading && <h2 className="text-[16px] font-bold">{heading}</h2>}
    {help && <p className="text-[13px] leading-relaxed text-[#667589]">{help}</p>}
    <div><label className="mb-1.5 block text-[13px] font-semibold">Region</label>
      <select aria-label="Select Namibia region" value={value.region} onChange={e => onChange({ region: e.target.value as Region | "", town: "" })} className={input}>
        <option value="">Select region</option>
        {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
      </select>
    </div>
    <div><label className="mb-1.5 block text-[13px] font-semibold">Town or settlement</label>
      <input aria-label="Town or settlement" disabled={!value.region} list="namrescue-towns" className={input} value={value.town} onChange={e=>onChange({ ...value, town:e.target.value })} placeholder={value.region ? "Type or select a town" : "Choose region first"} />
      <datalist id="namrescue-towns">{townsFor(value.region).map(town=><option value={town} key={town}/>)}</datalist>
      <p className="mt-1.5 text-[12px] text-[#758297]">You can enter a village or settlement not listed here.</p>
    </div>
  </section>;
}
