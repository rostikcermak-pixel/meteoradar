import { useEffect } from "react";
import { useMapStore } from "@/store/mapStore";
import { useRadarStore } from "@/store/radarStore";
import { fetchForecastGrid, needsRefetch } from "@/lib/forecast";
import type { TileExtent } from "@/lib/rainviewer";
import { debounce } from "@/lib/geo";

/** Model runs update hourly; this keeps a long-lived tab in step with them. */
const REFRESH_MS = 20 * 60 * 1000;
/** Padding around the viewport so small pans don't trigger a refetch. */
const PAD = 0.35;

/**
 * Keeps the precipitation forecast grid in sync with the map view. Fetching is
 * debounced and skipped entirely while the existing grid still covers the
 * viewport, so panning around doesn't hammer the API.
 */
export function useForecastGrid() {
  const lat = useMapStore((s) => s.center.lat);
  const lon = useMapStore((s) => s.center.lon);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const run = async (force: boolean) => {
      // Approximate the viewport from centre + zoom; exact bounds aren't needed
      // because the grid is padded well beyond the visible area.
      const spanLon = (360 / Math.pow(2, zoom)) * 1.6;
      const spanLat = spanLon * 0.6;
      const extent: TileExtent = {
        west: lon - spanLon / 2,
        east: lon + spanLon / 2,
        south: Math.max(-84, lat - spanLat / 2),
        north: Math.min(84, lat + spanLat / 2),
      };

      if (!force && !needsRefetch(useRadarStore.getState().forecast, extent)) return;

      const padded: TileExtent = {
        west: extent.west - spanLon * PAD,
        east: extent.east + spanLon * PAD,
        south: Math.max(-84, extent.south - spanLat * PAD),
        north: Math.min(84, extent.north + spanLat * PAD),
      };

      controller?.abort();
      controller = new AbortController();

      try {
        useRadarStore.getState().setForecastStatus("loading");
        const grid = await fetchForecastGrid(padded, controller.signal);
        if (cancelled) return;
        useRadarStore.getState().setForecast(grid);
        useRadarStore.getState().setForecastStatus("ready");
      } catch (e) {
        if (cancelled || (e as Error).name === "AbortError") return;
        useRadarStore.getState().setForecastStatus("error");
      }
    };

    const load = debounce(() => run(false), 600);
    load();

    const id = setInterval(() => run(true), REFRESH_MS);

    return () => {
      cancelled = true;
      load.cancel();
      controller?.abort();
      clearInterval(id);
    };
  }, [lat, lon, zoom]);
}
