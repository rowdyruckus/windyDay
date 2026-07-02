import { StructureType } from '../types';

interface StructureMeta {
  label: string;
  short: string;
  icon: string;
  color: string;
  blurb: string;
  /** What this element gives back to the food forest. */
  benefits: string[];
  /** Coop only: flock sizing. */
  defaultFlock?: number;
  minFlock?: number;
  maxFlock?: number;
  /** Pond/beehive: default & bounds of the drawn benefit/water radius (m). */
  defaultRadiusM?: number;
  minRadiusM?: number;
  maxRadiusM?: number;
}

export const STRUCTURE_META: Record<StructureType, StructureMeta> = {
  coop: {
    label: 'Chicken Coop',
    short: 'Coop',
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
  beehive: {
    label: 'Beehive',
    short: 'Beehive',
    icon: '🐝',
    color: '#e6b800',
    blurb:
      'Honeybees pollinate your whole forest and reward you with honey and wax. Site it in morning sun, entrance away from paths.',
    benefits: [
      '🌸 Pollinates everything',
      '🍯 Honey',
      '🕯️ Beeswax',
      '🌼 Draws more forage',
    ],
    defaultRadiusM: 15,
    minRadiusM: 8,
    maxRadiusM: 40,
  },
  pond: {
    label: 'Pond',
    short: 'Pond',
    icon: '💧',
    color: '#4aa3d9',
    blurb:
      'Water is life — a pond stores irrigation, cools the air, and invites frogs, dragonflies and birds that keep pests in check.',
    benefits: [
      '💦 Irrigation store',
      '🐸 Habitat & pest control',
      '🦋 Draws wildlife',
      '🌡️ Cools the microclimate',
    ],
    defaultRadiusM: 4,
    minRadiusM: 1,
    maxRadiusM: 20,
  },
  rainbarrel: {
    label: 'Rain Barrel',
    short: 'Rain',
    icon: '🛢️',
    color: '#7f9bb0',
    blurb:
      'Catch roof runoff for free, chlorine-free irrigation — the simplest way to drought-proof your paradise.',
    benefits: ['🌧️ Harvests rainwater', '💧 Free irrigation', '♻️ Saves mains water'],
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

/** The circle radius (metres) to draw for a structure, or null for none. */
export function structureRadiusM(
  type: StructureType,
  flockSize?: number,
  radiusM?: number
): number | null {
  const meta = STRUCTURE_META[type];
  if (type === 'coop') return runRadiusForFlock(flockSize ?? meta.defaultFlock ?? 4);
  if (type === 'pond' || type === 'beehive')
    return radiusM ?? meta.defaultRadiusM ?? 8;
  return null; // rain barrel: a point element
}
