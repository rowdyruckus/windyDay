import { Plant, SiteInfo, SunNeed } from '../types';

/**
 * Estimate a USDA hardiness zone from latitude.
 *
 * This is a deliberately simple heuristic for a design MVP: real hardiness is
 * driven by elevation, proximity to water, and local microclimate, not just
 * latitude. We surface the result as an *estimate* the user can override.
 *
 * The mapping is symmetric about the equator and tuned for temperate zones.
 */
export function estimateZoneFromLatitude(lat: number): number {
  const abs = Math.abs(lat);
  // Warmer near the equator, colder toward the poles.
  // ~zone 13 at the equator down to ~zone 2 near 68°+.
  let zone: number;
  if (abs < 10) zone = 12;
  else if (abs < 20) zone = 11;
  else if (abs < 27) zone = 10;
  else if (abs < 32) zone = 9;
  else if (abs < 37) zone = 8;
  else if (abs < 42) zone = 7;
  else if (abs < 46) zone = 6;
  else if (abs < 50) zone = 5;
  else if (abs < 55) zone = 4;
  else if (abs < 60) zone = 3;
  else zone = 2;
  return zone;
}

export function zoneLabel(zone: number | null): string {
  if (zone == null) return 'Zone unknown';
  return `USDA Zone ${zone}`;
}

/** Does this plant tolerate the given hardiness zone? */
export function toleratesZone(plant: Plant, zone: number | null): boolean {
  if (zone == null) return true;
  return zone >= plant.minZone && zone <= plant.maxZone;
}

/**
 * Does the site's light match what the plant needs?
 * A full-sun site suits everything; a shady site only suits shade-tolerant
 * plants. Partial sits in the middle.
 */
export function matchesSun(plant: Plant, siteSun: SunNeed): boolean {
  const rank: Record<SunNeed, number> = { shade: 0, partial: 1, full: 2 };
  // A plant is happy if the site offers at least as much light as it needs,
  // with full-sun plants also tolerating a step down to partial.
  if (plant.sun === 'shade') return true; // shade plants cope with more light
  if (plant.sun === 'partial') return rank[siteSun] >= 1;
  return rank[siteSun] >= 1; // full-sun plants still do okay in partial
}

export interface Suitability {
  ok: boolean;
  zoneOk: boolean;
  sunOk: boolean;
  reason: string;
}

/** Combined suitability of a plant for the current site. */
export function suitability(plant: Plant, site: SiteInfo): Suitability {
  const zoneOk = toleratesZone(plant, site.zone);
  const sunOk = matchesSun(plant, site.sun);
  let reason = 'Well suited to your site';
  if (!zoneOk && site.zone != null) {
    reason =
      site.zone < plant.minZone
        ? `Likely too cold (needs zone ${plant.minZone}+)`
        : `Likely too warm (best up to zone ${plant.maxZone})`;
  } else if (!sunOk) {
    reason = `Prefers more sun (${plant.sun})`;
  }
  return { ok: zoneOk && sunOk, zoneOk, sunOk, reason };
}
