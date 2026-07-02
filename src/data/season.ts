import { Plant, Season } from '../types';
import { getPlant } from './plants';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function seasonForMonth(month: number): Season {
  // month is 1-12 (Northern Hemisphere)
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export const SEASON_META: Record<
  Season,
  { label: string; icon: string; blurb: string }
> = {
  spring: { label: 'Spring', icon: '🌱', blurb: 'Planting & blossom' },
  summer: { label: 'Summer', icon: '☀️', blurb: 'Growth & first fruit' },
  fall: { label: 'Autumn', icon: '🍂', blurb: 'Peak harvest & planting' },
  winter: { label: 'Winter', icon: '❄️', blurb: 'Rest & bare-root planting' },
};

/**
 * Given the plant ids present in a design, count how many are harvesting in
 * each month. The month with the most simultaneous harvests is the "peak
 * bounty" — the most glorious time of year we want to celebrate.
 */
export function harvestCountsByMonth(plantIds: string[]): number[] {
  const counts = new Array(12).fill(0);
  for (const id of plantIds) {
    const plant = getPlant(id);
    if (!plant) continue;
    for (const m of plant.harvestMonths) {
      // A plant harvesting every month (e.g. an evergreen herb) would swamp
      // the signal, so only count plants with a focused harvest window.
      if (plant.harvestMonths.length <= 6) counts[m - 1] += 1;
    }
  }
  return counts;
}

/** Returns the 1-12 month index of peak harvest, or a sensible default. */
export function peakBountyMonth(plantIds: string[]): number {
  const counts = harvestCountsByMonth(plantIds);
  let best = 0;
  let bestVal = -1;
  for (let i = 0; i < 12; i++) {
    if (counts[i] > bestVal) {
      bestVal = counts[i];
      best = i;
    }
  }
  // Default to late summer (August) when there's nothing planted yet — the
  // archetypal moment of abundance.
  if (bestVal <= 0) return 8;
  return best + 1;
}

/** Plants harvesting in a given month, for the peak-bounty highlight. */
export function plantsHarvestingIn(plantIds: string[], month: number): Plant[] {
  const seen = new Set<string>();
  const out: Plant[] = [];
  for (const id of plantIds) {
    if (seen.has(id)) continue;
    const plant = getPlant(id);
    if (plant && plant.harvestMonths.includes(month)) {
      seen.add(id);
      out.push(plant);
    }
  }
  return out;
}
