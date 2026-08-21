import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { useRadarStore } from "@/store/radarStore";
import {
  DWD_ATTRIBUTION,
  DWD_LAYER,
  DWD_STYLE,
  DWD_WMS_URL,
  toWmsTime,
} from "@/lib/dwd";

/** WMS params Leaflet forwards verbatim; `time` selects the forecast step. */
interface WmsOptions extends L.WMSOptions {
  time: string;
}

/**
 * Draws the selected forecast step as DWD model imagery. The server renders
 * whatever bounding box Leaflet asks for, so the layer always covers the view
 * exactly — there is no grid to fall short of the viewport, and nothing to
 * interpolate or feather.
 */
export default function ForecastLayer() {
  const map = useMap();
  const layerRef = useRef<L.TileLayer.WMS | null>(null);

  const timeline = useRadarStore((s) => s.timeline);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const opacity = useRadarStore((s) => s.opacity);

  const entry = timeline[frameIndex];
  const forecastTime = entry?.kind === "forecast" ? entry.time : null;

  useEffect(() => {
    if (forecastTime == null) {
      layerRef.current?.remove();
      layerRef.current = null;
      return;
    }

    const time = toWmsTime(forecastTime);

    if (!layerRef.current) {
      const layer = L.tileLayer.wms(DWD_WMS_URL, {
        layers: DWD_LAYER,
        styles: DWD_STYLE,
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity,
        attribution: DWD_ATTRIBUTION,
        time,
      } as WmsOptions);
      layer.setZIndex(4);
      layer.on("tileerror", () => useRadarStore.getState().setForecastStatus("error"));
      layer.on("load", () => useRadarStore.getState().setForecastStatus("ready"));
      layer.addTo(map);
      layerRef.current = layer;
    } else {
      layerRef.current.setParams({ time } as unknown as L.WMSParams);
    }
  }, [forecastTime, map, opacity]);

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
