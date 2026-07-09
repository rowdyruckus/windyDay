import { Plant, SiteInfo } from '../types';
import { PLANTS, getPlant } from './plants';
import { suitability } from './climate';
import { LatLng, isScreeningPlant } from './geo';

export interface AutoPlacement {
  plantId: string;
  latitude: number;
  longitude: number;
}

// --- Local ENU (metres) plane so all geometry is done in metres -------------

interface XY {
  x: number;
  y: number;
}

const M_PER_DEG = 111_320;

function makeProjection(ref: LatLng) {
  const cosLat = Math.cos((ref.latitude * Math.PI) / 180) || 1e-6;
  return {
    toXY: (p: LatLng): XY => ({
      x: (p.longitude - ref.longitude) * M_PER_DEG * cosLat,
      y: (p.latitude - ref.latitude) * M_PER_DEG,
    }),
    toLatLng: (p: XY): LatLng => ({
      latitude: ref.latitude + p.y / M_PER_DEG,
      longitude: ref.longitude + p.x / (M_PER_DEG * cosLat),
    }),
  };
}

function centroid(poly: LatLng[]): LatLng {
  const lat = poly.reduce((a, p) => a + p.latitude, 0) / poly.length;
  const lng = poly.reduce((a, p) => a + p.longitude, 0) / poly.length;
  return { latitude: lat, longitude: lng };
}

