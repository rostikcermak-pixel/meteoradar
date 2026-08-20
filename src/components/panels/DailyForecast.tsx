import { useWeatherStore } from "@/store/weatherStore";
import {
  celsiusToFahrenheit,
  formatDayLabel,
  formatPercent,
  weatherMeta,
} from "@/lib/format";

export function DailyForecast() {
  const data = useWeatherStore((s) => s.data);
  const unit = useWeatherStore((s) => s.unit);
  if (!data || data.daily.length === 0) return null;

  const toDisplay = (c: number) =>
    unit === "celsius" ? Math.round(c) : celsiusToFahrenheit(c);

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        7-day forecast
      </h3>
      <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {data.daily.map((d, i) => {
          const meta = weatherMeta(d.weatherCode);
          return (
            <div
              key={d.date}
              className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-1.5 py-2.5"
            >
              <span className="text-[11px] font-medium text-slate-400">
                {formatDayLabel(d.date, i)}
              </span>
              <span className="text-lg" aria-hidden>
                {meta.emoji}
              </span>
              <span className="text-xs font-semibold text-slate-100">
                {toDisplay(d.tempMax)}°
              </span>
              <span className="text-[11px] text-slate-500">{toDisplay(d.tempMin)}°</span>
              <span className="text-[10px] font-medium text-sky-300">
                {formatPercent(d.precipitationProbabilityMax)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
