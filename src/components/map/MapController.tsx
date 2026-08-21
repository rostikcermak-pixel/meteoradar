import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMapStore } from "@/store/mapStore";

/**
 * Handles smooth flyTo transitions and syncs the viewport center/zoom back to
 * the store on every moveend.
 */
export default function MapController() {
  const map = useMap();

  const flyToken = useMapStore((s) => s.flyToken);
  const flyTarget = useMapStore((s) => s.flyTarget);
  const flyZoom = useMapStore((s) => s.flyZoom);

  useEffect(() => {
    if (!flyTarget) return;
    map.flyTo([flyTarget.lat, flyTarget.lon], flyZoom ?? map.getZoom(), {
      duration: 1.4,
      easeLinearity: 0.22,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToken]);

  const syncViewport = () => {
    const c = map.getCenter();
    const b = map.getBounds();
    useMapStore.getState().setCenter({ lat: c.lat, lon: c.lng });
    useMapStore.getState().setZoom(map.getZoom());
    useMapStore.getState().setBounds({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
    });
  };

  // Publish the initial viewport too — without this, layers that size
  // themselves to the visible area have nothing to work from until the first
  // pan.
  useEffect(() => {
    syncViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useMapEvents({ moveend: syncViewport });

  return null;
}
