import { useEffect } from "react";
import { useRadarStore } from "@/store/radarStore";
import { fetchRadarData } from "@/lib/rainviewer";

const REFRESH_MS = 5 * 60 * 1000;
const RETRY_MS = 15 * 1000;

/**
 * Fetches RainViewer frame metadata on mount and re-fetches every 5 minutes.
 * Past frames (2h) are merged with nowcast frames (future 30m). A failed
 * fetch retries after 15s instead of waiting out the full 5-minute interval,
 * so a transient outage doesn't strand the app in the error state.
 */
export function useRadarFrames() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        if (useRadarStore.getState().frames.length === 0) {
          useRadarStore.getState().setStatus("loading");
        }
        const data = await fetchRadarData();
        if (cancelled) return;
        const frames = [...data.radar.past, ...data.radar.nowcast];
        const satellite = data.satellite?.infrared ?? [];
        useRadarStore.getState().setData(frames, satellite, data.host);
        useRadarStore.getState().setStatus("ready");
        timeoutId = setTimeout(load, REFRESH_MS);
      } catch (e) {
        if (!cancelled) {
          useRadarStore.getState().setStatus(
            "error",
            e instanceof Error ? e.message : "Failed to load radar frames"
          );
          timeoutId = setTimeout(load, RETRY_MS);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);
}
