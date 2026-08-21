import { create } from "zustand";
import type { GeoBounds, GeoPoint } from "@/types/common";
import { DEFAULT_CENTER, DEFAULT_LABEL } from "@/lib/geo";

interface MapState {
  /** Current viewport center (updated on every moveend). */
  center: GeoPoint;
  /** Current viewport zoom. */
  zoom: number;
  /**
   * The viewport's real geographic extent, reported by Leaflet. Anything that
   * needs to cover what the user can see must use this rather than deriving a
   * span from centre and zoom, which ignores the actual window shape.
   */
  bounds: GeoBounds | null;
  /** The user's resolved geolocation (if permission was granted). */
  userLocation: GeoPoint | null;
  /** Human-readable label for the active location. */
  locationLabel: string;
  /** Target for the next smooth flyTo transition. */
  flyTarget: GeoPoint | null;
  flyZoom: number | null;
  /** Monotonic token that triggers the flyTo effect. */
  flyToken: number;

  setCenter: (center: GeoPoint) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: GeoBounds) => void;
  setUserLocation: (location: GeoPoint) => void;
  setLocationLabel: (label: string) => void;
  flyTo: (target: GeoPoint, zoom?: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: DEFAULT_CENTER,
  zoom: 8,
  bounds: null,
  userLocation: null,
  locationLabel: DEFAULT_LABEL,
  flyTarget: null,
  flyZoom: null,
  flyToken: 0,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBounds: (bounds) => set({ bounds }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setLocationLabel: (locationLabel) => set({ locationLabel }),
  flyTo: (flyTarget, flyZoom = 9) =>
    set((s) => ({ flyTarget, flyZoom, flyToken: s.flyToken + 1 })),
}));
