import { useEffect } from "react";
import { useMapStore } from "@/store/mapStore";
import { useWeatherStore } from "@/store/weatherStore";
import { fetchWeather } from "@/lib/openmeteo";
import { debounce } from "@/lib/geo";

/** Keeps "current conditions" current even if the map center never changes. */
const AUTO_REFRESH_MS = 10 * 60 * 1000;

/**
 * Fetches Open-Meteo statistics for the active map center, debounced by 400ms
 * so panning the map does not flood the API, and re-fetches on an interval so
 * the "Live" badge stays honest for a session left open for hours.
 */
export function useWeatherData() {
  const lat = useMapStore((s) => s.center.lat);
  const lon = useMapStore((s) => s.center.lon);

  useEffect(() => {
    let cancelled = false;

    const run = async (latitude: number, longitude: number) => {
      try {
        const data = await fetchWeather(latitude, longitude);
        if (!cancelled) useWeatherStore.getState().setData(data);
      } catch (e) {
        if (!cancelled) {
          useWeatherStore.getState().setStatus(
            "error",
            e instanceof Error ? e.message : "Failed to load weather data"
          );
        }
      }
    };

    const load = debounce(run, 400);

    useWeatherStore.getState().setStatus("loading");
    load(lat, lon);

    const id = setInterval(() => run(lat, lon), AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      load.cancel();
      clearInterval(id);
    };
  }, [lat, lon]);
}
