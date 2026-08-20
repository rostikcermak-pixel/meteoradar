import { useWeatherStore } from "@/store/weatherStore";
import {
  celsiusToFahrenheit,
  currentHourIndex,
  formatHHMM,
  weatherMeta,
} from "@/lib/format";

const HOURS = 24;

export function HourlyForecast() {
  const data = useWeatherStore((s) => s.data);
  const unit = useWeatherStore((s) => s.unit);
  if (!data || data.hourly.length === 0) return null;

  const ci = currentHourIndex(data.hourly.map((h) => h.time));
  const points = data.hourly.slice(ci, ci + HOURS);
  if (points.length === 0) return null;

  const toDisplay = (c: number) =>
    unit === "celsius" ? Math.round(c) : celsiusToFahrenheit(c);

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Hourly · next 24h
      </h3>
      <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {points.map((h, i) => {
          const meta = weatherMeta(h.weatherCode);
          return (
            <div
              key={h.time}
              className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-1 py-2.5"
            >
              <span className="text-[11px] font-medium text-slate-400">
                {i === 0 ? "Now" : formatHHMM(h.time)}
              </span>
              <span className="text-base" aria-hidden>
                {meta.emoji}
              </span>
              <span className="text-xs font-semibold text-slate-100">
                {toDisplay(h.temperature)}°
              </span>
              <span className="text-[10px] font-medium text-sky-300">
                {Math.round(h.precipitationProbability)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
