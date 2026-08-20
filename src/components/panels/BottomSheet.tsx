import { useState } from "react";
import { useMapStore } from "@/store/mapStore";
import { useWeatherStore } from "@/store/weatherStore";
import { ChevronUpIcon } from "@/components/ui/icons";
import { Timeline } from "@/components/controls/Timeline";
import { PlaybackControls } from "@/components/controls/PlaybackControls";
import { LayerControls } from "@/components/controls/LayerControls";
import { WeatherPanel } from "./WeatherPanel";
import { celsiusToFahrenheit, weatherMeta } from "@/lib/format";
import { cn } from "@/utils/cn";

export function BottomSheet() {
  const [open, setOpen] = useState(false);
  const data = useWeatherStore((s) => s.data);
  const unit = useWeatherStore((s) => s.unit);
  const locationLabel = useMapStore((s) => s.locationLabel);

  const temp = data
    ? unit === "celsius"
      ? Math.round(data.current.temperature_2m)
      : celsiusToFahrenheit(data.current.temperature_2m)
    : null;
  const meta = data ? weatherMeta(data.current.weather_code) : null;
  const sym = unit === "celsius" ? "°C" : "°F";

  return (
    <div className="lg:hidden">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
        )}
      >
        <div className="glass-strong rounded-t-3xl">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full flex-col items-center px-4 pb-3 pt-2.5"
          >
            <span className="h-1.5 w-10 rounded-full bg-white/20" />
            <div className="mt-2 flex w-full items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden>
                  {meta?.emoji ?? "🌦️"}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight text-slate-100">
                    {temp != null ? `${temp}${sym}` : "—"} · {meta?.label ?? "Loading"}
                  </p>
                  <p className="max-w-[200px] truncate text-xs text-slate-400">
                    {locationLabel}
                  </p>
                </div>
              </div>
              <ChevronUpIcon
                className={cn(
                  "h-5 w-5 text-slate-400 transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </button>

          <div className="thin-scroll max-h-[72vh] overflow-y-auto px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <Timeline />
              <div className="mt-3 flex justify-center">
                <PlaybackControls />
              </div>
            </div>
            <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <WeatherPanel />
            </div>
            {/* Layer settings last: forecasts matter more than map options. */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <LayerControls />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
