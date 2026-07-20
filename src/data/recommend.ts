import { Plant, PlacedPlant, SiteInfo, ForestLayer } from '../types';
import { PLANTS, getPlant } from './plants';
import { suitability } from './climate';

export interface Recommendation {
  plant: Plant;
  reason: string;
}

/**
 * Suggests a few specific, site-suited plants that would most improve the
 * design — filling missing guild roles and forest layers. For an empty design
 * it leads with anchor trees to get started.
 */
export function recommendPlants(placed: PlacedPlant[], site: SiteInfo, limit = 3): Recommendation[] {
  const have = new Set(placed.map((p) => p.plantId));
  const suited = PLANTS.filter((p) => !have.has(p.id) && suitability(p, site).ok);
  const recs: Recommendation[] = [];
  const pushIf = (pred: (p: Plant) => boolean, reason: string) => {
    if (recs.length >= limit) return;
    const cand = suited.find((p) => pred(p) && !recs.some((r) => r.plant.id === p.id));
    if (cand) recs.push({ plant: cand, reason });
  };

  if (placed.length === 0) {
    pushIf((p) => p.layer === 'canopy', 'A tall anchor tree to start your forest');
    pushIf((p) => p.layer === 'understory', 'A smaller fruit tree for the mid-layer');
    pushIf((p) => p.layer === 'shrub' && p.edible, 'Berries you can pick by hand');
  } else {
    const layers = new Set<ForestLayer>();
    let nfix = 0;
    let medicinal = 0;
    for (const pp of placed) {
      const p = getPlant(pp.plantId);
      if (!p) continue;
      layers.add(p.layer);
      if (p.nitrogenFixer) nfix += 1;
      if (p.medicinal) medicinal += 1;
    }
    if (nfix === 0) pushIf((p) => p.nitrogenFixer, 'Feeds your soil — a nitrogen fixer');
    if (!layers.has('groundcover'))
      pushIf((p) => p.layer === 'groundcover', 'Shades & protects your soil');
    if (!layers.has('herbaceous')) pushIf((p) => p.layer === 'herbaceous', 'Fills the herb layer');
    if (medicinal === 0) pushIf((p) => p.medicinal, 'Adds a medicinal harvest');
    if (!layers.has('canopy')) pushIf((p) => p.layer === 'canopy', 'A tall canopy anchor tree');
    if (!layers.has('vine')) pushIf((p) => p.layer === 'vine', 'Uses your vertical space');
  }

  // Fill any remaining slots with suited variety not already chosen.
  for (const p of suited) {
    if (recs.length >= limit) break;
    if (!recs.some((r) => r.plant.id === p.id)) recs.push({ plant: p, reason: 'Thrives in your zone' });
  }
  return recs.slice(0, limit);
}
