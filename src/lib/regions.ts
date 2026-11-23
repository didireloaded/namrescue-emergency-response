/**
 * Namibia location & emergency contact registry.
 *
 * Regions and towns are onboarding conveniences, NOT ambulance dispatch
 * catchments. An incident's actual GPS/pin location is authoritative.
 * A vetted emergency provider/dispatcher must make any assignment.
 */
export const REGION_TOWNS = {
  Erongo: ["Swakopmund", "Walvis Bay", "Henties Bay", "Arandis", "Omaruru", "Karibib", "Usakos"],
  Hardap: ["Mariental", "Rehoboth", "Aranos", "Gibeon", "Maltahöhe"],
  "ǁKaras": ["Keetmanshoop", "Lüderitz", "Oranjemund", "Karasburg", "Rosh Pinah", "Bethanie"],
  "Kavango East": ["Rundu", "Divundu"],
  "Kavango West": ["Nkurenkuru", "Mpungu"],
  Khomas: ["Windhoek"],
  Kunene: ["Opuwo", "Khorixas", "Outjo", "Kamanjab"],
  Ohangwena: ["Eenhana", "Helao Nafidi", "Oshikango", "Okongo"],
  Omaheke: ["Gobabis", "Leonardville", "Otjinene"],
  Omusati: ["Outapi", "Okahao", "Oshikuku", "Ruacana", "Tsandi"],
  Oshana: ["Oshakati", "Ongwediva", "Ondangwa"],
  Oshikoto: ["Tsumeb", "Omuthiya", "Onayena"],
  Otjozondjupa: ["Otjiwarongo", "Okahandja", "Grootfontein", "Otavi"],
  Zambezi: ["Katima Mulilo", "Bukalo", "Ngoma"],
} as const;

export type Region = keyof typeof REGION_TOWNS;
export const REGIONS = Object.keys(REGION_TOWNS) as Region[];
export interface HomeArea { region: Region | ""; town: string }
export const EMPTY_AREA: HomeArea = { region: "", town: "" };
export function townsFor(region: Region | ""): readonly string[] {
  return region ? REGION_TOWNS[region] : [];
}
export function areaLabel(area: HomeArea): string {
  return area.town ? area.town + (area.region ? ", " + area.region : "") : area.region || "Choose your area";
}
export function isConfiguredArea(area: HomeArea) {
  return Boolean(area.region && area.town.trim());
}

export type EmergencyCategory = "Ambulance" | "Police" | "Fire & rescue" | "Road accident" | "Hospital";
export interface EmergencyContact {
  id: string;
  name: string;
  category: EmergencyCategory;
  number: string;
  scope: "national" | "town" | "regional";
  towns?: readonly string[];
  regions?: readonly Region[];
  source: string;
  note?: string;
}
const UK_HELP = "https://www.gov.uk/foreign-travel-advice/namibia/getting-help";
const UK_HEALTH = "https://www.gov.uk/foreign-travel-advice/namibia/health";
const METHEALTH = "https://www.methealth.com.na/emergency_numbers";
const RUNDU = "https://www.rundutown.com.na/emergency/";

/** Curated public contacts, not complete and NOT evidence of dispatch integration.
 * Re-verify on an agreed schedule with local providers before production. */
export const EMERGENCY_CONTACTS: readonly EmergencyContact[] = [
  { id: "national-112", name: "National emergency (mobile)", category: "Ambulance", number: "112", scope: "national", source: UK_HELP, note: "Ask the operator for the appropriate emergency service." },
  { id: "national-10111", name: "National police / emergency", category: "Police", number: "10111", scope: "national", source: UK_HELP, note: "Also listed as an ambulance request option outside Windhoek." },
  { id: "national-999", name: "Emergency number", category: "Ambulance", number: "999", scope: "national", source: UK_HELP, note: "Availability may depend on telephone network and device." },
  { id: "whk-fire", name: "City of Windhoek emergency services", category: "Fire & rescue", number: "061 211 111", scope: "town", towns: ["Windhoek"], regions: ["Khomas"], source: METHEALTH, note: "City emergency assistance and ambulance." },
  { id: "whk-ambulance", name: "Windhoek ambulance / emergency", category: "Ambulance", number: "061 211 111", scope: "town", towns: ["Windhoek"], regions: ["Khomas"], source: UK_HEALTH },
  { id: "rundu-fire", name: "Rundu fire and law enforcement", category: "Fire & rescue", number: "+264 81 239 9847", scope: "town", towns: ["Rundu"], regions: ["Kavango East"], source: RUNDU },
  { id: "rundu-hospital", name: "Rundu Hospital", category: "Hospital", number: "+264 66 265 500", scope: "town", towns: ["Rundu"], regions: ["Kavango East"], source: RUNDU, note: "Hospital contact, not guaranteed ambulance dispatch." },
  { id: "coast-code-red", name: "Code Red Medical Services", category: "Ambulance", number: "085 705 8940", scope: "regional", regions: ["Erongo"], towns: ["Swakopmund", "Walvis Bay", "Henties Bay", "Arandis"], source: METHEALTH, note: "Private provider, coverage and charges should be checked." },
  { id: "outapi-ambulance", name: "Outapi Ambulance", category: "Ambulance", number: "065 251 022", scope: "regional", regions: ["Omusati", "Oshana"], towns: ["Outapi", "Oshakati"], source: METHEALTH, note: "Provider coverage as listed by Methealth." },
  { id: "national-mva", name: "MVA Fund crash response", category: "Road accident", number: "081 9682", scope: "national", source: METHEALTH },
];
export function contactsFor(area: HomeArea): EmergencyContact[] {
  const matches = EMERGENCY_CONTACTS.filter(c => c.scope !== "national" && (
    (area.town && c.towns?.some(t => t.toLowerCase() === area.town.toLowerCase())) ||
    (area.region && c.regions?.includes(area.region))
  ));
  return [...matches, ...EMERGENCY_CONTACTS.filter(c => c.scope === "national")];
}
export function dialUri(number: string) {
  const normalized = number.replace(/[^\d+]/g, "");
  if (!/^\+?\d{3,15}$/.test(normalized)) throw new Error("Invalid contact number");
  return "tel:" + normalized;
}
