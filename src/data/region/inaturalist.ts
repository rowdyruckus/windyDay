import { SpeciesLite } from './types';

// iNaturalist species-counts client — the real life observed near a location.
// No auth required for reads. We keep queries modest and cache upstream.
// Docs: https://api.inaturalist.org

const BASE = 'https://api.inaturalist.org/v1/observations/species_counts';

// iNaturalist taxon ids
const TAXON_BUTTERFLIES = 47224; // Papilionoidea (true butterflies)

interface SpeciesQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  iconicTaxa?: string; // e.g. 'Aves', 'Plantae'
  taxonId?: number;
  native?: boolean;
  month?: number; // 1-12, for seasonality
  perPage?: number;
}

async function fetchSpecies(
  q: SpeciesQuery,
  timeoutMs = 12000
): Promise<SpeciesLite[]> {
  const params = new URLSearchParams({
    lat: q.lat.toFixed(4),
    lng: q.lng.toFixed(4),
    radius: String(q.radiusKm ?? 50),
    quality_grade: 'research',
    captive: 'false',
    per_page: String(q.perPage ?? 8),
    locale: 'en',
  });
  if (q.iconicTaxa) params.set('iconic_taxa', q.iconicTaxa);
  if (q.taxonId) params.set('taxon_id', String(q.taxonId));
  if (q.native) params.set('native', 'true');
  if (q.month) params.set('month', String(q.month));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LetsPlantParadise/1.0 (food forest design app)',
      },
    });
    if (!res.ok) return [];
    const json: any = await res.json();
    const results: any[] = json?.results ?? [];
    return results
      .map((r): SpeciesLite | null => {
        const taxon = r?.taxon;
        if (!taxon?.id || !taxon?.name) return null;
        return {
          id: taxon.id,
          name: taxon.name,
          common: taxon.preferred_common_name ?? null,
          photo: taxon.default_photo?.square_url ?? null,
          count: r.count ?? 0,
          url: `https://www.inaturalist.org/taxa/${taxon.id}`,
        };
      })
      .filter((s): s is SpeciesLite => s !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export function fetchLocalButterflies(
  lat: number,
  lng: number,
  month?: number
): Promise<SpeciesLite[]> {
  return fetchSpecies({
    lat,
    lng,
    taxonId: TAXON_BUTTERFLIES,
    month,
    perPage: 8,
  });
}

export function fetchLocalBirds(
  lat: number,
  lng: number
): Promise<SpeciesLite[]> {
  return fetchSpecies({ lat, lng, iconicTaxa: 'Aves', perPage: 8 });
}

export function fetchLocalNativePlants(
  lat: number,
  lng: number
): Promise<SpeciesLite[]> {
  return fetchSpecies({
    lat,
    lng,
    iconicTaxa: 'Plantae',
    native: true,
    perPage: 50,
  });
}
