import { useEffect, useState } from 'react';

// Live current-conditions from Open-Meteo (no key). Used for the weather-aware
// touch on the Vision hero.

export interface CurrentWeather {
  tempC: number;
  isDay: boolean;
  windKmh: number;
  code: number;
  label: string;
  icon: string;
}

function describe(code: number, isDay: boolean): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: isDay ? '☀️' : '🌙' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: '🌤️' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: '🌫️' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '🌨️' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌦️' };
  if (code >= 95) return { label: 'Storm', icon: '⛈️' };
  return { label: 'Fair', icon: '🌤️' };
}

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  timeoutMs = 10000
): Promise<CurrentWeather | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    current: 'temperature_2m,weather_code,is_day,wind_speed_10m',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const c = json?.current;
    if (!c) return null;
    const code = c.weather_code ?? 0;
    const isDay = c.is_day === 1;
    return {
      tempC: c.temperature_2m,
      isDay,
      windKmh: c.wind_speed_10m ?? 0,
      code,
      ...describe(code, isDay),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Hook: fetch current weather for a coordinate (re-fetches when it changes). */
export function useCurrentWeather(
  lat: number | null,
  lon: number | null
): CurrentWeather | null {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (lat == null || lon == null) {
      setWeather(null);
      return;
    }
    fetchCurrentWeather(lat, lon).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);
  return weather;
}
