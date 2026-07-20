import { Plant, PlacedPlant } from '../types';
import { getPlant } from './plants';
import { MONTHS } from './season';

// When each plant is in flower — the months that matter to bees & butterflies.
// For plants whose flowers are the point (herbs, medicinals) we set the window
// explicitly; for fruiting plants we infer bloom as ~2 months before harvest.
const BLOOM_OVERRIDE: Record<string, number[]> = {
  rosemary: [3, 4, 5, 10],
  lavender: [6, 7, 8],
  yarrow: [6, 7, 8, 9],
  comfrey: [5, 6, 7],
  chives: [5, 6],
  echinacea: [7, 8, 9],
  borage: [6, 7, 8, 9],
  thyme: [6, 7],
  oregano: [7, 8],
  mint: [7, 8],
  dandelion: [4, 5, 9],
  clover: [5, 6, 7, 8, 9],
  goldenrod: [8, 9, 10],
  aster: [9, 10],
};

/** Months (1-12) this plant is in flower and offering forage. */
export function bloomMonths(plant: Plant): number[] {
  if (BLOOM_OVERRIDE[plant.id]) return BLOOM_OVERRIDE[plant.id];
  if (plant.harvestMonths.length > 0) {
    const set = new Set<number>();
    for (const h of plant.harvestMonths) {
      let m = h - 2;
      if (m < 1) m += 12;
      set.add(m);
    }
    return Array.from(set).sort((a, b) => a - b);
  }
  // Leafy / unknown: assume a broad summer bloom.
  return [5, 6, 7];
}

export function isPollinatorPlant(plant: Plant): boolean {
  return bloomMonths(plant).length > 0;
}

/** Compact label like "Apr–May" or "Jun, Aug" for a bloom window. */
export function bloomLabel(plant: Plant): string {
  const m = bloomMonths(plant);
  if (m.length === 0) return '—';
  // Detect a single contiguous run for a nice "X–Y" label.
  const sorted = [...m].sort((a, b) => a - b);
  const contiguous = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 1)
    return `${MONTHS[sorted[0] - 1]}–${MONTHS[sorted[sorted.length - 1] - 1]}`;
  return sorted.map((x) => MONTHS[x - 1]).join(', ');
}

export interface PollinatorReport {
  bloomByMonth: number[]; // species blooming each month, index 0 = Jan
  coverage: number; // fraction of growing-season months with some bloom
  gaps: number[]; // growing-season months (1-12) with no forage
  score: number; // 0-100 bee score
}

/**
 * How well a design feeds pollinators across the year. `frostFreeMonths` limits
 * the assessment to the local growing season when known.
 */
export function pollinatorReport(
  placed: PlacedPlant[],
  frostFreeMonths?: number[]
): PollinatorReport {
  const bloomByMonth = new Array(12).fill(0);
  const seen = new Set<string>();
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    for (const m of bloomMonths(p)) bloomByMonth[m - 1] += 1;
  }
  const months =
    frostFreeMonths && frostFreeMonths.length ? frostFreeMonths : [3, 4, 5, 6, 7, 8, 9, 10];
  const covered = months.filter((m) => bloomByMonth[m - 1] > 0).length;
  const coverage = months.length ? covered / months.length : 0;
  const gaps = months.filter((m) => bloomByMonth[m - 1] === 0);
  return { bloomByMonth, coverage, gaps, score: Math.round(coverage * 100) };
}
