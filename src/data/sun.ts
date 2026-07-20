import { LatLng } from './geo';

// Lightweight solar-position model (good enough to visualise shadows moving
// east -> west through the day) plus a microclimate estimate from daily shade.

const DEG = Math.PI / 180;

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export interface SunPos {
  /** Degrees above the horizon (negative = below / night). */
  altitude: number;
  /** Degrees clockwise from north (90 = east, 180 = south, 270 = west). */
  azimuth: number;
}

/** Approximate solar altitude & azimuth for a latitude, day and solar hour. */
export function solarPosition(latDeg: number, doy: number, hour: number): SunPos {
  const lat = latDeg * DEG;
  const decl = 23.45 * DEG * Math.sin(DEG * (360 / 365) * (doy - 81));
  const H = (hour - 12) * 15 * DEG; // hour angle

  const sinAlt =
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const cosAz =
    (Math.sin(decl) - Math.sin(altitude) * Math.sin(lat)) /
    (Math.cos(altitude) * Math.cos(lat) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))); // 0..PI from north
  if (H > 0) az = 2 * Math.PI - az; // afternoon -> west side

  return { altitude: altitude / DEG, azimuth: az / DEG };
}

/**
 * Ground offset (metres, east & north) of the shadow tip cast by an object of
 * the given height. `valid` is false when the sun is at/below the horizon.
 */
export function shadowOffsetMeters(
  latDeg: number,
  doy: number,
  hour: number,
  heightM: number
): { east: number; north: number; valid: boolean } {
  const { altitude, azimuth } = solarPosition(latDeg, doy, hour);
  if (altitude <= 2) return { east: 0, north: 0, valid: false };
  const length = heightM / Math.tan(altitude * DEG);
  // Shadow points away from the sun.
  const shadowAz = (azimuth + 180) * DEG;
  return {
    east: length * Math.sin(shadowAz),
    north: length * Math.cos(shadowAz),
    valid: true,
  };
}

// --- Microclimate from cumulative daily shade -------------------------------

export type MicroClass = 'cool' | 'hot' | 'mod';

export interface MicroCell {
  latitude: number;
  longitude: number;
  klass: MicroClass;
  /** Fraction of sampled daylight hours this cell sits in shade (0-1). */
  shade: number;
}

export interface ShadeTree {
  latitude: number;
  longitude: number;
  heightM: number;
  spreadM: number;
}

const M_PER_DEG = 111_320;
const SAMPLE_HOURS = [7, 9, 11, 13, 15, 17];
const MAX_CELLS = 130;

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Estimate a microclimate class for a grid of cells inside `boundary`: cells
 * shaded through much of the day read as cool & moist; sunny cells as hot & dry.
 */
