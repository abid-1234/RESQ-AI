import { HazardType, SeverityLevel } from "../types";

export type IndiaHazardSeed = {
  id: string;
  center: [number, number]; // [lat, lng]
  hazard: HazardType;
  severity: SeverityLevel;
  radiusM: number;
  source: "GPS_LIVE" | "SYNTHETIC_DEMO";
  confidence: number;
  label: string;
  state: string;
};

export const RED_ZONE_COUNT = 7;

export const indiaHazardSeeds: IndiaHazardSeed[] = [
  { id: "hz-gps",      center: [17.3765, 78.4795], hazard: "FLOOD",          severity: "LEVEL_4_CRITICAL",      radiusM: 1400, source: "SYNTHETIC_DEMO", confidence: 0.88, label: "Sector 4 · Musi flood",     state: "Telangana" },
  { id: "hz-uk-01",    center: [30.32,  79.03],   hazard: "LANDSLIDE",      severity: "LEVEL_5_MASS_EMERGENCY",radiusM: 2200, source: "SYNTHETIC_DEMO", confidence: 0.91, label: "Chamoli landslide",         state: "Uttarakhand" },
  { id: "hz-as-01",    center: [26.20,  92.90],   hazard: "FLOOD",          severity: "LEVEL_4_CRITICAL",      radiusM: 2600, source: "SYNTHETIC_DEMO", confidence: 0.89, label: "Brahmaputra overflow",     state: "Assam" },
  { id: "hz-mh-01",    center: [19.07,  72.87],   hazard: "COASTAL_SURGE",  severity: "LEVEL_3_WARNING",       radiusM: 1800, source: "SYNTHETIC_DEMO", confidence: 0.76, label: "Mumbai coastal surge",     state: "Maharashtra" },
  { id: "hz-tn-01",    center: [13.08,  80.27],   hazard: "CYCLONE",        severity: "LEVEL_4_CRITICAL",      radiusM: 2400, source: "SYNTHETIC_DEMO", confidence: 0.84, label: "Chennai cyclone",          state: "Tamil Nadu" },
  { id: "hz-gj-01",    center: [23.22,  69.67],   hazard: "SEISMIC_ANOMALY",severity: "LEVEL_3_WARNING",       radiusM: 2000, source: "SYNTHETIC_DEMO", confidence: 0.78, label: "Kutch seismic",            state: "Gujarat" },
  { id: "hz-kl-01",    center: [10.85,  76.27],   hazard: "CLOUDBURST",     severity: "LEVEL_4_CRITICAL",      radiusM: 1600, source: "SYNTHETIC_DEMO", confidence: 0.86, label: "Idukki cloudburst",        state: "Kerala" },
  { id: "hz-hp-01",    center: [31.10,  77.17],   hazard: "LANDSLIDE",      severity: "LEVEL_3_WARNING",       radiusM: 1500, source: "SYNTHETIC_DEMO", confidence: 0.74, label: "Kinnaur slide",            state: "Himachal" },
  { id: "hz-rj-01",    center: [26.91,  75.79],   hazard: "FLOOD",          severity: "LEVEL_3_WARNING",       radiusM: 1300, source: "SYNTHETIC_DEMO", confidence: 0.72, label: "Jaipur urban flood",       state: "Rajasthan" },
  { id: "hz-od-01",    center: [20.27,  85.84],   hazard: "CYCLONE",        severity: "LEVEL_3_WARNING",       radiusM: 2100, source: "SYNTHETIC_DEMO", confidence: 0.79, label: "Puri landfall",            state: "Odisha" },
  { id: "hz-br-01",    center: [25.59,  85.13],   hazard: "FLOOD",          severity: "LEVEL_4_CRITICAL",      radiusM: 2300, source: "SYNTHETIC_DEMO", confidence: 0.87, label: "Patna Kosi flood",         state: "Bihar" },
  { id: "hz-mp-01",    center: [23.26,  77.41],   hazard: "FLOOD",          severity: "LEVEL_2_WATCH",         radiusM: 1100, source: "SYNTHETIC_DEMO", confidence: 0.68, label: "Bhopal lake breach",       state: "Madhya Pradesh" },
  { id: "hz-ka-01",    center: [12.97,  77.59],   hazard: "URBAN_FLOOD",    severity: "LEVEL_3_WARNING",       radiusM: 1400, source: "SYNTHETIC_DEMO", confidence: 0.75, label: "Bengaluru urban flood",    state: "Karnataka" },
  { id: "hz-pb-01",    center: [30.90,  75.85],   hazard: "FLOOD",          severity: "LEVEL_3_WARNING",       radiusM: 1250, source: "SYNTHETIC_DEMO", confidence: 0.73, label: "Ludhiana Sutlej rise",     state: "Punjab" },
  { id: "hz-dl-01",    center: [28.61,  77.20],   hazard: "URBAN_FLOOD",    severity: "LEVEL_4_CRITICAL",      radiusM: 1750, source: "SYNTHETIC_DEMO", confidence: 0.82, label: "Yamuna overflow",          state: "Delhi" },
  { id: "hz-wb-01",    center: [22.57,  88.36],   hazard: "CYCLONE",        severity: "LEVEL_3_WARNING",       radiusM: 1900, source: "SYNTHETIC_DEMO", confidence: 0.77, label: "Sundarbans surge",         state: "West Bengal" },
];

// Overwrite first entry with live GPS fix when available. Returns a new array.
export function withGpsFix(seeds: IndiaHazardSeed[], lat: number, lng: number, accuracyM: number): IndiaHazardSeed[] {
  if (!seeds.length) return seeds;
  const clone = [...seeds];
  clone[0] = {
    ...clone[0],
    center: [lat, lng],
    source: "GPS_LIVE" as const,
    confidence: Math.max(0.92, clone[0].confidence),
    label: `LIVE GPS · ±${Math.round(accuracyM)} m`,
  };
  return clone;
}
