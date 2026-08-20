import MapView from "@/components/map/MapView";
import { Header } from "@/components/Header";
import { WeatherPanel } from "@/components/panels/WeatherPanel";
import { BottomSheet } from "@/components/panels/BottomSheet";
import { Timeline } from "@/components/controls/Timeline";
import { PlaybackControls } from "@/components/controls/PlaybackControls";
import { LayerControls } from "@/components/controls/LayerControls";
import { ToastHost } from "@/components/ui/Toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRadarFrames } from "@/hooks/useRadarFrames";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useRadarPlayback } from "@/hooks/useRadarPlayback";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useForecastGrid } from "@/hooks/useForecastGrid";

export default function MeteoRadar() {
  useGeolocation();
  useRadarFrames();
  useForecastGrid();
  useWeatherData();
  useRadarPlayback();
  useKeyboardShortcuts();

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <MapView />

      <Header />

      {/* Desktop — left statistics panel */}
      <aside className="pointer-events-none absolute bottom-24 left-3 top-20 z-10 hidden w-80 lg:block">
        <div className="pointer-events-auto glass thin-scroll h-full overflow-y-auto rounded-2xl">
          <WeatherPanel />
        </div>
      </aside>

      {/* Desktop — right layer controls */}
      <aside className="pointer-events-none absolute right-3 top-20 z-10 hidden w-64 lg:block">
        <div className="pointer-events-auto glass rounded-2xl p-4">
          <LayerControls />
        </div>
      </aside>

      {/* Desktop — bottom timeline dock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 hidden justify-center lg:flex">
        <div className="pointer-events-auto glass flex w-[min(92vw,680px)] items-center gap-4 rounded-2xl px-4 py-3">
          <PlaybackControls />
          <div className="min-w-0 flex-1">
            <Timeline />
          </div>
        </div>
      </div>

      {/* Mobile — sliding bottom sheet */}
      <BottomSheet />

      <ToastHost />
    </div>
  );
}
