import { Plant, PlacedPlant, ForestLayer } from '../types';
import { getPlant } from './plants';
import { yieldKgPerYear } from './yield';

// Rough retail value of home-grown organic produce (USD per kg), by the layer
// the yield comes from. Berries and fresh herbs are far pricier than tree
// fruit at the store, so growing them saves the most. Deliberately approximate.
const PRICE_PER_KG: Record<ForestLayer, number> = {
  canopy: 4, // tree fruit & nuts
  understory: 5, // dwarf fruit
  shrub: 12, // berries — expensive to buy
  vine: 6, // grapes, kiwi, passionfruit
  herbaceous: 20, // fresh culinary herbs
  groundcover: 14, // strawberries etc.
  root: 4,
};

/** Estimated grocery-bill value of one plant's yearly harvest (USD). */
export function dollarsPerYear(plant: Plant): number {
  const kg = yieldKgPerYear(plant);
  if (kg <= 0) return 0;
  return kg * (PRICE_PER_KG[plant.layer] ?? 5);
}

/** Estimated total yearly grocery savings for a placed design (USD). */
export function totalDollarsPerYear(placed: PlacedPlant[]): number {
  let sum = 0;
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (p) sum += dollarsPerYear(p);
  }
  return Math.round(sum);
}

export function formatMoney(usd: number): string {
  if (usd >= 1000) return `$${(Math.round(usd / 100) / 10).toFixed(1)}k`;
  return `$${Math.round(usd)}`;
}
