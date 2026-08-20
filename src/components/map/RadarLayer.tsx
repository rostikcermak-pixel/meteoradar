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
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const opacity = useRadarStore((s) => s.opacity);

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
      opacity,
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
    if (!layer || !frames.length || !host) return;
    const frame = frames[Math.min(frameIndex, frames.length - 1)];
    layer.setUrl(radarTileTemplate(host, frame.path));
  }, [frameIndex, frames, host]);

  // Apply opacity changes.
  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  // Re-warm the cache when the viewport changes (debounced).
  useEffect(() => {
    const id = setTimeout(preloadVisible, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, center]);

  return null;
}
