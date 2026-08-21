import { useEffect, useRef, useState } from "react";

/**
 * Downloads each forecast step once and hands back a local object URL for it.
 *
 * Preloading through `new Image()` does not work here: DWD sends no caching
 * headers at all, so the browser discards the fetched image and the map
 * re-downloads it the moment the overlay asks for the same URL — measured as
 * every frame being fetched twice, with each scrub still waiting on the
 * network. Holding the bytes ourselves makes stepping a local swap.
 */
export function useForecastImages(urls: Map<number, string>) {
  const [ready, setReady] = useState<Map<number, string>>(new Map());
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    if (urls.size === 0) {
      setReady(new Map());
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const created: string[] = [];
    const resolved = new Map<number, string>();

    // Chronological, a few at a time: users scrub forward from "now", so this
    // fills in roughly the order they'll ask for. Fetching one at a time left
    // the far end of the timeline still downloading when they got there;
    // all at once would swamp a public service and the map's own tiles.
    const queue = [...urls.entries()].sort((a, b) => a[0] - b[0]);
    let next = 0;

    const worker = async () => {
      while (!cancelled) {
        const item = queue[next++];
        if (!item) return;
        const [time, url] = item;
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) continue;
          const blob = await res.blob();
          if (cancelled) return;
          const objectUrl = URL.createObjectURL(blob);
          created.push(objectUrl);
          resolved.set(time, objectUrl);
          setReady(new Map(resolved));
        } catch {
          if (cancelled) return;
        }
      }
    };

    void Promise.all(Array.from({ length: 4 }, worker));

    return () => {
      cancelled = true;
      controller.abort();
      // Revoke the previous view's images once the new ones have replaced them.
      const stale = objectUrls.current;
      objectUrls.current = created;
      stale.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current = [];
    },
    []
  );

  return ready;
}
