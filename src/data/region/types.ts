// Types for the region intelligence layer — the data we infer about a site
// from its coordinates using live sources (Open-Meteo, phzmapi, iNaturalist)
// with graceful fallback to offline heuristics.

export interface SpeciesLite {
  id: number;
  /** Scientific name. */
  name: string;
  /** Preferred common name, if any. */
  common: string | null;
  /** Square thumbnail URL, if any. */
  photo: string | null;
  /** How many observations near the site (popularity proxy). */
  count: number;
  /** iNaturalist taxon page for attribution / details. */
  url: string;
}

export type ZoneSource = 'phzmapi' | 'open-meteo' | 'latitude';

export interface KoppenResult {
  /** Köppen-Geiger code, e.g. "Csb". */
  code: string;
  /** Friendly biome label, e.g. "Warm-summer Mediterranean". */
  label: string;
  /** A short evocative descriptor for the site. */
  blurb: string;
}

export interface RegionProfile {
  latitude: number;
  longitude: number;
  /** Epoch ms when this profile was resolved (for cache freshness). */
  resolvedAt: number;

  zone: number | null; // USDA hardiness zone (1-13)
  zoneHalf: 'a' | 'b' | null;
  zoneSource: ZoneSource;

  /** Average annual extreme minimum temperature in °C (hardiness basis). */
  annualMinTempC: number | null;
  /** Estimated frost-free growing-season length in days. */
  growingSeasonDays: number | null;
  /** Average total annual precipitation in mm. */
  annualPrecipMm: number | null;
  /** Average day-of-year of last spring / first fall frost. */
  lastSpringFrostDoy: number | null;
  firstFallFrostDoy: number | null;

  koppen: KoppenResult | null;

  /** Real local life, from iNaturalist observations near the site. */
  butterflies: SpeciesLite[];
  birds: SpeciesLite[];
  /** Scientific names of native plants observed nearby (for matching). */
  nativePlants: SpeciesLite[];

  /** Which sources actually succeeded, for transparency in the UI. */
  sources: string[];
}
