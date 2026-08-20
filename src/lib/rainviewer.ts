import type { RainViewerFrame, RainViewerResponse } from "@/types/radar";

export const RAINVIEWER_ENDPOINT =
  "https://api.rainviewer.com/public/weather-maps.json";

/** NEXRAD Level III palette — reads well on dark maps. */
export const RADAR_COLOR_SCHEME = 6;
/** Smoothing + snow overlays. */
export const RADAR_OPTIONS = "1_1";
/** RainViewer tiles are only generated up to zoom 7. */
export const RADAR_MAX_ZOOM = 7;

export async function fetchRadarData(): Promise<RainViewerResponse> {
  const res = await fetch(RAINVIEWER_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error(`RainViewer responded with HTTP ${res.status}`);
  return (await res.json()) as RainViewerResponse;
}

/** Leaflet tile-template URL for a radar frame (uses {z}/{x}/{y} placeholders). */
export function radarTileTemplate(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/${RADAR_COLOR_SCHEME}/${RADAR_OPTIONS}.png`;
}

export function satelliteTileTemplate(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/0/0_0.png`;
}

/** Explicit tile URL (used for image preloading). */
export function radarTileUrl(
  host: string,
  path: string,
  z: number,
  x: number,
  y: number
): string {
  return `${host}${path}/256/${z}/${x}/${y}/${RADAR_COLOR_SCHEME}/${RADAR_OPTIONS}.png`;
}

export function lonLatToTile(
  lon: number,
  lat: number,
  zoom: number
): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export interface TileExtent {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Warms the browser's image cache for every radar frame across the currently
 * visible extent. This eliminates the blank-tile flicker during playback.
 */
export function preloadFrames(
  host: string,
  frames: RainViewerFrame[],
  extent: TileExtent,
  zoom: number
): void {
  if (!frames.length) return;

  let tileZoom = Math.max(1, Math.min(RADAR_MAX_ZOOM, Math.round(zoom)));

  // Auto-degrade the preload zoom if the visible span is huge.
  let guard = tileZoom;
  while (guard > 1) {
    const a = lonLatToTile(extent.west, extent.north, guard);
    const b = lonLatToTile(extent.east, extent.south, guard);
    const spanX = Math.abs(b.x - a.x) + 1;
    const spanY = Math.abs(b.y - a.y) + 1;
    if (spanX * spanY * frames.length <= 420) break;
    guard -= 1;
  }
  tileZoom = guard;

  const a = lonLatToTile(extent.west, extent.north, tileZoom);
  const b = lonLatToTile(extent.east, extent.south, tileZoom);
  const startX = Math.min(a.x, b.x);
  const endX = Math.max(a.x, b.x);
  const startY = Math.min(a.y, b.y);
  const endY = Math.max(a.y, b.y);

  for (const frame of frames) {
    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = radarTileUrl(host, frame.path, tileZoom, x, y);
      }
    }
  }
}
