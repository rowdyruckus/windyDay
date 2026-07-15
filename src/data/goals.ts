import { Plant } from '../types';
import { isScreeningPlant } from './geo';

export type Goal = 'food' | 'medicine' | 'wildlife' | 'privacy' | 'beauty';

export const GOALS: { key: Goal; label: string; icon: string; blurb: string }[] = [
  { key: 'food', label: 'Food', icon: '🍎', blurb: 'Fruit, nuts & perennial veg' },
  { key: 'medicine', label: 'Medicine', icon: '⚕️', blurb: 'Herbal & healing plants' },
  { key: 'wildlife', label: 'Wildlife', icon: '🦋', blurb: 'Pollinators & habitat' },
  { key: 'privacy', label: 'Privacy', icon: '🌳', blurb: 'Screening & windbreak' },
  { key: 'beauty', label: 'Beauty', icon: '🌸', blurb: 'Blossom & fragrance' },
];

const FLOWER_WORDS = ['flower', 'petal', 'pollinator', 'nectary', 'blossom'];

/** Rough check whether a plant serves a given goal. */
export function plantMatchesGoal(plant: Plant, goal: Goal): boolean {
  const uses = plant.uses.join(' ').toLowerCase();
  switch (goal) {
    case 'food':
      return plant.edible;
    case 'medicine':
      return plant.medicinal;
    case 'privacy':
      return isScreeningPlant(plant);
    case 'wildlife':
      return (
        plant.nitrogenFixer === false &&
        (FLOWER_WORDS.some((w) => uses.includes(w)) ||
          uses.includes('berry') ||
          plant.medicinal)
      );
    case 'beauty':
      return FLOWER_WORDS.some((w) => uses.includes(w)) || plant.icon === '🌸' || plant.icon === '🌹';
    default:
      return false;
  }
}

/** How many of the chosen goals this plant serves (for ranking). */
export function goalScore(plant: Plant, goals: Goal[]): number {
  return goals.reduce((n, g) => n + (plantMatchesGoal(plant, g) ? 1 : 0), 0);
}
