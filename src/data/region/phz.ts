import * as Location from 'expo-location';

// USDA hardiness zone via phzmapi.org (frostline project). US ZIP only, so we
// reverse-geocode the coordinate on-device first. Returns null outside the US
// or when the ZIP isn't in the dataset — callers fall back to the climate-based
// estimate.

function parseZone(zoneStr: string): { zone: number; half: 'a' | 'b' } | null {
  const m = /^(\d{1,2})([ab])?$/.exec(zoneStr.trim());
  if (!m) return null;
  const zone = parseInt(m[1], 10);
  if (!Number.isFinite(zone)) return null;
  return { zone, half: (m[2] as 'a' | 'b') ?? 'a' };
}

async function fetchZoneByZip(
  zip: string,
  timeoutMs: number
): Promise<{ zone: number; half: 'a' | 'b' } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://phzmapi.org/${zip}.json`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (typeof json?.zone !== 'string') return null;
    return parseZone(json.zone);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUsHardinessZone(
  lat: number,
  lon: number,
  timeoutMs = 12000
): Promise<{ zone: number; half: 'a' | 'b' } | null> {
  let place: Location.LocationGeocodedAddress | undefined;
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });
    place = results[0];
  } catch {
    return null;
  }
  if (!place) return null;
  // Only the US dataset is supported by phzmapi.
  const country = place.isoCountryCode ?? place.country ?? '';
  const isUS = country === 'US' || country === 'USA' || /united states/i.test(country);
  if (!isUS || !place.postalCode) return null;

  const zip = place.postalCode.slice(0, 5);
  return fetchZoneByZip(zip, timeoutMs);
}
