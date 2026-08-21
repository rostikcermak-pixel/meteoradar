import { useEffect, useRef, useState } from "react";

/** Parallel downloads — enough to stay ahead of scrubbing, gentle on DWD. */
const WORKERS = 4;

const NONE: ReadonlyMap<number, string> = new Map();

/**
 * Downloads each forecast step once and hands back a local object URL for it.
 *
 * Preloading through `new Image()` does not work here: DWD sends no caching
 * headers at all, so the browser discards the fetched image and the map
 * re-downloads it the moment the overlay asks for the same URL — measured as
 * every frame fetched twice, with each scrub still waiting on the network.
 * Holding the bytes ourselves makes stepping a local swap.
 *
 * @param anchor the step on screen, so whatever the user is looking at is
 *   fetched before the rest of the timeline.
 */
export function useForecastImages(
  urls: Map<number, string>,
  anchor: number | null
) {
  /*
   * Tagged with the request set it belongs to. State updates land after the
   * render that changed `urls`, so without this the map would spend one commit
   * still holding the previous view's images — which are about to be revoked,
   * and belong to different coordinates anyway.
   */
  const [state, setState] = useState<{
    owner: Map<number, string>;
    ready: Map<number, string>;
  }>({ owner: new Map(), ready: new Map() });
  const activeRef = useRef<string[]>([]);
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    /*
     * Images belong to the view they were rendered for. Carrying them into a
     * new view would draw the old area's rain at the new area's coordinates,
     * and the object URLs revoked here would make the map request something
     * that no longer exists — which surfaced as "forecast imagery
     * unavailable" on every zoom. Start the new view empty instead.
     */
    const stale = activeRef.current;
    activeRef.current = [];
    setState({ owner: urls, ready: new Map() });
    stale.forEach((u) => URL.revokeObjectURL(u));

    if (urls.size === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const resolved = new Map<number, string>();
    const pending = new Set(urls.keys());

    /** Nearest step to whatever is on screen right now. */
    const pick = (): number | null => {
      if (pending.size === 0) return null;
      const target = anchorRef.current ?? Math.min(...pending);
      let best: number | null = null;
      let bestDistance = Infinity;
      for (const time of pending) {
        const distance = Math.abs(time - target);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = time;
        }
      }
      if (best !== null) pending.delete(best);
      return best;
    };

    const worker = async () => {
      while (!cancelled) {
        const time = pick();
        if (time === null) return;
        try {
          const res = await fetch(urls.get(time)!, { signal: controller.signal });
          if (!res.ok) continue;
          const blob = await res.blob();
          if (cancelled) return;
          const objectUrl = URL.createObjectURL(blob);
          activeRef.current.push(objectUrl);
          resolved.set(time, objectUrl);
          setState({ owner: urls, ready: new Map(resolved) });
        } catch {
          if (cancelled) return;
        }
      }
    };

    void Promise.all(Array.from({ length: WORKERS }, worker));

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [urls]);

  useEffect(
    () => () => {
      activeRef.current.forEach((u) => URL.revokeObjectURL(u));
      activeRef.current = [];
    },
    []
  );

  return state.owner === urls ? state.ready : NONE;
}
