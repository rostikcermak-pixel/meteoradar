import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { useRadarStore } from "@/store/radarStore";
import { useMapStore } from "@/store/mapStore";
import {
  DWD_ATTRIBUTION,
  forecastImageUrl,
  type ImageRequest,
} from "@/lib/dwd";
import { useForecastImages } from "@/hooks/useForecastImages";

/** Rendered area beyond the viewport, so a small pan doesn't reach the edge. */
const PAD = 0.2;
/** Cap on requested pixels — DWD renders these server-side. */
const MAX_PX = 1400;

/**
 * Draws the selected forecast step, and quietly fetches every other step for
 * the same view so that scrubbing doesn't wait on the network.
 *
 * Each step is a single rendered image rather than a grid of tiles: at roughly
 * two seconds per request from DWD, one request per step is few enough to
 * prefetch them all, where eight-plus tiles per step was not.
 */
export default function ForecastLayer() {
  const map = useMap();
  const layerRef = useRef<L.ImageOverlay | null>(null);

  const timeline = useRadarStore((s) => s.timeline);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const forecastTimes = useRadarStore((s) => s.forecastTimes);
  const showForecast = useRadarStore((s) => s.showForecast);
  const opacity = useRadarStore((s) => s.opacity);
  const bounds = useMapStore((s) => s.bounds);

  const entry = timeline[frameIndex];
  const forecastTime = entry?.kind === "forecast" ? entry.time : null;

  /*
   * Prefetching a day of imagery is worth it for someone using the forecast,
   * and pure waste for someone who only ever watches the radar. Hold off until
   * they step past "now" once; from then on keep every step warm.
   */
  const [usesForecast, setUsesForecast] = useState(false);
  useEffect(() => {
    if (forecastTime != null) setUsesForecast(true);
  }, [forecastTime]);

  const rawRequest = useMemo<ImageRequest | null>(() => {
    if (!bounds) return null;
    const spanLon = bounds.east - bounds.west;
    const spanLat = bounds.north - bounds.south;
    if (spanLon <= 0 || spanLat <= 0) return null;

    const size = map.getSize();
    const scale = Math.min(1, MAX_PX / Math.max(size.x, size.y));
    return {
      west: bounds.west - spanLon * PAD,
      east: bounds.east + spanLon * PAD,
      south: Math.max(-84, bounds.south - spanLat * PAD),
      north: Math.min(84, bounds.north + spanLat * PAD),
      width: Math.max(64, size.x * (1 + 2 * PAD) * scale),
      height: Math.max(64, size.y * (1 + 2 * PAD) * scale),
    };
  }, [bounds, map]);

  /*
   * Both `bounds` and `forecastTimes` are rebuilt on a timer even when nothing
   * about them changed, and a fresh object identity here restarted the
   * downloads — measured as eight images fetched twice over. Key the work on
   * the values instead, so it only reruns when the view or the steps really
   * differ.
   */
  const requestKey = rawRequest
    ? [
        rawRequest.west.toFixed(4), rawRequest.south.toFixed(4),
        rawRequest.east.toFixed(4), rawRequest.north.toFixed(4),
        Math.round(rawRequest.width), Math.round(rawRequest.height),
      ].join(",")
    : "";
  const timesKey = forecastTimes.join(",");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const request = useMemo(() => rawRequest, [requestKey]);

  const urls = useMemo(() => {
    if (!request || !showForecast || !usesForecast) return new Map<number, string>();
    return new Map(
      forecastTimes.map((t) => [t, forecastImageUrl(request, t)] as const)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, timesKey, showForecast, usesForecast]);

  // Fetched up front and held locally, so stepping is a swap rather than a
  // request. See useForecastImages for why the browser can't do this for us.
  const images = useForecastImages(urls, forecastTime);

  useEffect(() => {
    /*
     * Prefer the copy we already hold, but fall back to fetching the step
     * straight from DWD when it hasn't been downloaded yet. Waiting only for
     * the local copy left the map blank whenever the user scrubbed faster than
     * the prefetch could fill — which reads as the forecast being broken
     * rather than merely loading.
     */
    const cached = forecastTime != null ? images.get(forecastTime) : undefined;
    const url = cached ?? (forecastTime != null ? urls.get(forecastTime) : undefined);

    if (!url || !request) {
      layerRef.current?.remove();
      layerRef.current = null;
      return;
    }

    const latLng = L.latLngBounds(
      [request.south, request.west],
      [request.north, request.east]
    );

    if (!layerRef.current) {
      const overlay = L.imageOverlay(url, latLng, {
        opacity,
        interactive: false,
        attribution: DWD_ATTRIBUTION,
        className: "mrad-forecast-overlay",
      });
      overlay.setZIndex(4);
      overlay.addTo(map);
      layerRef.current = overlay;
      overlay.on("load", () => useRadarStore.getState().setForecastStatus("ready"));
      overlay.on("error", () => useRadarStore.getState().setForecastStatus("error"));
    } else {
      layerRef.current.setBounds(latLng);
      layerRef.current.setUrl(url);
    }

    // A held copy is on screen at once; anything else has to come down first.
    useRadarStore.getState().setForecastStatus(cached ? "ready" : "loading");
  }, [forecastTime, images, urls, request, map, opacity]);

  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  useEffect(
    () => () => {
      layerRef.current?.remove();
      layerRef.current = null;
    },
    []
  );

  return null;
}
