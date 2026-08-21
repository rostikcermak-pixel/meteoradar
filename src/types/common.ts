export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Geographic extent of the map viewport. */
export interface GeoBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type UnitSystem = "celsius" | "fahrenheit";

export type PlaybackSpeed = 0.5 | 1 | 2;