function pointInPolygonXY(x: number, y: number, poly: XY[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(p: XY, a: XY, b: XY): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

function distToEdge(p: XY, poly: XY[]): number {
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    min = Math.min(min, distToSegment(p, poly[j], poly[i]));
  }
  return min;
}

// --- Species selection ------------------------------------------------------

function suitedOrAll(layer: Plant['layer'], site: SiteInfo): Plant[] {
  const all = PLANTS.filter((p) => p.layer === layer);
  const ok = all.filter((p) => suitability(p, site).ok);
  return ok.length > 0 ? ok : all;
}

/** Tall, dense species for a privacy/windbreak hedge, tallest first. */
function screeningTrees(site: SiteInfo): Plant[] {
  const pool = PLANTS.filter(
    (p) => (p.layer === 'canopy' || p.layer === 'understory') && isScreeningPlant(p)
  );
  const ok = pool.filter((p) => suitability(p, site).ok);
  const chosen = ok.length > 0 ? ok : pool;
  return [...chosen].sort((a, b) => b.matureHeightM - a.matureHeightM);
}

function screeningShrubs(site: SiteInfo): Plant[] {
  const pool = PLANTS.filter((p) => p.layer === 'shrub' && p.matureHeightM >= 1.2);
  const ok = pool.filter((p) => suitability(p, site).ok);
  return ok.length > 0 ? ok : pool;
}

function guildFor(canopy: Plant, site: SiteInfo): string[] {
  const picks: string[] = [];
  const add = (id?: string) => {
    if (id && !picks.includes(id) && picks.length < 3) picks.push(id);
  };
  for (const id of canopy.companions) {
    const p = getPlant(id);
    if (p && suitability(p, site).ok) add(id);
  }
  for (const id of ['comfrey', 'clover', 'chives', 'yarrow', 'strawberry']) {
    const p = getPlant(id);
    if (p && suitability(p, site).ok) add(id);
  }
  return picks;
}

const INTERIOR_INSET_M = 3.5; // keep the interior forest clear of the hedge
const WINDBREAK_INSET_M = 1.5; // how far inside the boundary the hedge sits
const WINDBREAK_SPACING_M = 2.5; // dense enough to screen
const MAX_CANOPY = 30;
const MAX_WINDBREAK = 160;

/**
 * Auto-design a food forest inside `boundary`:
 *  1) a perimeter windbreak/privacy hedge just inside the property edge,
 *     alternating tall screening trees with bushes;
 *  2) an interior canopy grid (inset from the hedge) with a companion guild
 *     under each tree and understory/shrubs between.
 * Everything is filtered to the site's zone & sun, with best-effort fallbacks
 * so it always produces a design.
 */
export function autoDesign(boundary: LatLng[], site: SiteInfo): AutoPlacement[] {
  if (boundary.length < 3) return [];

  const ref = centroid(boundary);
  const { toXY, toLatLng } = makeProjection(ref);
  const polyXY = boundary.map(toXY);
  const out: AutoPlacement[] = [];
  const push = (plantId: string, p: XY) => {
    const ll = toLatLng(p);
    out.push({ plantId, latitude: ll.latitude, longitude: ll.longitude });
  };

  // ---- 1) Perimeter windbreak / privacy hedge -----------------------------
  const wbTrees = screeningTrees(site);
  const wbShrubs = screeningShrubs(site);
  if (wbTrees.length > 0) {
    let placed = 0;
    let alt = 0;
    for (let e = 0; e < polyXY.length && placed < MAX_WINDBREAK; e++) {
      const a = polyXY[e];
      const b = polyXY[(e + 1) % polyXY.length];
      const edgeLen = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.round(edgeLen / WINDBREAK_SPACING_M));
      for (let s = 0; s < steps && placed < MAX_WINDBREAK; s++) {
        const t = s / steps;
        const on: XY = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        // Inset toward the centroid (origin in this plane).
        const mag = Math.hypot(on.x, on.y) || 1;
        const k = Math.max(0, (mag - WINDBREAK_INSET_M) / mag);
        const inset: XY = { x: on.x * k, y: on.y * k };
        // Alternate a tall tree and a bush for a layered screen.
        const useShrub = alt % 2 === 1 && wbShrubs.length > 0;
        const species = useShrub
          ? wbShrubs[Math.floor(alt / 2) % wbShrubs.length]
          : wbTrees[Math.floor(alt / 2) % wbTrees.length];
        push(species.id, inset);
        alt += 1;
        placed += 1;
      }
    }
  }

  // ---- 2) Interior food forest (inset from the hedge) ---------------------
  const anchors = suitedOrAll('canopy', site);
  const understory = suitedOrAll('understory', site);
  const shrub = suitedOrAll('shrub', site);

  // Bounding box in metres.
  const xs = polyXY.map((p) => p.x);
  const ys = polyXY.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const maxSpread = Math.max(...anchors.map((p) => p.matureSpreadM));
  let spacing = Math.max(4, maxSpread + 1.5);

  const canopyNodes = (step: number): XY[] => {
    const nodes: XY[] = [];
    for (let x = minX + step / 2; x < maxX; x += step) {
      for (let y = minY + step / 2; y < maxY; y += step) {
        const p = { x, y };
        if (pointInPolygonXY(x, y, polyXY) && distToEdge(p, polyXY) > INTERIOR_INSET_M) {
          nodes.push(p);
        }
      }
    }
    return nodes;
  };
  let nodes = canopyNodes(spacing);
  while (nodes.length > MAX_CANOPY) {
    spacing *= 1.25;
    nodes = canopyNodes(spacing);
  }

  // Canopy + guild ring under each tree.
  nodes.forEach((node, i) => {
    const tree = anchors[i % anchors.length];
    push(tree.id, node);
    const guild = guildFor(tree, site);
    const ringM = Math.max(1.2, tree.matureSpreadM * 0.4);
    guild.forEach((pid, k) => {
      const angle = (k / Math.max(1, guild.length)) * Math.PI * 2 + i;
      push(pid, { x: node.x + ringM * Math.cos(angle), y: node.y + ringM * Math.sin(angle) });
    });
  });

  // Understory / shrubs on the offset grid, still inset from the hedge.
  const fillers = [...understory, ...shrub];
  if (fillers.length > 0) {
    let f = 0;
    for (let x = minX + spacing; x < maxX; x += spacing) {
      for (let y = minY + spacing; y < maxY; y += spacing) {
        const p = { x, y };
        if (pointInPolygonXY(x, y, polyXY) && distToEdge(p, polyXY) > INTERIOR_INSET_M) {
          push(fillers[f % fillers.length].id, p);
          f += 1;
        }
      }
    }
  }

  return out;
}
