import { PlacedPlant } from '../types';
import { getPlant } from './plants';
import { ForestLayer } from '../types';

export interface ParadiseScore {
  score: number; // 0-100
  label: string;
  species: number;
  layers: number;
}

/**
 * A light permaculture "health" score for a design: rewards species diversity,
 * filling the vertical layers, enough nitrogen fixers for the trees, and a mix
 * of edible + medicinal yields.
 */
export function paradiseScore(placed: PlacedPlant[]): ParadiseScore {
  const species = new Set<string>();
  const layers = new Set<ForestLayer>();
  let trees = 0;
  let nfix = 0;
  let edible = 0;
  let medicinal = 0;
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (!p) continue;
    species.add(p.id);
    layers.add(p.layer);
    if (p.layer === 'canopy' || p.layer === 'understory') trees += 1;
    if (p.nitrogenFixer) nfix += 1;
    if (p.edible) edible += 1;
    if (p.medicinal) medicinal += 1;
  }

  const diversity = Math.min(1, species.size / 12) * 25;
  const layerScore = (layers.size / 7) * 25;
  const nTarget = Math.max(1, trees / 3);
  const nitrogen = Math.min(1, nfix / nTarget) * 20;
  const yieldMix = (edible > 0 ? 8 : 0) + (medicinal > 0 ? 7 : 0);
  const understory =
    (Math.min(1, (layers.has('groundcover') ? 1 : 0) + (layers.has('herbaceous') ? 1 : 0)) / 1) * 15;

  const score = Math.round(diversity + layerScore + nitrogen + yieldMix + understory);
  const label =
    score >= 80 ? 'Paradise 🌟' : score >= 60 ? 'Thriving' : score >= 40 ? 'Growing' : 'Getting started';

  return { score, label, species: species.size, layers: layers.size };
}
