import { useEffect } from "react";
import { useMapStore } from "@/store/mapStore";
import { useRadarStore } from "@/store/radarStore";
import { fetchForecastGrid, needsRefetch, coversBounds } from "@/lib/forecast";
import type { GeoBounds } from "@/types/common";
import { debounce } from "@/lib/geo";

/** Model runs update hourly; this keeps a long-lived tab in step with them. */
const REFRESH_MS = 20 * 60 * 1000;
/** A dropped request shouldn't wait out the full refresh interval. */
const RETRY_MS = 15 * 1000;
/**
 * A grid costs the API far more than a single-point call, and the free tier
 * does return 429. Backing off hard beats retrying into the same wall.
 */
const RATE_LIMIT_RETRY_MS = 90 * 1000;
/**
 * Padding around the viewport so small pans don't trigger a refetch. Kept
 * modest: every bit of padding spends grid resolution on area the user can't
 * see, which is what makes the forecast overlay look blurry.
 */
const PAD = 0.2;

function padBounds(b: GeoBounds): GeoBounds {
  const spanLon = b.east - b.west;
  const spanLat = b.north - b.south;
  return {
    west: b.west - spanLon * PAD,
    east: b.east + spanLon * PAD,
    south: Math.max(-84, b.south - spanLat * PAD),
    north: Math.min(84, b.north + spanLat * PAD),
  };
}

/**
 * Keeps the precipitation forecast grid in sync with the map view. Fetching is
 * debounced and skipped while the existing grid still covers the viewport, so
 * panning around doesn't hammer the API.
 */
export function useForecastGrid() {
  const bounds = useMapStore((s) => s.bounds);
  // Re-run only on meaningful viewport changes, not on every pixel of panning.
  const key = bounds
    ? [bounds.west, bounds.south, bounds.east, bounds.north]
        .map((n) => n.toFixed(2))
        .join(",")
    : "";

  useEffect(() => {
    if (!bounds) return;

    let cancelled = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async (force: boolean) => {
      const current = useRadarStore.getState().forecast;
      if (!force && !needsRefetch(current, bounds)) return;

      controller?.abort();
      controller = new AbortController();

      try {
        useRadarStore.getState().setForecastStatus("loading");
        const grid = await fetchForecastGrid(padBounds(bounds), controller.signal);
        if (cancelled) return;
        useRadarStore.getState().setForecast(grid);
        useRadarStore.getState().setForecastStatus("ready");
        timer = setTimeout(() => run(true), REFRESH_MS);
      } catch (e) {
        if (cancelled || (e as Error).name === "AbortError") return;

        // A failed refresh is only worth surfacing if it leaves the user with
        // nothing usable. When the grid we already hold still covers the view,
        // the forecast on screen is valid — just not freshly fetched — so
        // reporting an error would contradict the timeline.
        const held = useRadarStore.getState().forecast;
        useRadarStore
          .getState()
          .setForecastStatus(coversBounds(held, bounds) ? "ready" : "error");

        const wait =
          (e as Error).name === "RateLimitError" ? RATE_LIMIT_RETRY_MS : RETRY_MS;
        timer = setTimeout(() => run(true), wait);
      }
    };

    // Deliberately unhurried: pinch-zooming fires a burst of viewport changes,
    // and each grid request is expensive enough to get rate-limited.
    const load = debounce(() => run(false), 900);
    load();

    return () => {
      cancelled = true;
      load.cancel();
      controller?.abort();
      clearTimeout(timer);
    };
    // `bounds` is captured through `key`, which changes only on real movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
