export type Units = 'metric' | 'imperial';

export function formatLength(m: number, units: Units): string {
  if (units === 'imperial') {
    const ft = m * 3.28084;
    return ft < 10 ? `${ft.toFixed(1)} ft` : `${Math.round(ft)} ft`;
  }
  return m < 10 ? `${m.toFixed(1)} m` : `${Math.round(m)} m`;
}

export function formatTemp(c: number, units: Units): string {
  if (units === 'imperial') return `${Math.round((c * 9) / 5 + 32)}°F`;
  return `${Math.round(c)}°C`;
}

export function formatPrecip(mm: number, units: Units): string {
  if (units === 'imperial') return `${Math.round(mm / 25.4)} in`;
  return `${Math.round(mm)} mm`;
}

/** Litres → gallons for imperial water volumes. */
export function formatVolume(liters: number, units: Units): string {
  const val = units === 'imperial' ? liters / 3.785 : liters;
  const unit = units === 'imperial' ? 'gal' : 'L';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ${unit}`;
  if (val >= 1000) return `${Math.round(val / 1000)}k ${unit}`;
  return `${Math.round(val)} ${unit}`;
}
