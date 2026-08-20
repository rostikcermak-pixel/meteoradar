import { useMapStore } from "@/store/mapStore";
import { useWeatherStore } from "@/store/weatherStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { CurrentConditions } from "./CurrentConditions";
import { PrecipChart } from "./PrecipChart";
import { Alerts } from "./Alerts";

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-12 w-28" />
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function WeatherPanel() {
  const locationLabel = useMapStore((s) => s.locationLabel);
  const status = useWeatherStore((s) => s.status);
  const data = useWeatherStore((s) => s.data);
  const error = useWeatherStore((s) => s.error);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">
            {locationLabel}
          </p>
          <p className="truncate text-xs text-slate-400">
            {data?.timezone ?? "Locating…"}
          </p>
        </div>
        {data && (
          <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
            Live
          </span>
        )}
      </div>

      {status === "loading" && !data && <PanelSkeleton />}

      {status === "error" && !data && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p className="font-semibold">Weather unavailable</p>
          <p className="mt-0.5 text-rose-300/80">
            {error ?? "Could not reach the weather service."}
          </p>
        </div>
      )}

      {data && (
        <>
          <CurrentConditions />
          <PrecipChart />
          <Alerts />
        </>
      )}
    </div>
  );
}
