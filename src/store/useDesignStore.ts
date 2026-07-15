import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacedPlant, PlacedStructure, SiteInfo, StructureType, SunNeed } from '../types';
import { LatLng } from '../data/geo';
import { STRUCTURE_META } from '../data/structures';
import {
  RegionProfile,
  resolveRegionProfile,
  isProfileFresh,
} from '../data/region';
import { STARTUP_SITE } from '../data/demo';

export type RegionStatus = 'idle' | 'loading' | 'ready' | 'error';
export type Basemap = 'apple' | 'esri';

let instanceCounter = 0;
function newInstanceId(prefix = 'pp'): string {
  instanceCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${instanceCounter}`;
}

interface DesignState {
  site: SiteInfo;
  placed: PlacedPlant[];
  structures: PlacedStructure[];
  /** Inferred property outline; empty when the user hasn't marked one. */
  boundary: LatLng[];
  /** Region intelligence resolved from the site coordinates. */
  region: RegionProfile | null;
  regionStatus: RegionStatus;
  /** Which imagery layer to show on the maps. */
  basemap: Basemap;
  /** Whether the startup music is muted. */
  musicMuted: boolean;
  hydrated: boolean;

  setLocation: (latitude: number, longitude: number, zone: number) => void;
  setZone: (zone: number) => void;
  setSun: (sun: SunNeed) => void;
  setLabel: (label: string) => void;

  placePlant: (plantId: string, latitude: number, longitude: number) => void;
  placePlants: (
    items: { plantId: string; latitude: number; longitude: number }[]
  ) => void;
  movePlant: (instanceId: string, latitude: number, longitude: number) => void;
  removePlant: (instanceId: string) => void;
  removePlantsOfType: (plantId: string) => void;
  clearPlants: () => void;
  clearDesign: () => void;

  placeStructure: (type: StructureType, latitude: number, longitude: number) => void;
  moveStructure: (instanceId: string, latitude: number, longitude: number) => void;
  updateStructure: (
    instanceId: string,
    patch: Partial<Pick<PlacedStructure, 'flockSize' | 'radiusM'>>
  ) => void;
  removeStructure: (instanceId: string) => void;

  setBoundary: (points: LatLng[]) => void;
  moveBoundaryPoint: (index: number, point: LatLng) => void;
  clearBoundary: () => void;

  /** Resolve region data for a coordinate (cached; force to refetch). */
  resolveRegion: (lat: number, lon: number, force?: boolean) => Promise<void>;

  setBasemap: (basemap: Basemap) => void;

  toggleMusic: () => void;

  /** Clear the saved site & region so the example garden shows again. */
  clearSite: () => void;

  /** Force the startup showcase location (overrides any saved site). */
  startAtStartup: () => void;

  setHydrated: () => void;
}

const initialSite: SiteInfo = {
  latitude: null,
  longitude: null,
  zone: null,
  zoneSource: null,
  sun: 'full',
  label: 'My Paradise',
};

// The showcase location the app opens on every launch.
const startupSite: SiteInfo = {
  latitude: STARTUP_SITE.latitude,
  longitude: STARTUP_SITE.longitude,
  zone: STARTUP_SITE.zone,
  zoneSource: 'auto',
  sun: 'full',
  label: STARTUP_SITE.label,
};

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      site: startupSite,
      placed: [],
      structures: [],
      boundary: [],
      region: null,
      regionStatus: 'idle',
      basemap: 'apple',
      musicMuted: false,
      hydrated: false,

      setLocation: (latitude, longitude, zone) =>
        set((s) => ({
          site: {
            ...s.site,
            latitude,
            longitude,
            // Only auto-set the zone if the user hasn't set one manually.
            zone: s.site.zoneSource === 'manual' ? s.site.zone : zone,
            zoneSource: s.site.zoneSource === 'manual' ? 'manual' : 'auto',
          },
        })),

      setZone: (zone) =>
        set((s) => ({ site: { ...s.site, zone, zoneSource: 'manual' } })),

      setSun: (sun) => set((s) => ({ site: { ...s.site, sun } })),

      setLabel: (label) => set((s) => ({ site: { ...s.site, label } })),

      placePlant: (plantId, latitude, longitude) =>
        set((s) => ({
          placed: [
            ...s.placed,
            { instanceId: newInstanceId(), plantId, latitude, longitude },
          ],
        })),

      placePlants: (items) =>
        set((s) => ({
          placed: [
            ...s.placed,
            ...items.map((it) => ({
              instanceId: newInstanceId(),
              plantId: it.plantId,
              latitude: it.latitude,
              longitude: it.longitude,
            })),
          ],
        })),

      movePlant: (instanceId, latitude, longitude) =>
        set((s) => ({
          placed: s.placed.map((p) =>
            p.instanceId === instanceId ? { ...p, latitude, longitude } : p
          ),
        })),

      removePlant: (instanceId) =>
        set((s) => ({
          placed: s.placed.filter((p) => p.instanceId !== instanceId),
        })),

      removePlantsOfType: (plantId) =>
        set((s) => ({ placed: s.placed.filter((p) => p.plantId !== plantId) })),

      clearPlants: () => set(() => ({ placed: [] })),

      clearDesign: () => set(() => ({ placed: [], structures: [] })),

      placeStructure: (type, latitude, longitude) =>
        set((s) => ({
          structures: [
            ...s.structures,
            {
              instanceId: newInstanceId('st'),
              type,
              latitude,
              longitude,
              flockSize: type === 'coop' ? STRUCTURE_META.coop.defaultFlock : undefined,
              radiusM:
                type === 'pond' || type === 'beehive'
                  ? STRUCTURE_META[type].defaultRadiusM
                  : undefined,
            },
          ],
        })),

      moveStructure: (instanceId, latitude, longitude) =>
        set((s) => ({
          structures: s.structures.map((st) =>
            st.instanceId === instanceId ? { ...st, latitude, longitude } : st
          ),
        })),

      updateStructure: (instanceId, patch) =>
        set((s) => ({
          structures: s.structures.map((st) =>
            st.instanceId === instanceId ? { ...st, ...patch } : st
          ),
        })),

      removeStructure: (instanceId) =>
        set((s) => ({
          structures: s.structures.filter((st) => st.instanceId !== instanceId),
        })),

      setBoundary: (points) => set(() => ({ boundary: points })),

      moveBoundaryPoint: (index, point) =>
        set((s) => ({
          boundary: s.boundary.map((p, i) => (i === index ? point : p)),
        })),

      clearBoundary: () => set(() => ({ boundary: [] })),

      resolveRegion: async (lat, lon, force = false) => {
        const { region } = get();
        if (!force && isProfileFresh(region, lat, lon)) {
          set({ regionStatus: 'ready' });
          return;
        }
        set({ regionStatus: 'loading' });
        try {
          const month = new Date().getMonth() + 1;
          const profile = await resolveRegionProfile(lat, lon, month);
          set((s) => ({
            region: profile,
            regionStatus: 'ready',
            // Adopt the resolved zone unless the user set one manually.
            site:
              s.site.zoneSource === 'manual'
                ? s.site
                : { ...s.site, zone: profile.zone, zoneSource: 'auto' },
          }));
        } catch {
          set({ regionStatus: 'error' });
        }
      },

      setBasemap: (basemap) => set(() => ({ basemap })),

      toggleMusic: () => set((s) => ({ musicMuted: !s.musicMuted })),

      clearSite: () =>
        set(() => ({ site: initialSite, region: null, regionStatus: 'idle' })),

      startAtStartup: () =>
        set(() => ({ site: startupSite, region: null, regionStatus: 'idle' })),

      setHydrated: () => set(() => ({ hydrated: true })),
    }),
    {
      name: 'food-forest-design-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        site: s.site,
        placed: s.placed,
        structures: s.structures,
        boundary: s.boundary,
        region: s.region,
        basemap: s.basemap,
        musicMuted: s.musicMuted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        // Always start centered on the showcase location, whatever was saved.
        state?.startAtStartup();
      },
    }
  )
);

/**
 * Convenience selector: unique plant ids currently in the design.
 *
 * The selector derives a fresh array, so it is wrapped in `useShallow` to
 * compare by contents — otherwise a new array reference on every render trips
 * React's useSyncExternalStore infinite-loop guard.
 */
export function usePlacedPlantIds(): string[] {
  return useDesignStore(
    useShallow((s) => Array.from(new Set(s.placed.map((p) => p.plantId))))
  );
}
