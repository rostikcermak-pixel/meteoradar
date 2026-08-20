import type { ForecastFrame, ForecastGrid } from "@/types/forecast";
import type { TileExtent } from "@/lib/rainviewer";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/** Grid resolution. 12 x 8 = 96 points keeps one request well under a second. */
export const GRID_COLS = 12;
export const GRID_ROWS = 8;
/** How many hours beyond the observed radar the timeline should reach. */
export const FORECAST_HOURS = 12;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Web Mercator Y for a latitude, used to keep grid rows evenly spaced on screen. */
export function mercatorY(lat: number): number {
  const clamped = Math.max(-85.05, Math.min(85.05, lat));
  return Math.log(Math.tan(Math.PI / 4 + toRad(clamped) / 2));
}

export function inverseMercatorY(y: number): number {
  return toDeg(2 * Math.atan(Math.exp(y)) - Math.PI / 2);
}

/**
 * Latitudes for each grid row, evenly spaced in Mercator Y from north to south
 * so the rendered image lines up with the map's projection.
 */
export function gridLatitudes(south: number, north: number, rows: number): number[] {
  const yNorth = mercatorY(north);
  const ySouth = mercatorY(south);
  // Sample at row centres so the image's edge pixels sit inside the bounds.
  return Array.from({ length: rows }, (_, r) =>
    inverseMercatorY(yNorth + ((ySouth - yNorth) * (r + 0.5)) / rows)
  );
}

export function gridLongitudes(west: number, east: number, cols: number): number[] {
  return Array.from(
    { length: cols },
    (_, c) => west + ((east - west) * (c + 0.5)) / cols
  );
}

interface OpenMeteoGridPoint {
  hourly?: { time: string[]; precipitation: (number | null)[] };
}

/**
 * Fetches modelled hourly precipitation for a grid of points covering `extent`.
 * Open-Meteo accepts comma-separated coordinates and answers with one entry per
 * point, so the whole grid costs a single request.
 */
export async function fetchForecastGrid(
  extent: TileExtent,
  signal?: AbortSignal
): Promise<ForecastGrid> {
  const lats = gridLatitudes(extent.south, extent.north, GRID_ROWS);
  const lons = gridLongitudes(extent.west, extent.east, GRID_COLS);

  const latParam: string[] = [];
  const lonParam: string[] = [];
  for (const lat of lats) {
    for (const lon of lons) {
      latParam.push(lat.toFixed(3));
      lonParam.push(normalizeLon(lon).toFixed(3));
    }
  }

  const params = new URLSearchParams({
    latitude: latParam.join(","),
    longitude: lonParam.join(","),
    hourly: "precipitation",
    forecast_hours: String(FORECAST_HOURS),
    timezone: "UTC",
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo grid responded with HTTP ${res.status}`);

  const body = (await res.json()) as OpenMeteoGridPoint | OpenMeteoGridPoint[];
  const points = Array.isArray(body) ? body : [body];

  const times = points[0]?.hourly?.time ?? [];
  const frames: ForecastFrame[] = times.map((iso, step) => ({
    // Open-Meteo returns naive UTC strings when timezone=UTC.
    time: Math.floor(Date.parse(`${iso}Z`) / 1000),
    values: points.map((p) => p.hourly?.precipitation?.[step] ?? 0),
  }));

  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    west: extent.west,
    east: extent.east,
    south: extent.south,
    north: extent.north,
    frames,
  };
}

function normalizeLon(lon: number): number {
  let x = lon;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

/** Precipitation colour ramp, matching the intensity legend in the UI. */
const STOPS: Array<{ mm: number; rgb: [number, number, number]; a: number }> = [
  { mm: 0.05, rgb: [34, 197, 94], a: 0.0 },
  { mm: 0.3, rgb: [34, 197, 94], a: 0.55 },
  { mm: 1.0, rgb: [132, 204, 22], a: 0.7 },
  { mm: 2.5, rgb: [234, 179, 8], a: 0.78 },
  { mm: 5.0, rgb: [249, 115, 22], a: 0.85 },
  { mm: 10.0, rgb: [239, 68, 68], a: 0.9 },
  { mm: 20.0, rgb: [217, 70, 239], a: 0.95 },
];

export function precipColor(mm: number): [number, number, number, number] {
  if (!Number.isFinite(mm) || mm < STOPS[0].mm) return [0, 0, 0, 0];
  if (mm >= STOPS[STOPS.length - 1].mm) {
    const last = STOPS[STOPS.length - 1];
    return [last.rgb[0], last.rgb[1], last.rgb[2], last.a];
  }
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const lo = STOPS[i];
    const hi = STOPS[i + 1];
    if (mm >= lo.mm && mm < hi.mm) {
      const t = (mm - lo.mm) / (hi.mm - lo.mm);
      return [
        Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * t),
        Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * t),
        Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * t),
        lo.a + (hi.a - lo.a) * t,
      ];
    }
  }
  return [0, 0, 0, 0];
}

/**
 * Paints one frame into a grid-sized PNG data URL. The image is deliberately
 * tiny (one pixel per grid cell) — the browser's own bilinear scaling smooths
 * it into a soft field when Leaflet stretches it over the map.
 */
export function frameToDataUrl(grid: ForecastGrid, frame: ForecastFrame): string {
  const canvas = document.createElement("canvas");
  canvas.width = grid.cols;
  canvas.height = grid.rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(grid.cols, grid.rows);
  for (let i = 0; i < grid.cols * grid.rows; i += 1) {
    const [r, g, b, a] = precipColor(frame.values[i] ?? 0);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** True when the grid no longer covers enough of the given extent to be useful. */
export function needsRefetch(grid: ForecastGrid | null, extent: TileExtent): boolean {
  if (!grid) return true;
  const covers =
    extent.west >= grid.west &&
    extent.east <= grid.east &&
    extent.south >= grid.south &&
    extent.north <= grid.north;
  if (!covers) return true;

  // Also refetch once the view has zoomed far enough in that the grid is coarse.
  const gridSpan = grid.east - grid.west;
  const viewSpan = extent.east - extent.west;
  return viewSpan > 0 && gridSpan / viewSpan > 3;
}
