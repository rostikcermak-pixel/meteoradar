import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { useRadarStore } from "@/store/radarStore";
import { useMapStore } from "@/store/mapStore";
import { coversBounds, frameToDataUrl } from "@/lib/forecast";

/**
 * Draws modelled precipitation for the selected forecast step as an image
 * overlay. RainViewer's free feed rarely returns nowcast tiles, so beyond the
 * last observed radar frame this is what the timeline shows.
 */
export default function ForecastLayer() {
  const map = useMap();
  const layerRef = useRef<L.ImageOverlay | null>(null);

  const forecast = useRadarStore((s) => s.forecast);
  const timeline = useRadarStore((s) => s.timeline);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const opacity = useRadarStore((s) => s.opacity);
  const bounds = useMapStore((s) => s.bounds);

  const entry = timeline[frameIndex];
  const gridIndexRaw = entry?.kind === "forecast" ? entry.gridIndex : null;

  /*
   * The grid is a fixed rectangle. Zooming out leaves it smaller than the
   * viewport, and drawing it then puts a hard-edged block of colour in the
   * middle of the map that reads as weather rather than as the edge of the
   * data. Withhold it until a grid covering the view arrives.
   */
  const covered = forecast != null && bounds != null && coversBounds(forecast, bounds);
  const gridIndex = covered ? gridIndexRaw : null;

  // Painting every step once keeps scrubbing and playback free of redraw cost.
  const frameUrls = useMemo(() => {
    if (!forecast) return [];
    return forecast.frames.map((f) => frameToDataUrl(forecast, f));
  }, [forecast]);

  useEffect(() => {
    if (!forecast || gridIndex == null) {
      layerRef.current?.remove();
      layerRef.current = null;
      return;
    }

    const url = frameUrls[gridIndex];
    if (!url) return;

    const bounds = L.latLngBounds(
      [forecast.south, forecast.west],
      [forecast.north, forecast.east]
    );

    if (!layerRef.current) {
      const overlay = L.imageOverlay(url, bounds, {
        opacity,
        interactive: false,
        className: "mrad-forecast-overlay",
      });
      overlay.setZIndex(4);
      overlay.addTo(map);
      layerRef.current = overlay;
    } else {
      layerRef.current.setBounds(bounds);
      layerRef.current.setUrl(url);
    }
  }, [forecast, frameUrls, gridIndex, map, opacity]);

  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => () => {
    layerRef.current?.remove();
    layerRef.current = null;
  }, []);

  return null;
}
