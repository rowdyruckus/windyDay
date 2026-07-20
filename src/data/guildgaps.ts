import { PlacedPlant } from '../types';
import { getPlant } from './plants';
import { isPollinatorPlant } from './pollinators';

// A support species within this distance of a tree counts as part of its guild.
const ROLE_RADIUS_M = 6;

export interface GuildGap {
  instanceId: string;
  name: string;
  icon: string;
  missing: string[];
}

export interface GuildGapReport {
  treeCount: number;
  missingNfix: number;
  missingGround: number;
  missingPollinator: number;
  /** A few named trees with gaps, for a friendly nudge. */
  worst: GuildGap[];
}

function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (bLat - aLat) * 111320;
  const dLng = (bLng - aLng) * 111320 * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * For every fruit/nut tree, check whether it has the key guild support roles
 * planted close by: a nitrogen fixer to feed it, a ground cover to protect the
 * soil, and something flowering to draw pollinators for fruit set.
 */
export function findGuildGaps(placed: PlacedPlant[]): GuildGapReport {
  const trees = placed.filter((pp) => {
    const p = getPlant(pp.plantId);
    return p && (p.layer === 'canopy' || p.layer === 'understory');
  });

  let missingNfix = 0;
  let missingGround = 0;
  let missingPollinator = 0;
  const gaps: GuildGap[] = [];

  for (const t of trees) {
    const tp = getPlant(t.plantId)!;
    let nfix = false;
    let ground = false;
    let pollinator = false;
    for (const other of placed) {
      if (other.instanceId === t.instanceId) continue;
      const op = getPlant(other.plantId);
      if (!op) continue;
      if (metersBetween(t.latitude, t.longitude, other.latitude, other.longitude) > ROLE_RADIUS_M)
        continue;
      if (op.nitrogenFixer) nfix = true;
      if (op.layer === 'groundcover') ground = true;
      if (op.layer !== 'canopy' && op.layer !== 'understory' && isPollinatorPlant(op))
        pollinator = true;
    }
    const missing: string[] = [];
    if (!nfix) {
      missing.push('nitrogen fixer');
      missingNfix += 1;
    }
    if (!ground) {
      missing.push('ground cover');
      missingGround += 1;
    }
    if (!pollinator) {
      missing.push('pollinator plant');
      missingPollinator += 1;
    }
    if (missing.length) gaps.push({ instanceId: t.instanceId, name: tp.common, icon: tp.icon, missing });
  }

  // Name a few trees, worst (most gaps) first, de-duplicated by species.
  const bySpecies = new Map<string, GuildGap>();
  for (const g of gaps) {
    const key = g.name;
    const prev = bySpecies.get(key);
    if (!prev || g.missing.length > prev.missing.length) bySpecies.set(key, g);
  }
  const worst = Array.from(bySpecies.values())
    .sort((a, b) => b.missing.length - a.missing.length)
    .slice(0, 3);

  return { treeCount: trees.length, missingNfix, missingGround, missingPollinator, worst };
}
