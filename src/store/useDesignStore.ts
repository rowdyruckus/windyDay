import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacedPlant, SiteInfo, SunNeed } from '../types';
import { LatLng } from '../data/geo';

let instanceCounter = 0;
function newInstanceId(): string {
  instanceCounter += 1;
  return `pp_${Date.now().toString(36)}_${instanceCounter}`;
}

interface DesignState {
  site: SiteInfo;
  placed: PlacedPlant[];
  /** Inferred property outline; empty when the user hasn't marked one. */
  boundary: LatLng[];
  hydrated: boolean;

  setLocation: (latitude: number, longitude: number, zone: number) => void;
  setZone: (zone: number) => void;
  setSun: (sun: SunNeed) => void;
  setLabel: (label: string) => void;

  placePlant: (plantId: string, latitude: number, longitude: number) => void;
  movePlant: (instanceId: string, latitude: number, longitude: number) => void;
  removePlant: (instanceId: string) => void;
  clearDesign: () => void;

  setBoundary: (points: LatLng[]) => void;
  moveBoundaryPoint: (index: number, point: LatLng) => void;
  clearBoundary: () => void;

  setHydrated: () => void;
}

const initialSite: SiteInfo = {
  latitude: null,
  longitude: null,
  zone: null,
  zoneSource: null,
  sun: 'full',
  label: 'My Food Forest',
};

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      site: initialSite,
      placed: [],
      boundary: [],
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

      clearDesign: () => set(() => ({ placed: [] })),

      setBoundary: (points) => set(() => ({ boundary: points })),

      moveBoundaryPoint: (index, point) =>
        set((s) => ({
          boundary: s.boundary.map((p, i) => (i === index ? point : p)),
        })),

      clearBoundary: () => set(() => ({ boundary: [] })),

      setHydrated: () => set(() => ({ hydrated: true })),
    }),
    {
      name: 'food-forest-design-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ site: s.site, placed: s.placed, boundary: s.boundary }),
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
