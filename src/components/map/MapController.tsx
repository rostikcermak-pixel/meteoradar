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

  useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      useMapStore.getState().setCenter({ lat: c.lat, lon: c.lng });
      useMapStore.getState().setZoom(map.getZoom());
    },
  });

  return null;
}
