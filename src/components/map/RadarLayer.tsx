import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { useRadarStore } from "@/store/radarStore";
import { useMapStore } from "@/store/mapStore";
import {
  radarTileTemplate,
  preloadFrames,
  RADAR_MAX_ZOOM,
  type TileExtent,
} from "@/lib/rainviewer";

/**
 * Renders the animated RainViewer radar overlay as a Leaflet tile layer.
 * Tiles for every frame are preloaded into the browser cache to eliminate
 * flicker during playback and timeline scrubbing.
 */
export default function RadarLayer() {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  const frames = useRadarStore((s) => s.frames);
  const host = useRadarStore((s) => s.host);
  const timeline = useRadarStore((s) => s.timeline);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const opacity = useRadarStore((s) => s.opacity);

  // Past the last observed frame the timeline switches to the forecast layer,
  // so the radar tiles must get out of the way rather than freeze on the
  // newest scan.
  const entry = timeline[frameIndex];
  const radarPath = entry?.kind === "radar" ? entry.path : null;

  const zoom = useMapStore((s) => s.zoom);
  const center = useMapStore((s) => s.center);

  const preloadVisible = () => {
    const { frames: f, host: h } = useRadarStore.getState();
    if (!f.length || !h) return;
    const b = map.getBounds();
    const extent: TileExtent = {
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
    };
    preloadFrames(h, f, extent, map.getZoom());
  };

  // Create the tile layer once frames + host are available.
  useEffect(() => {
    if (!frames.length || !host) return;
    const current = frames[Math.min(frameIndex, frames.length - 1)];
    const layer = L.tileLayer(radarTileTemplate(host, current.path), {
      opacity: radarPath ? opacity : 0,
      tileSize: 256,
      crossOrigin: "anonymous",
      maxNativeZoom: RADAR_MAX_ZOOM,
      maxZoom: 18,
    });
    layer.setZIndex(5);
    layer.addTo(map);
    layerRef.current = layer;

    preloadVisible();

    return () => {
      layer.remove();
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, host, map]);

  // Swap the tile source when the selected frame changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !host || !radarPath) return;
    layer.setUrl(radarTileTemplate(host, radarPath));
  }, [radarPath, host]);

  // Apply opacity changes, and hide the radar entirely on forecast steps.
  useEffect(() => {
    layerRef.current?.setOpacity(radarPath ? opacity : 0);
  }, [opacity, radarPath]);

  // Re-warm the cache when the viewport changes (debounced).
  useEffect(() => {
    const id = setTimeout(preloadVisible, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, center]);

  return null;
}
