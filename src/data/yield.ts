import { Plant, PlacedPlant, ForestLayer } from '../types';
import { getPlant } from './plants';

// Rough annual food yield at maturity (kg/yr). Deliberately approximate —
// enough to compare designs and inspire, not a farm plan.
const BASE: Record<ForestLayer, number> = {
  canopy: 45,
  understory: 18,
  shrub: 4,
  vine: 7,
  herbaceous: 1,
  groundcover: 0.5,
  root: 2,
};

export function yieldKgPerYear(plant: Plant): number {
  if (!plant.edible) return 0;
  // Scale a little by mature spread relative to a typical size for the layer.
  const typical: Record<ForestLayer, number> = {
    canopy: 5,
    understory: 4,
    shrub: 1.3,
    vine: 3,
    herbaceous: 0.6,
    groundcover: 0.4,
    root: 0.3,
  };
  const scale = Math.max(0.4, Math.min(2, plant.matureSpreadM / typical[plant.layer]));
  return BASE[plant.layer] * scale;
}

/** Total yearly harvest (kg) for a placed design at maturity. */
export function totalYieldKg(placed: PlacedPlant[]): number {
  let sum = 0;
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (p) sum += yieldKgPerYear(p);
  }
  return Math.round(sum);
}

export function formatYield(kg: number, imperial: boolean): string {
  if (imperial) {
    const lb = kg * 2.20462;
    return lb >= 1000 ? `${Math.round(lb / 100) / 10}k lb` : `${Math.round(lb)} lb`;
  }
  return kg >= 1000 ? `${Math.round(kg / 100) / 10}k kg` : `${Math.round(kg)} kg`;
}
