import { RegionProfile, SpeciesLite } from './types';
import { fetchClimateNormals } from './openMeteo';
import { fetchUsHardinessZone } from './phz';
import {
  fetchLocalButterflies,
  fetchLocalBirds,
  fetchLocalNativePlants,
} from './inaturalist';
import { classifyKoppen } from './koppen';
import { estimateZoneFromLatitude } from '../climate';

export * from './types';

function settledValue<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === 'fulfilled' ? r.value : null;
}
function settledArray<T>(r: PromiseSettledResult<T[]>): T[] {
  return r.status === 'fulfilled' ? r.value : [];
}

/**
 * Resolve everything we can infer about a site from its coordinates, calling
 * all live sources in parallel and degrading gracefully: if the network is
 * down or a source fails, we still return a usable profile built from whatever
 * succeeded, falling back to a latitude-based hardiness estimate.
 */
export async function resolveRegionProfile(
  lat: number,
  lon: number,
  month: number
): Promise<RegionProfile> {
  const [climateR, usZoneR, butterfliesR, birdsR, plantsR] =
    await Promise.allSettled([
      fetchClimateNormals(lat, lon),
      fetchUsHardinessZone(lat, lon),
      fetchLocalButterflies(lat, lon, month),
      fetchLocalBirds(lat, lon),
      fetchLocalNativePlants(lat, lon),
    ]);

  const climate = settledValue(climateR);
  const usZone = settledValue(usZoneR);
  const butterflies: SpeciesLite[] = settledArray(butterfliesR);
  const birds: SpeciesLite[] = settledArray(birdsR);
  const nativePlants: SpeciesLite[] = settledArray(plantsR);

  const sources: string[] = [];

  // Hardiness zone: latitude estimate → climate → US ZIP (best last).
  let zone: number | null = estimateZoneFromLatitude(lat);
  let zoneHalf: 'a' | 'b' | null = null;
  let zoneSource: RegionProfile['zoneSource'] = 'latitude';

  if (climate) {
    sources.push('Open-Meteo');
    zone = climate.zone;
    zoneHalf = climate.zoneHalf;
    zoneSource = 'open-meteo';
  }
  if (usZone) {
    sources.push('USDA phzmapi');
    zone = usZone.zone;
    zoneHalf = usZone.half;
    zoneSource = 'phzmapi';
  }

  const koppen = climate
    ? classifyKoppen(climate.monthlyTempC, climate.monthlyPrecipMm, lat)
    : null;

  if (butterflies.length || birds.length || nativePlants.length) {
    sources.push('iNaturalist');
  }

  return {
    latitude: lat,
    longitude: lon,
    resolvedAt: Date.now(),
    zone,
    zoneHalf,
    zoneSource,
    annualMinTempC: climate?.annualMinTempC ?? null,
    growingSeasonDays: climate?.growingSeasonDays ?? null,
    annualPrecipMm: climate
      ? Math.round(climate.monthlyPrecipMm.reduce((a, b) => a + b, 0))
      : null,
    koppen,
    butterflies,
    birds,
    nativePlants,
    sources,
  };
}

const STALE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Is a cached profile still good for these coordinates? (~1 km tolerance). */
export function isProfileFresh(
  profile: RegionProfile | null,
  lat: number,
  lon: number
): boolean {
  if (!profile) return false;
  const near =
    Math.abs(profile.latitude - lat) < 0.01 &&
    Math.abs(profile.longitude - lon) < 0.01;
  const fresh = Date.now() - profile.resolvedAt < STALE_MS;
  return near && fresh;
}

/**
 * Match our curated plant database against the locally-observed native plant
 * list by genus (the first word of the scientific name), returning the set of
 * our plant ids that appear to be native/observed nearby.
 */
export function nativePlantGenera(profile: RegionProfile | null): Set<string> {
  const genera = new Set<string>();
  if (!profile) return genera;
  for (const sp of profile.nativePlants) {
    const genus = sp.name.split(' ')[0]?.toLowerCase();
    if (genus) genera.add(genus);
  }
  return genera;
}
