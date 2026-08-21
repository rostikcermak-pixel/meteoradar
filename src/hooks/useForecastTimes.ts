import { useEffect } from "react";
import { useRadarStore } from "@/store/radarStore";
import { forecastTimes } from "@/lib/dwd";

/** Re-anchor the forecast steps to the wall clock as hours tick over. */
const REFRESH_MS = 10 * 60 * 1000;

/**
 * Puts the forecast steps on the timeline. The imagery itself is fetched by
 * the map layer as tiles, so this costs nothing but a little arithmetic —
 * unlike the point-grid it replaced, which spent an API quota per step.
 */
export function useForecastTimes() {
  useEffect(() => {
    const apply = () => useRadarStore.getState().setForecastTimes(forecastTimes());
    apply();
    const id = setInterval(apply, REFRESH_MS);
    return () => clearInterval(id);
  }, []);
}
