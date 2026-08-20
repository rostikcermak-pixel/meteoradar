import { useWeatherStore } from "@/store/weatherStore";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  celsiusToFahrenheit,
  compassDirection,
  currentHourIndex,
  formatMm,
  formatWind,
  weatherMeta,
} from "@/lib/format";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  direction?: number;
}

function StatCard({ icon, label, value, sub, direction }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <span aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-base font-semibold leading-tight text-slate-100">
          {value}
        </span>
        {direction != null && (
          <span
            className="inline-block text-xs text-sky-300"
            style={{ transform: `rotate(${direction}deg)` }}
            aria-hidden
          >
            ↑
          </span>
        )}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function ConditionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-28" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

export function CurrentConditions() {
  const data = useWeatherStore((s) => s.data);
  const status = useWeatherStore((s) => s.status);
  const unit = useWeatherStore((s) => s.unit);

  if (status === "loading" && !data) return <ConditionsSkeleton />;
  if (!data) return null;

  const c = data.current;
  const meta = weatherMeta(c.weather_code);
  const ci = currentHourIndex(data.hourly.map((h) => h.time));
  const hourNow = data.hourly[ci];
  const stormProb = Math.max(
    0,
    ...data.hourly.slice(ci, ci + 6).map((h) => h.precipitationProbability)
  );
  const temp =
    unit === "celsius"
      ? Math.round(c.temperature_2m)
      : celsiusToFahrenheit(c.temperature_2m);
  const feels =
    unit === "celsius"
      ? Math.round(c.apparent_temperature)
      : celsiusToFahrenheit(c.apparent_temperature);
  const sym = unit === "celsius" ? "°C" : "°F";

  return (
    <div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight text-slate-50">
            {temp}
          </span>
          <span className="text-xl font-semibold text-slate-400">{sym}</span>
        </div>
        <p className="mt-1 text-sm text-slate-300">
          <span className="mr-1">{meta.emoji}</span>
          {meta.label} · Feels like {feels}°
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatCard
          icon="💧"
          label="Humidity"
          value={`${Math.round(c.relative_humidity_2m)}%`}
        />
        <StatCard
          icon="🌡️"
          label="Pressure"
          value={`${Math.round(c.pressure_msl)}`}
          sub="hPa"
        />
        <StatCard
          icon="☀️"
          label="UV index"
          value={String(hourNow?.uvIndex ?? data.uvIndexMax)}
          sub={`max ${data.uvIndexMax}`}
        />
        <StatCard
          icon="💨"
          label="Wind"
          value={formatWind(c.wind_speed_10m)}
          sub={`from ${compassDirection(c.wind_direction_10m)}`}
          direction={c.wind_direction_10m}
        />
        <StatCard icon="🌧️" label="Rain rate" value={formatMm(c.rain)} sub="last hour" />
        <StatCard
          icon="⛈️"
          label="Storm prob."
          value={`${Math.round(stormProb)}%`}
          sub="next 6h"
        />
      </div>
    </div>
  );
}
