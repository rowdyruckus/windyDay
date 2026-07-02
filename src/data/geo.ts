import { Plant } from '../types';

export interface LatLng {
  latitude: number;
  longitude: number;
}

const M_PER_DEG_LAT = 111_320;

/** Metres → degrees of latitude. */
export function metersToLatDelta(m: number): number {
  return m / M_PER_DEG_LAT;
}

/** Metres → degrees of longitude at a given latitude. */
export function metersToLngDelta(m: number, atLat: number): number {
  const scale = Math.cos((atLat * Math.PI) / 180) || 1e-6;
  return m / (M_PER_DEG_LAT * scale);
}

/**
 * A square boundary of side `sideMeters` centred on a point — our first guess
 * at the property outline, which the user can then reshape.
 */
export function squareBoundary(center: LatLng, sideMeters: number): LatLng[] {
  const half = sideMeters / 2;
  const dLat = metersToLatDelta(half);
  const dLng = metersToLngDelta(half, center.latitude);
  return [
    { latitude: center.latitude + dLat, longitude: center.longitude - dLng },
    { latitude: center.latitude + dLat, longitude: center.longitude + dLng },
    { latitude: center.latitude - dLat, longitude: center.longitude + dLng },
    { latitude: center.latitude - dLat, longitude: center.longitude - dLng },
  ];
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Evenly space points around the closed perimeter of a polygon, roughly
 * `spacingMeters` apart — used to line a privacy hedge along the property edge.
 */
export function pointsAlongPerimeter(
  polygon: LatLng[],
  spacingMeters: number
): LatLng[] {
  if (polygon.length < 2) return [];
  const out: LatLng[] = [];
  const closed = [...polygon, polygon[0]];
  for (let i = 0; i < closed.length - 1; i++) {
    const start = closed[i];
    const end = closed[i + 1];
    const edgeLen = haversineMeters(start, end);
    const steps = Math.max(1, Math.round(edgeLen / spacingMeters));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  }
  return out;
}

/**
 * A plant is a good privacy screen if it's a tall shrub or understory tree —
 * dense enough to enclose a space. Derived so we don't have to hand-tag the
 * whole database.
 */
export function isScreeningPlant(p: Plant): boolean {
  if (p.layer === 'shrub') return p.matureHeightM >= 2;
  if (p.layer === 'understory') return p.matureHeightM >= 3;
  return false;
}
