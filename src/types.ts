// Core domain types for the food forest design app.

/**
 * The seven classic layers of a food forest / forest garden, from tallest to
 * lowest, plus the below-ground "root" layer. Used to organize plant
 * suggestions and to compose balanced guilds.
 */
export type ForestLayer =
  | 'canopy' // large fruit & nut trees (the tallest layer)
  | 'understory' // dwarf / semi-dwarf fruit trees
  | 'shrub' // berry bushes & medicinal shrubs
  | 'herbaceous' // herbs, perennial vegetables
  | 'groundcover' // low spreading plants that shade the soil
  | 'vine' // climbers that use vertical space
  | 'root'; // root crops & rhizosphere plants

export type SunNeed = 'full' | 'partial' | 'shade';

/** Rough season buckets used by the seasonal timeline. */
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface Plant {
  id: string;
  common: string;
  scientific: string;
  layer: ForestLayer;
  /** Short emoji used as a lightweight icon throughout the UI. */
  icon: string;
  edible: boolean;
  medicinal: boolean;
  /** Human-readable list of uses, e.g. "fruit", "leaf tea", "root tincture". */
  uses: string[];
  sun: SunNeed;
  /** Inclusive USDA hardiness zone range this plant tolerates. */
  minZone: number;
  maxZone: number;
  /** Mature dimensions in metres, used to size markers on the design canvas. */
  matureHeightM: number;
  matureSpreadM: number;
  /** Fixes atmospheric nitrogen — valuable support species in a guild. */
  nitrogenFixer: boolean;
  /** IDs of plants that pair well in a guild. */
  companions: string[];
  /** Months (1-12) when this plant is typically planted. */
  plantMonths: number[];
  /** Months (1-12) when this plant is typically harvested. */
  harvestMonths: number[];
  notes: string;
}

/** A plant that has been placed onto the design canvas. */
export interface PlacedPlant {
  /** Unique instance id (a plant can be placed many times). */
  instanceId: string;
  plantId: string;
  latitude: number;
  longitude: number;
}

/** Non-plant elements you can place — animals, water, structures. */
export type StructureType = 'coop' | 'beehive' | 'pond' | 'rainbarrel';

/** A structure (coop, beehive, pond, rain barrel) placed on the canvas. */
export interface PlacedStructure {
  instanceId: string;
  type: StructureType;
  latitude: number;
  longitude: number;
  /** Coop: number of birds, used to size the coop and its foraging run. */
  flockSize?: number;
  /** Pond/beehive: radius in metres of the water body or benefit zone. */
  radiusM?: number;
}

export interface SiteInfo {
  latitude: number | null;
  longitude: number | null;
  /** Estimated USDA hardiness zone (1-13). */
  zone: number | null;
  /** Whether the zone was auto-estimated or set manually by the user. */
  zoneSource: 'auto' | 'manual' | null;
  sun: SunNeed;
  label: string;
}
