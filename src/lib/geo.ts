import type { GeoPoint } from "@/types/common";

/** Fallback location (London) used when geolocation is denied or unavailable. */
export const DEFAULT_CENTER: GeoPoint = { lat: 51.5074, lon: -0.1278 };
export const DEFAULT_LABEL = "London, United Kingdom";

export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  cancel: () => void;
}

/**
 * Creates a debounced version of the provided function.
 * The returned function exposes a `.cancel()` method to flush pending timers.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wrapped = ((...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as Debounced<A>;

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  return wrapped;
}