export function computeMicroclimate(
  boundary: LatLng[],
  trees: ShadeTree[],
  latDeg: number,
  doy: number
): MicroCell[] {
  if (boundary.length < 3) return [];

  const ref = boundary.reduce(
    (a, p) => ({ latitude: a.latitude + p.latitude / boundary.length, longitude: a.longitude + p.longitude / boundary.length }),
    { latitude: 0, longitude: 0 }
  );
  const cosLat = Math.cos(ref.latitude * DEG) || 1e-6;
  const toX = (lng: number) => (lng - ref.longitude) * M_PER_DEG * cosLat;
  const toY = (lat: number) => (lat - ref.latitude) * M_PER_DEG;
  const toLng = (x: number) => ref.longitude + x / (M_PER_DEG * cosLat);
  const toLat = (y: number) => ref.latitude + y / M_PER_DEG;

  const polyX = boundary.map((p) => toX(p.longitude));
  const polyY = boundary.map((p) => toY(p.latitude));
  const inPoly = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = polyX.length - 1; i < polyX.length; j = i++) {
      const intersect =
        polyY[i] > y !== polyY[j] > y &&
        x < ((polyX[j] - polyX[i]) * (y - polyY[i])) / (polyY[j] - polyY[i]) + polyX[i];
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const minX = Math.min(...polyX);
  const maxX = Math.max(...polyX);
  const minY = Math.min(...polyY);
  const maxY = Math.max(...polyY);

  // Choose a grid step that keeps the cell count reasonable.
  let step = 4;
  const cellCount = (s: number) =>
    Math.max(1, Math.floor((maxX - minX) / s)) * Math.max(1, Math.floor((maxY - minY) / s));
  while (cellCount(step) > MAX_CELLS) step *= 1.3;

  // Precompute shadow segments per tree per sample hour.
  const treeXY = trees.map((t) => ({
    x: toX(t.longitude),
    y: toY(t.latitude),
    r: Math.max(0.6, t.spreadM / 2),
    h: t.heightM,
  }));

  const cells: MicroCell[] = [];
  for (let x = minX + step / 2; x < maxX; x += step) {
    for (let y = minY + step / 2; y < maxY; y += step) {
      if (!inPoly(x, y)) continue;
      let daylight = 0;
      let shaded = 0;
      for (const hour of SAMPLE_HOURS) {
        const { altitude, azimuth } = solarPosition(latDeg, doy, hour);
        if (altitude <= 2) continue;
        daylight += 1;
        const shadowAz = (azimuth + 180) * DEG;
        const ux = Math.sin(shadowAz);
        const uy = Math.cos(shadowAz);
        for (const t of treeXY) {
          const len = t.h / Math.tan(altitude * DEG);
          const tipX = t.x + ux * len;
          const tipY = t.y + uy * len;
          if (distToSegment(x, y, t.x, t.y, tipX, tipY) < t.r) {
            shaded += 1;
            break;
          }
        }
      }
      const frac = daylight > 0 ? shaded / daylight : 0;
      const klass: MicroClass = frac >= 0.55 ? 'cool' : frac <= 0.25 ? 'hot' : 'mod';
      cells.push({ latitude: toLat(y), longitude: toLng(x), klass, shade: frac });
    }
  }
  return cells;
}

/**
 * Estimated hours of direct sun a point receives over the day, given the trees
 * that could shade it. Samples the daylight hours and counts those where the
 * sun is up and no tree shadow falls on the point.
 */
export function sunHoursAt(
  latDeg: number,
  doy: number,
  point: LatLng,
  trees: ShadeTree[]
): number {
  const MPD = 111320;
  const cos = Math.cos((point.latitude * Math.PI) / 180) || 1e-6;
  const px = point.longitude * MPD * cos;
  const py = point.latitude * MPD;
  const treeXY = trees.map((t) => ({
    x: t.longitude * MPD * cos,
    y: t.latitude * MPD,
    r: Math.max(0.6, t.spreadM / 2),
    h: t.heightM,
  }));

  const step = 0.5;
  let hours = 0;
  for (let hour = 4; hour <= 20; hour += step) {
    const { altitude, azimuth } = solarPosition(latDeg, doy, hour);
    if (altitude <= 2) continue;
    const shadowAz = (azimuth + 180) * DEG;
    const ux = Math.sin(shadowAz);
    const uy = Math.cos(shadowAz);
    let shaded = false;
    for (const t of treeXY) {
      const len = t.h / Math.tan(altitude * DEG);
      const d = distToSegment(px, py, t.x, t.y, t.x + ux * len, t.y + uy * len);
      if (d < t.r) {
        shaded = true;
        break;
      }
    }
    if (!shaded) hours += step;
  }
  return Math.round(hours * 10) / 10;
}

export const MICRO_META: Record<
  MicroClass,
  { label: string; color: string; blurb: string }
> = {
  cool: { label: 'Cool & moist', color: '#4aa3d9', blurb: 'Shaded much of the day — leafy greens & shade-lovers.' },
  mod: { label: 'Dappled', color: '#8dd17f', blurb: 'Part sun — most understory & herbs are happy here.' },
  hot: { label: 'Hot & dry', color: '#e0a94a', blurb: 'Full sun — Mediterranean herbs & sun-lovers.' },
};

/** The famous Bill Mollison line on observing sun, shade and microclimate. */
export const SUN_QUOTE = {
  text:
    'Permaculture is a philosophy of working with, rather than against nature; of protracted and thoughtful observation rather than protracted and thoughtless labour.',
  author: 'Bill Mollison, founder of permaculture',
};
