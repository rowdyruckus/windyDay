import { StructureType } from '../types';

interface StructureMeta {
  label: string;
  icon: string;
  color: string;
  blurb: string;
  /** What this element gives back to the food forest. */
  benefits: string[];
  defaultFlock: number;
  minFlock: number;
  maxFlock: number;
}

export const STRUCTURE_META: Record<StructureType, StructureMeta> = {
  coop: {
    label: 'Chicken Coop',
    icon: '🐔',
    color: '#d98a4a',
    blurb:
      'A small flock closes the loop in your forest — eggs for you, pest patrol, fertilizer and gentle tilling.',
    benefits: [
      '🥚 Fresh eggs',
      '🐛 Eats pests & fallen fruit',
      '💩 Rich fertilizer',
      '🍂 Scratches & tills mulch',
    ],
    defaultFlock: 4,
    minFlock: 2,
    maxFlock: 20,
  },
};

/**
 * Recommended foraging-run radius (metres) for a flock. Rule of thumb: give
 * hens generous room to range — roughly 3 m² per bird, expressed as a radius,
 * with a comfortable minimum.
 */
export function runRadiusForFlock(flockSize: number): number {
  const areaPerBird = 3; // m² of run per bird
  const area = Math.max(12, flockSize * areaPerBird);
  return Math.sqrt(area / Math.PI);
}

/** The coop footprint scales gently with flock size. */
export function coopFootprintM(flockSize: number): number {
  return Math.max(1.2, Math.min(3, 0.9 + flockSize * 0.12));
}
