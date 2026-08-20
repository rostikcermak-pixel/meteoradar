import { useEffect, useRef } from "react";
import { useMapStore } from "@/store/mapStore";
import { notify } from "@/store/toastStore";
import { DEFAULT_CENTER } from "@/lib/geo";

const TIMEOUT_MS = 5000;

/**
 * Requests the browser geolocation on mount with a 5s timeout, and falls back
 * to the default coordinates (London) on error, refusal or timeout.
 */
export function useGeolocation() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!("geolocation" in navigator)) {
      notify("warning", "Location unavailable", "Using London as your default location.");
      useMapStore.getState().flyTo(DEFAULT_CENTER, 8);
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      notify("warning", "Location timed out", "Using London as your default location.");
      useMapStore.getState().flyTo(DEFAULT_CENTER, 8);
    }, TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const { latitude, longitude } = pos.coords;
        useMapStore.getState().setUserLocation({ lat: latitude, lon: longitude });
        useMapStore.getState().setLocationLabel("My location");
        useMapStore.getState().flyTo({ lat: latitude, lon: longitude }, 11);
        notify("success", "Location found", "Weather and radar centered on your position.");
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        notify(
          "warning",
          err.code === 1 ? "Location permission denied" : "Location unavailable",
          "Using London as your default location."
        );
        useMapStore.getState().flyTo(DEFAULT_CENTER, 8);
      },
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 60_000 }
    );

    return () => clearTimeout(timeout);
  }, []);
}
