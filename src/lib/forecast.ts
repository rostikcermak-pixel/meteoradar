import type { ForecastFrame, ForecastGrid } from "@/types/forecast";
import type { TileExtent } from "@/lib/rainviewer";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Grid resolution. 24 x 16 = 384 points is the practical ceiling: the API
 * takes coordinates in the query string and answers 414 (URI Too Long) at
 * around 600 points. At a typical city-level view this puts a grid cell near
 * 10 x 13 km — still far coarser than radar's ~0.8 km, which is why forecast
 * steps look smooth next to observed scans.
 */
export const GRID_COLS = 24;
export const GRID_ROWS = 16;
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
  /** `time` holds UNIX seconds because the request asks for timeformat=unixtime. */
  hourly?: { time: number[]; precipitation: (number | null)[] };
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

  /*
   * Built by hand rather than with URLSearchParams, which percent-encodes the
   * separators between coordinates. Over 384 points that turns every "," into
   * "%2C" and inflates the URL from ~5.5 KB to ~7 KB for no gain. Only digits,
   * '.', '-' and ',' appear here, all safe unencoded in a query value.
   */
  const query = [
    `latitude=${latParam.join(",")}`,
    `longitude=${lonParam.join(",")}`,
    "hourly=precipitation",
    `forecast_hours=${FORECAST_HOURS}`,
    "timezone=UTC",
    // Unix timestamps rather than ISO strings: ~17% less to download over a
    // 384-point grid, and no local-vs-UTC parsing ambiguity at the far end.
    "timeformat=unixtime",
  ].join("&");

  const res = await fetch(`${BASE_URL}?${query}`, { signal });
  if (!res.ok) {
    const err = new Error(`Open-Meteo grid responded with HTTP ${res.status}`);
    // A grid costs the API far more than a single-point call, so hitting the
    // rate limit is a real possibility worth backing off from properly.
    if (res.status === 429) err.name = "RateLimitError";
    throw err;
  }

  const body = (await res.json()) as OpenMeteoGridPoint | OpenMeteoGridPoint[];
  const points = Array.isArray(body) ? body : [body];

  const times = points[0]?.hourly?.time ?? [];
  const frames: ForecastFrame[] = times.map((time, step) => ({
    time,
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

/** Cells over which the overlay fades out at the grid's border. */
const FEATHER_CELLS = 1.5;

/**
 * Fades the outermost cells so the grid's rectangular border doesn't land on
 * the map as a hard line. Without this the edge of the data reads as a weather
 * front, which is worse than showing slightly less of it.
 */
function edgeFade(col: number, row: number, cols: number, rows: number): number {
  const distance = Math.min(
    col + 0.5,
    cols - 0.5 - col,
    row + 0.5,
    rows - 0.5 - row
  );
  return Math.max(0, Math.min(1, distance / FEATHER_CELLS));
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
    const fade = edgeFade(i % grid.cols, Math.floor(i / grid.cols), grid.cols, grid.rows);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = Math.round(a * fade * 255);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Least share of the viewport the grid must span to be worth drawing. Low on
 * purpose: the border is feathered, so a partly-covered view fades out rather
 * than ending in a hard line, and showing real data where it exists beats
 * blanking the layer the moment the user pans towards its edge.
 */
export const MIN_OVERLAP = 0.02;

/** How much of the viewport the grid actually spans, as a 0..1 fraction. */
export function overlapFraction(
  grid: ForecastGrid | null,
  extent: TileExtent | null
): number {
  if (!grid || !extent) return 0;
  const lon = Math.min(extent.east, grid.east) - Math.max(extent.west, grid.west);
  const lat = Math.min(extent.north, grid.north) - Math.max(extent.south, grid.south);
  if (lon <= 0 || lat <= 0) return 0;
  const viewLon = extent.east - extent.west;
  const viewLat = extent.north - extent.south;
  if (viewLon <= 0 || viewLat <= 0) return 0;
  return Math.min(1, (lon * lat) / (viewLon * viewLat));
}

/** True when the grid spans the whole of the given extent. */
export function coversBounds(
  grid: ForecastGrid | null,
  extent: TileExtent | null
): boolean {
  if (!grid || !extent) return false;
  return (
    extent.west >= grid.west &&
    extent.east <= grid.east &&
    extent.south >= grid.south &&
    extent.north <= grid.north
  );
}

/** True when the grid no longer covers enough of the given extent to be useful. */
export function needsRefetch(grid: ForecastGrid | null, extent: TileExtent): boolean {
  if (!coversBounds(grid, extent)) return true;

  // Also refetch once the view has zoomed far enough in that the grid is coarse.
  const gridSpan = grid!.east - grid!.west;
  const viewSpan = extent.east - extent.west;
  return viewSpan > 0 && gridSpan / viewSpan > 3;
}
