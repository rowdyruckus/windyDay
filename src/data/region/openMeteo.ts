// Open-Meteo historical climate client (no API key, CC-BY 4.0).
// We pull ~10 years of daily data and reduce it to the normals we need:
// an average annual extreme-minimum temperature (for USDA hardiness), a
// frost-free growing-season length, and monthly temp/precip climatology
// (which feeds the Köppen classifier).

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const YEARS = 10;

export interface ClimateNormals {
  annualMinTempC: number;
  growingSeasonDays: number;
  /** Mean monthly temperature °C, index 0 = January. */
  monthlyTempC: number[];
  /** Mean monthly precipitation mm, index 0 = January. */
  monthlyPrecipMm: number[];
  /** Average day-of-year of the last spring / first fall frost (or null). */
  lastSpringFrostDoy: number | null;
  firstFallFrostDoy: number | null;
  zone: number;
  zoneHalf: 'a' | 'b';
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Map an average annual minimum (°C) to a USDA hardiness zone + half. */
export function usdaZoneFromMinC(minC: number): { zone: number; half: 'a' | 'b' } {
  const minF = (minC * 9) / 5 + 32;
  const rawZone = Math.floor((minF + 60) / 10) + 1;
  const zone = Math.max(1, Math.min(13, rawZone));
  const lower = (rawZone - 1) * 10 - 60; // °F lower bound of the band
  const half: 'a' | 'b' = minF - lower < 5 ? 'a' : 'b';
  return { zone, half };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClimateNormals(
  lat: number,
  lon: number,
  timeoutMs = 15000
): Promise<ClimateNormals | null> {
  // Archive data lags ~5 days; end a week back to be safe.
  const end = new Date();
  end.setDate(end.getDate() - 7);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - YEARS);

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start_date: isoDate(start),
    end_date: isoDate(end),
    daily: 'temperature_2m_min,temperature_2m_mean,precipitation_sum',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
    timezone: 'auto',
  });

  let json: any;
  try {
    const res = await fetchWithTimeout(`${ARCHIVE_URL}?${params}`, timeoutMs);
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  const times: string[] = json?.daily?.time ?? [];
  const tmin: (number | null)[] = json?.daily?.temperature_2m_min ?? [];
  const tmean: (number | null)[] = json?.daily?.temperature_2m_mean ?? [];
  const precip: (number | null)[] = json?.daily?.precipitation_sum ?? [];
  if (times.length === 0 || tmin.length !== times.length) return null;

  // Cumulative days before each month (non-leap; fine for averages).
  const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  // Per-year extreme minimum, and frost-free day count.
  const yearMin: Record<string, number> = {};
  const yearFrostFree: Record<string, number> = {};
  // Per-year last spring frost (max DOY before midyear) & first fall frost.
  const yearSpringFrost: Record<string, number> = {};
  const yearFallFrost: Record<string, number> = {};
  // Monthly accumulators for climatology.
  const mTempSum = new Array(12).fill(0);
  const mTempCount = new Array(12).fill(0);
  const mPrecipSumByYear: Record<string, number[]> = {};

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const year = t.slice(0, 4);
    const month = parseInt(t.slice(5, 7), 10) - 1;

    const day = parseInt(t.slice(8, 10), 10);
    const doy = CUM[month] + day;
    const lo = tmin[i];
    if (lo != null && Number.isFinite(lo)) {
      if (yearMin[year] == null || lo < yearMin[year]) yearMin[year] = lo;
      if (lo > 0) yearFrostFree[year] = (yearFrostFree[year] ?? 0) + 1;
      if (lo <= 0) {
        if (doy < 183) {
          if (yearSpringFrost[year] == null || doy > yearSpringFrost[year])
            yearSpringFrost[year] = doy;
        } else if (yearFallFrost[year] == null || doy < yearFallFrost[year]) {
          yearFallFrost[year] = doy;
        }
      }
    }
    const me = tmean[i];
    if (me != null && Number.isFinite(me)) {
      mTempSum[month] += me;
      mTempCount[month] += 1;
    }
    const pr = precip[i];
    if (pr != null && Number.isFinite(pr)) {
      if (!mPrecipSumByYear[year]) mPrecipSumByYear[year] = new Array(12).fill(0);
      mPrecipSumByYear[year][month] += pr;
    }
  }

  const minima = Object.values(yearMin);
  if (minima.length === 0) return null;
  const annualMinTempC = minima.reduce((a, b) => a + b, 0) / minima.length;

  const frostFree = Object.values(yearFrostFree);
  const growingSeasonDays =
    frostFree.length > 0
      ? Math.round(frostFree.reduce((a, b) => a + b, 0) / frostFree.length)
      : 365;

  const monthlyTempC = mTempSum.map((s, i) =>
    mTempCount[i] > 0 ? s / mTempCount[i] : 0
  );

  // Average each month's yearly precip totals across years.
  const monthlyPrecipMm = new Array(12).fill(0);
  const precipYears = Object.values(mPrecipSumByYear);
  if (precipYears.length > 0) {
    for (let m = 0; m < 12; m++) {
      const tot = precipYears.reduce((a, y) => a + (y[m] ?? 0), 0);
      monthlyPrecipMm[m] = tot / precipYears.length;
    }
  }

  const { zone, half } = usdaZoneFromMinC(annualMinTempC);

  const springVals = Object.values(yearSpringFrost);
  const fallVals = Object.values(yearFallFrost);
  const avg = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  const lastSpringFrostDoy = springVals.length ? avg(springVals) : null;
  const firstFallFrostDoy = fallVals.length ? avg(fallVals) : null;

  return {
    annualMinTempC,
    growingSeasonDays,
    monthlyTempC,
    monthlyPrecipMm,
    lastSpringFrostDoy,
    firstFallFrostDoy,
    zone,
    zoneHalf: half,
  };
}
