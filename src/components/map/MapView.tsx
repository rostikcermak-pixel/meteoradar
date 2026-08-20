import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useMapStore } from "@/store/mapStore";
import RadarLayer from "./RadarLayer";
import ForecastLayer from "./ForecastLayer";
import SatelliteLayer from "./SatelliteLayer";
import MapController from "./MapController";
import LocationMarker from "./LocationMarker";

const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

export default function MapView() {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
        attributionControl
        preferCanvas
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          url={CARTO_DARK}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <SatelliteLayer />
        <ForecastLayer />
        <RadarLayer />
        <LocationMarker />
        <MapController />
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}
