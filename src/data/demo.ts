import { LatLng } from './geo';

/**
 * A real, public example garden shown on the Design canvas before the user
 * sets their own location — the Beacon Food Forest in Seattle, the largest
 * public food forest in the United States (15th Ave S & S Dakota St, on the
 * slope of Jefferson Park). Great from above and free to explore.
 */
export const DEMO_SITE: LatLng & {
  label: string;
  zone: number;
  blurb: string;
} = {
  latitude: 47.5747,
  longitude: -122.3123,
  label: 'Beacon Food Forest, Seattle',
  zone: 8,
  blurb: 'The largest public food forest in the U.S. — explore it, then design your own.',
};

/**
 * Startup showcase location — Yosemite Valley. The app centers both the Site
 * and Design maps here on every launch, regardless of any previously saved
 * location.
 */
export const STARTUP_SITE: LatLng & { label: string; zone: number } = {
  latitude: 37.7456,
  longitude: -119.5936,
  label: 'Yosemite National Park',
  zone: 7,
};
