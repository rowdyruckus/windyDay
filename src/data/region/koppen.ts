import { KoppenResult } from './types';

// Köppen-Geiger classification computed from monthly temperature (°C) and
// precipitation (mm) normals, following the criteria in Peel, Finlayson &
// McMahon (2007). This gives us a global biome label with no external dataset.

const SUMMER_N = [3, 4, 5, 6, 7, 8]; // Apr–Sep (Northern Hemisphere warm half)

function sum(a: number[]): number {
  return a.reduce((x, y) => x + y, 0);
}

export function classifyKoppen(
  monthlyTempC: number[],
  monthlyPrecipMm: number[],
  latitude: number
): KoppenResult | null {
  if (monthlyTempC.length !== 12 || monthlyPrecipMm.length !== 12) return null;

  const T = monthlyTempC;
  const P = monthlyPrecipMm;
  const MAP = sum(P);
  const MAT = sum(T) / 12;
  if (!Number.isFinite(MAT) || MAP <= 0) return null;

  const Thot = Math.max(...T);
  const Tcold = Math.min(...T);
  const monthsGE10 = T.filter((t) => t >= 10).length;

  const summerIdx =
    latitude >= 0
      ? SUMMER_N
      : [0, 1, 2, 9, 10, 11]; // Oct–Mar for Southern Hemisphere
  const winterIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(
    (i) => !summerIdx.includes(i)
  );

  const summerP = summerIdx.map((i) => P[i]);
  const winterP = winterIdx.map((i) => P[i]);
  const APsummer = sum(summerP);
  const APwinter = sum(winterP);
  const Psdry = Math.min(...summerP);
  const Pswet = Math.max(...summerP);
  const Pwdry = Math.min(...winterP);
  const Pwwet = Math.max(...winterP);
  const Pdry = Math.min(...P);

  // Aridity threshold for the B (dry) group.
  let f = 140;
  if (APsummer / MAP >= 0.7) f = 280;
  else if (APwinter / MAP >= 0.7) f = 0;
  const Pthreshold = 20 * MAT + f;

  let code: string;

  if (MAP < Pthreshold) {
    // B — arid
    code = MAP < 0.5 * Pthreshold ? 'BW' : 'BS';
    code += MAT >= 18 ? 'h' : 'k';
  } else if (Tcold >= 18) {
    // A — tropical
    if (Pdry >= 60) code = 'Af';
    else if (Pdry >= 100 - MAP / 25) code = 'Am';
    else {
      const driestMonth = P.indexOf(Pdry);
      code = summerIdx.includes(driestMonth) ? 'As' : 'Aw';
    }
  } else if (Thot > 10 && Tcold > 0) {
    // C — temperate
    code = 'C' + precipLetter() + tempLetter(true);
  } else if (Thot > 10 && Tcold <= 0) {
    // D — continental
    code = 'D' + precipLetter() + tempLetter(false);
  } else {
    // E — polar
    code = Thot > 0 ? 'ET' : 'EF';
  }

  function precipLetter(): string {
    const drySummer = Psdry < 40 && Psdry < Pwwet / 3;
    const dryWinter = Pwdry < Pswet / 10;
    if (drySummer) return 's';
    if (dryWinter) return 'w';
    return 'f';
  }

  function tempLetter(isC: boolean): string {
    if (Thot >= 22) return 'a';
    if (monthsGE10 >= 4) return 'b';
    if (!isC && Tcold < -38) return 'd';
    return 'c';
  }

  return { code, ...describe(code) };
}

const LABELS: Record<string, { label: string; blurb: string }> = {
  Af: { label: 'Tropical rainforest', blurb: 'Warm and wet all year — lush and evergreen.' },
  Am: { label: 'Tropical monsoon', blurb: 'Hot with a pronounced rainy season.' },
  Aw: { label: 'Tropical savanna', blurb: 'Warm year-round with a dry winter.' },
  As: { label: 'Tropical savanna', blurb: 'Warm year-round with a dry summer.' },
  BWh: { label: 'Hot desert', blurb: 'Arid and hot — choose drought-hardy species.' },
  BWk: { label: 'Cold desert', blurb: 'Arid with cold winters.' },
  BSh: { label: 'Hot semi-arid steppe', blurb: 'Dry grassland heat — mulch and water wisely.' },
  BSk: { label: 'Cold semi-arid steppe', blurb: 'Dry, with cold winters.' },
  Cfa: { label: 'Humid subtropical', blurb: 'Hot humid summers, mild wet winters.' },
  Cfb: { label: 'Oceanic', blurb: 'Mild, moist and even — a gardener’s temperate sweet spot.' },
  Cfc: { label: 'Subpolar oceanic', blurb: 'Cool and moist with short summers.' },
  Csa: { label: 'Hot-summer Mediterranean', blurb: 'Hot dry summers, mild wet winters.' },
  Csb: { label: 'Warm-summer Mediterranean', blurb: 'Dry warm summers, mild wet winters.' },
  Cwa: { label: 'Monsoon subtropical', blurb: 'Warm with a dry winter and wet summer.' },
  Cwb: { label: 'Subtropical highland', blurb: 'Mild highland climate with a dry winter.' },
  Dfa: { label: 'Hot-summer humid continental', blurb: 'Hot summers, cold snowy winters.' },
  Dfb: { label: 'Warm-summer humid continental', blurb: 'Warm summers, cold snowy winters.' },
  Dfc: { label: 'Subarctic', blurb: 'Short cool summers, long cold winters.' },
  Dwa: { label: 'Continental, dry winter', blurb: 'Hot summers, cold dry winters.' },
  Dwb: { label: 'Continental, dry winter', blurb: 'Warm summers, cold dry winters.' },
  ET: { label: 'Tundra', blurb: 'Very short cool growing season.' },
  EF: { label: 'Ice cap', blurb: 'Perennially frozen — not for growing.' },
};

const GROUP_LABELS: Record<string, { label: string; blurb: string }> = {
  A: { label: 'Tropical', blurb: 'Warm year-round.' },
  B: { label: 'Arid', blurb: 'Dry climate — plan for water.' },
  C: { label: 'Temperate', blurb: 'Mild seasons — broad plant palette.' },
  D: { label: 'Continental', blurb: 'Warm summers, cold winters.' },
  E: { label: 'Polar', blurb: 'Cold with a very short season.' },
};

function describe(code: string): { label: string; blurb: string } {
  return LABELS[code] ?? GROUP_LABELS[code[0]] ?? { label: code, blurb: '' };
}
