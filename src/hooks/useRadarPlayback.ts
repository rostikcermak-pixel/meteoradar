import { useEffect } from "react";
import { useRadarStore } from "@/store/radarStore";

/** Base milliseconds per 10-minute frame step at 1x speed. */
const BASE_STEP_MS = 850;

/**
 * Drives the radar animation loop. Each tick advances one 10-minute frame.
 * The configured speed (0.5x / 1x / 2x) scales the interval.
 */
export function useRadarPlayback() {
  const playing = useRadarStore((s) => s.playing);
  const speed = useRadarStore((s) => s.speed);
  const count = useRadarStore((s) => s.timeline.length);

  useEffect(() => {
    if (!playing || count === 0) return;
    const id = setInterval(() => {
      useRadarStore.getState().advance();
    }, BASE_STEP_MS / speed);
    return () => clearInterval(id);
  }, [playing, speed, count]);
}
