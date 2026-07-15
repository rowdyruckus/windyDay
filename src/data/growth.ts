import { Plant } from '../types';
import { LatLng } from './geo';

// A simple growth model so we can visualise a young planting filling in over
// the years. Different layers mature at very different rates.

export function yearsToMature(plant: Plant): number {
  switch (plant.layer) {
    case 'canopy':
      return 15;
    case 'understory':
      return 9;
    case 'shrub':
      return 5;
    case 'vine':
      return 4;
    case 'herbaceous':
      return 2;
    case 'groundcover':
      return 1;
    case 'root':
      return 1;
    default:
      return 6;
  }
}

/** 0..1 fraction of mature size at a given age (fast early, easing to full). */
export function maturityFraction(plant: Plant, years: number): number {
  const ytm = yearsToMature(plant);
  const t = Math.min(1, Math.max(0, years) / ytm);
  const eased = 1 - (1 - t) * (1 - t); // ease-out
  return Math.max(0.06, eased); // keep saplings faintly visible
}

/** Canopy/spread radius in metres at a given age. */
export function radiusAtAge(plant: Plant, years: number): number {
  return Math.max(0.3, (plant.matureSpreadM / 2) * maturityFraction(plant, years));
}

export const MAX_YEARS = 25;

/**
 * True canopy coverage (%) of a property by a set of canopy circles, counting
 * overlaps once. Rasterises the boundary into a grid and tests each cell — so
 * overlapping crowns don't double-count like a naive area sum would.
 */
export function canopyCoveragePercent(
  boundary: LatLng[],
  circles: { latitude: number; longitude: number; radiusM: number }[]
): number {
  if (boundary.length < 3 || circles.length === 0) return 0;
  const MPD = 111320;
  const refLat = boundary[0].latitude;
  const cos = Math.cos((refLat * Math.PI) / 180) || 1e-6;
  const toX = (lng: number) => lng * MPD * cos;
  const toY = (lat: number) => lat * MPD;

  const px = boundary.map((p) => toX(p.longitude));
  const py = boundary.map((p) => toY(p.latitude));
  const cs = circles.map((c) => ({ x: toX(c.longitude), y: toY(c.latitude), r2: c.radiusM * c.radiusM }));

  const minX = Math.min(...px);
  const maxX = Math.max(...px);
  const minY = Math.min(...py);
  const maxY = Math.max(...py);
  const target = 2500;
  let step = Math.sqrt(((maxX - minX) * (maxY - minY)) / target);
  step = Math.max(0.5, step);

  const inPoly = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = px.length - 1; i < px.length; j = i++) {
      const intersect =
        py[i] > y !== py[j] > y && x < ((px[j] - px[i]) * (y - py[i])) / (py[j] - py[i]) + px[i];
      if (intersect) inside = !inside;
    }
    return inside;
  };

  let inside = 0;
  let covered = 0;
  for (let x = minX + step / 2; x < maxX; x += step) {
    for (let y = minY + step / 2; y < maxY; y += step) {
      if (!inPoly(x, y)) continue;
      inside += 1;
      for (const c of cs) {
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy <= c.r2) {
          covered += 1;
          break;
        }
      }
    }
  }
  return inside > 0 ? Math.round((covered / inside) * 100) : 0;
}
