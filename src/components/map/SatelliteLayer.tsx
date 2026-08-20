import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { useRadarStore } from "@/store/radarStore";
import { satelliteTileTemplate, RADAR_MAX_ZOOM } from "@/lib/rainviewer";

/**
 * Optional infrared satellite overlay using the latest RainViewer satellite
 * frame. Rendered beneath the radar layer.
 */
export default function SatelliteLayer() {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  const host = useRadarStore((s) => s.host);
  const satellite = useRadarStore((s) => s.satellite);
  const show = useRadarStore((s) => s.showSatellite);

  useEffect(() => {
    const layer = layerRef.current;

    if (show && !layer && satellite.length && host) {
      const latest = satellite[satellite.length - 1];
      const tl = L.tileLayer(satelliteTileTemplate(host, latest.path), {
        opacity: 0.85,
        tileSize: 256,
        crossOrigin: "anonymous",
        maxNativeZoom: RADAR_MAX_ZOOM,
        maxZoom: 18,
      });
      tl.setZIndex(3);
      tl.addTo(map);
      layerRef.current = tl;
    } else if (!show && layer) {
      layer.remove();
      layerRef.current = null;
    }
  }, [show, satellite, host, map]);

  return null;
}
