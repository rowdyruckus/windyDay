import { Plant } from '../types';

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
