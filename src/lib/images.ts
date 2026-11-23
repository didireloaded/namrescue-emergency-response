import windhoek from "@/assets/windhoek_skyline.jpg.asset.json";
import nightLights from "@/assets/ambulance_night_lights.jpg.asset.json";
import portrait from "@/assets/paramedic_portrait.jpg.asset.json";
import driver from "@/assets/paramedic_driver.jpg.asset.json";
import ambSide from "@/assets/ambulance_side.jpg.asset.json";
import rearOpen from "@/assets/ambulance_rear_open.jpg.asset.json";

export const IMG = {
  windhoek: windhoek.url,
  nightLights: nightLights.url,
  portrait: portrait.url,
  driver: driver.url,
  ambSide: ambSide.url,
  rearOpen: rearOpen.url,
};

export const CREDITS = [
  { what: "Windhoek skyline", who: "Bries, Wikimedia Commons", license: "CC BY-SA 2.5", href: "https://commons.wikimedia.org/wiki/File:Windhoek-Skyline.jpg" },
  { what: "Ambulance at night", who: "Th2city Santana, Pexels", license: "Pexels License", href: "https://www.pexels.com/photo/5458450/" },
  { what: "Paramedic photos", who: "RDNE Stock project, Pexels", license: "Pexels License", href: "https://www.pexels.com/photo/6519932/" },
];
