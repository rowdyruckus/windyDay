import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacedPlant, PlacedStructure, SiteInfo, StructureType, SunNeed } from '../types';
import { LatLng } from '../data/geo';
import { STRUCTURE_META } from '../data/structures';
import {
  RegionProfile,
  resolveRegionProfile,
  isProfileFresh,
} from '../data/region';

export type RegionStatus = 'idle' | 'loading' | 'ready' | 'error';

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
  hydrated: boolean;

  setLocation: (latitude: number, longitude: number, zone: number) => void;
  setZone: (zone: number) => void;
  setSun: (sun: SunNeed) => void;
  setLabel: (label: string) => void;

  placePlant: (plantId: string, latitude: number, longitude: number) => void;
  movePlant: (instanceId: string, latitude: number, longitude: number) => void;
  removePlant: (instanceId: string) => void;
  clearDesign: () => void;

  placeStructure: (type: StructureType, latitude: number, longitude: number) => void;
  moveStructure: (instanceId: string, latitude: number, longitude: number) => void;
  setFlockSize: (instanceId: string, flockSize: number) => void;
  removeStructure: (instanceId: string) => void;

  setBoundary: (points: LatLng[]) => void;
  moveBoundaryPoint: (index: number, point: LatLng) => void;
  clearBoundary: () => void;

  /** Resolve region data for a coordinate (cached; force to refetch). */
  resolveRegion: (lat: number, lon: number, force?: boolean) => Promise<void>;

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

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      site: initialSite,
      placed: [],
      structures: [],
      boundary: [],
      region: null,
      regionStatus: 'idle',
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
              flockSize: STRUCTURE_META[type].defaultFlock,
            },
          ],
        })),

      moveStructure: (instanceId, latitude, longitude) =>
        set((s) => ({
          structures: s.structures.map((st) =>
            st.instanceId === instanceId ? { ...st, latitude, longitude } : st
          ),
        })),

      setFlockSize: (instanceId, flockSize) =>
        set((s) => ({
          structures: s.structures.map((st) =>
            st.instanceId === instanceId ? { ...st, flockSize } : st
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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

/** Convenience selector: unique plant ids currently in the design. */
export function usePlacedPlantIds(): string[] {
  return useDesignStore((s) => Array.from(new Set(s.placed.map((p) => p.plantId))));
}
