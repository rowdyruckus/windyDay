import { Plant, SiteInfo } from '../types';
import { PLANTS, getPlant } from './plants';
import { suitability } from './climate';
import {
  LatLng,
  metersToLatDelta,
  metersToLngDelta,
} from './geo';

export interface AutoPlacement {
  plantId: string;
  latitude: number;
  longitude: number;
}

/** Ray-casting point-in-polygon on lat/lng. */
function pointInPolygon(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].longitude;
    const yi = poly[i].latitude;
    const xj = poly[j].longitude;
    const yj = poly[j].latitude;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function suited(layer: Plant['layer'], site: SiteInfo): Plant[] {
  return PLANTS.filter((p) => p.layer === layer && suitability(p, site).ok);
}

/**
 * Build a small guild around a canopy tree: prefer its own listed companions
 * (filtered to what suits the site), then top up with reliable support plants
 * so every tree gets a diverse understory.
 */
function guildFor(canopy: Plant, site: SiteInfo): string[] {
  const picks: string[] = [];
  const add = (id?: string) => {
    if (id && !picks.includes(id) && picks.length < 3) picks.push(id);
  };
  for (const id of canopy.companions) {
    const p = getPlant(id);
    if (p && suitability(p, site).ok) add(id);
  }
  // Fallback support species (dynamic accumulator, N-fixer, alliums, nectary).
  for (const id of ['comfrey', 'clover', 'chives', 'yarrow', 'strawberry']) {
    const p = getPlant(id);
    if (p && suitability(p, site).ok) add(id);
  }
  return picks;
}

const MAX_CANOPY = 30; // keep the map responsive

/**
 * Auto-design a food forest inside `boundary`: a canopy grid spaced by mature
 * spread, a guild ring under each tree, and understory/shrubs on the offset
 * grid. Everything is filtered to the site's zone & sun.
 */
export function autoDesign(boundary: LatLng[], site: SiteInfo): AutoPlacement[] {
  if (boundary.length < 3) return [];

  const canopy = suited('canopy', site);
  const understory = suited('understory', site);
  const shrub = suited('shrub', site);
  const anchors = canopy.length > 0 ? canopy : understory;
  if (anchors.length === 0) return [];

  // Spacing from the widest anchor's mature spread, with a comfortable buffer.
  const maxSpread = Math.max(...anchors.map((p) => p.matureSpreadM));
  let spacing = Math.max(4, maxSpread + 1.5);

  // Bounding box of the boundary.
  const lats = boundary.map((p) => p.latitude);
  const lngs = boundary.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const midLat = (minLat + maxLat) / 2;

  // Grow spacing until the canopy count is reasonable for performance.
  function canopyNodes(step: number): LatLng[] {
    const dLat = metersToLatDelta(step);
    const dLng = metersToLngDelta(step, midLat);
    const nodes: LatLng[] = [];
    for (let lat = minLat + dLat / 2; lat < maxLat; lat += dLat) {
      for (let lng = minLng + dLng / 2; lng < maxLng; lng += dLng) {
        if (pointInPolygon(lat, lng, boundary)) nodes.push({ latitude: lat, longitude: lng });
      }
    }
    return nodes;
  }
  let nodes = canopyNodes(spacing);
  while (nodes.length > MAX_CANOPY) {
    spacing *= 1.25;
    nodes = canopyNodes(spacing);
  }

  const out: AutoPlacement[] = [];
  const dLat = metersToLatDelta(spacing);
  const dLng = metersToLngDelta(spacing, midLat);

  // 1) Canopy trees + a guild ring beneath each.
  nodes.forEach((node, i) => {
    const tree = anchors[i % anchors.length];
    out.push({ plantId: tree.id, latitude: node.latitude, longitude: node.longitude });

    const guild = guildFor(tree, site);
    const ringM = Math.max(1.2, tree.matureSpreadM * 0.4);
    const rLat = metersToLatDelta(ringM);
    const rLng = metersToLngDelta(ringM, midLat);
    guild.forEach((pid, k) => {
      const angle = (k / Math.max(1, guild.length)) * Math.PI * 2 + i;
      out.push({
        plantId: pid,
        latitude: node.latitude + rLat * Math.sin(angle),
        longitude: node.longitude + rLng * Math.cos(angle),
      });
    });
  });

  // 2) Understory / shrubs on the offset grid (between the canopy trees).
  const fillers = [...understory, ...shrub];
  if (fillers.length > 0) {
    let f = 0;
    for (let lat = minLat + dLat; lat < maxLat; lat += dLat) {
      for (let lng = minLng + dLng; lng < maxLng; lng += dLng) {
        if (pointInPolygon(lat, lng, boundary)) {
          const plant = fillers[f % fillers.length];
          f += 1;
          out.push({ plantId: plant.id, latitude: lat, longitude: lng });
        }
      }
    }
  }

  return out;
}
