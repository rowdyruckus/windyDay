// Central design tokens so screens share one visual language.
import { ForestLayer } from './types';

export const colors = {
  bg: '#0f1a12',
  surface: '#17251b',
  surfaceAlt: '#1f3327',
  border: '#2c4536',
  text: '#eef4ee',
  textMuted: '#9fb5a5',
  primary: '#5bbf6a',
  primaryDark: '#3d8b4a',
  accent: '#e0a94a',
  danger: '#d9705b',
  edible: '#7ac74f',
  medicinal: '#b98cd6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
};

/** Display metadata for each forest layer. */
export const LAYER_META: Record<
  ForestLayer,
  { label: string; short: string; color: string; order: number; blurb: string }
> = {
  canopy: {
    label: 'Canopy',
    short: 'Canopy',
    color: '#2f6b3a',
    order: 0,
    blurb: 'Tall fruit & nut trees forming the roof of the forest.',
  },
  understory: {
    label: 'Understory Trees',
    short: 'Understory',
    color: '#3f8248',
    order: 1,
    blurb: 'Dwarf & semi-dwarf fruit trees beneath the canopy.',
  },
  shrub: {
    label: 'Shrubs',
    short: 'Shrub',
    color: '#5bbf6a',
    order: 2,
    blurb: 'Berry bushes and medicinal shrubs.',
  },
  herbaceous: {
    label: 'Herbaceous',
    short: 'Herb',
    color: '#8dd17f',
    order: 3,
    blurb: 'Perennial herbs & vegetables that die back each year.',
  },
  groundcover: {
    label: 'Ground Cover',
    short: 'Ground',
    color: '#b6d99a',
    order: 4,
    blurb: 'Low spreaders that shade soil and suppress weeds.',
  },
  vine: {
    label: 'Vines',
    short: 'Vine',
    color: '#c9a24b',
    order: 5,
    blurb: 'Climbers that make use of vertical space.',
  },
  root: {
    label: 'Root Layer',
    short: 'Root',
    color: '#a9763f',
    order: 6,
    blurb: 'Root crops & rhizosphere plants working below ground.',
  },
};

export const LAYER_ORDER: ForestLayer[] = (
  Object.keys(LAYER_META) as ForestLayer[]
).sort((a, b) => LAYER_META[a].order - LAYER_META[b].order);
