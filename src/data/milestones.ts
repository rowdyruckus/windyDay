import { PlacedPlant, PlacedStructure, ForestLayer } from '../types';
import { getPlant } from './plants';
import { totalYieldKg } from './yield';

export interface Milestone {
  id: string;
  icon: string;
  title: string;
  detail: string;
  earned: boolean;
}

/** Gamified badges derived from the current design — earn them as you grow. */
export function milestones(
  placed: PlacedPlant[],
  structures: PlacedStructure[],
  invitesSent = 0
): Milestone[] {
  const species = new Set<string>();
  const layers = new Set<ForestLayer>();
  let trees = 0;
  let nfix = 0;
  let medicinal = 0;
  for (const pp of placed) {
    const p = getPlant(pp.plantId);
    if (!p) continue;
    species.add(p.id);
    layers.add(p.layer);
    if (p.layer === 'canopy' || p.layer === 'understory') trees += 1;
    if (p.nitrogenFixer) nfix += 1;
    if (p.medicinal) medicinal += 1;
  }
  const yieldKg = totalYieldKg(placed);

  return [
    { id: 'first-tree', icon: '🌳', title: 'First tree', detail: 'Plant a fruit or nut tree', earned: trees >= 1 },
    { id: 'diversity', icon: '🌈', title: 'Diversity', detail: 'Grow 5 species', earned: species.size >= 5 },
    { id: 'soil', icon: '🌱', title: 'Soil builder', detail: 'Add a nitrogen fixer', earned: nfix >= 1 },
    { id: 'apothecary', icon: '⚕️', title: 'Apothecary', detail: 'Grow a medicinal', earned: medicinal >= 1 },
    { id: 'layers', icon: '🏛️', title: 'Seven layers', detail: 'Fill all 7 layers', earned: layers.size >= 7 },
    { id: 'abundance', icon: '🧺', title: 'Abundance', detail: '100 kg/yr harvest', earned: yieldKg >= 100 },
    { id: 'system', icon: '🐔', title: 'Living system', detail: 'Add a coop, hive, pond or barrel', earned: structures.length >= 1 },
    { id: 'advocate', icon: '📣', title: 'Advocate', detail: 'Invite someone to grow their own', earned: invitesSent >= 1 },
  ];
}
