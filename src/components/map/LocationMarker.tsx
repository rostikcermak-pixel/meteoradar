import { Marker } from "react-leaflet";
import * as L from "leaflet";
import { useMapStore } from "@/store/mapStore";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:26px;height:26px;">
    <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(56,189,248,0.45);animation:mrad-ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <span style="position:absolute;inset:6px;border-radius:9999px;background:#38bdf8;border:2px solid #ffffff;box-shadow:0 0 0 3px rgba(56,189,248,0.3);"></span>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const centerIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:9999px;border:2px solid rgba(255,255,255,0.75);background:rgba(255,255,255,0.08);box-shadow:0 0 0 1px rgba(0,0,0,0.45);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function LocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);
  const center = useMapStore((s) => s.center);

  return (
    <>
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={userIcon}
          interactive={false}
        />
      )}
      <Marker
        position={[center.lat, center.lon]}
        icon={centerIcon}
        interactive={false}
      />
    </>
  );
}
