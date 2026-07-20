import { Plant, PlacedPlant, ForestLayer } from '../types';
import { getPlant } from './plants';

// Very rough CO2 drawn down per plant per year (kg CO2/yr) once established.
// Woody trees dominate; small layers store little but a full forest adds up.
const CO2_PER_YEAR: Record<ForestLayer, number> = {
  canopy: 22,
  understory: 10,
  shrub: 3,
  vine: 2,
  herbaceous: 0.5,
  groundcover: 0.3,
  root: 0.3,
};

export function co2KgPerYear(plant: Plant): number {
  const base = CO2_PER_YEAR[plant.layer];
  // Taller specimens lay down more wood; scale gently around a 5 m reference.
  const scale = Math.max(0.5, Math.min(2, plant.matureHeightM / 5));
  return base * scale;
}

/** Total CO2 a placed design draws down each year at maturity (kg). */
export function totalCo2KgPerYear(placed: PlacedPlant[]): number {
  let sum = 0;
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (p) sum += co2KgPerYear(p);
  }
  return Math.round(sum);
}

/**
 * Relatable framing: roughly how many km of driving that CO2 offsets.
 * A typical car emits ~0.12 kg CO2 per km.
 */
export function carEquivalentKm(co2Kg: number): number {
  return Math.round(co2Kg / 0.12);
}

export function formatCo2(kg: number): string {
  if (kg >= 1000) return `${(Math.round(kg / 100) / 10).toFixed(1)}t`;
  return `${Math.round(kg)} kg`;
}
