import { useRadarStore } from "@/store/radarStore";
import { useMapStore } from "@/store/mapStore";
import { coversBounds } from "@/lib/forecast";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatUnixHHMM, formatUnixDateTime } from "@/lib/format";
import { cn } from "@/utils/cn";

function TimelineSkeleton() {
  return (
    <div className="w-full space-y-2 py-0.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

export function Timeline() {
  const timeline = useRadarStore((s) => s.timeline);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const setFrameIndex = useRadarStore((s) => s.setFrameIndex);
  const nowIndex = useRadarStore((s) => s.nowIndex);
  const status = useRadarStore((s) => s.status);
  const forecastStatus = useRadarStore((s) => s.forecastStatus);
  const forecast = useRadarStore((s) => s.forecast);
  const bounds = useMapStore((s) => s.bounds);

  if (status === "error" && timeline.length === 0) {
    return (
      <div className="py-1 text-xs font-medium text-rose-300">
        ⚠ Radar feed unavailable — retrying automatically.
      </div>
    );
  }

  if (timeline.length === 0) return <TimelineSkeleton />;

  const current = timeline[Math.min(frameIndex, timeline.length - 1)];
  const max = timeline.length - 1;
  const pct = max === 0 ? 0 : (frameIndex / max) * 100;
  const nowPct = max === 0 ? 0 : (nowIndex / max) * 100;
  const isForecast = current.kind === "forecast";
  // A failed refresh while forecast steps are still on the timeline is not
  // worth reporting — the steps are there and valid, just not re-fetched.
  const hasForecastSteps = timeline.some((e) => e.kind === "forecast");
  // The overlay is withheld when the grid doesn't span the view, so the
  // caption has to track the same condition or it will describe something the
  // map isn't showing.
  const covered = coversBounds(forecast, bounds);

  const caption = isForecast
    ? covered
      ? { text: "Modelled forecast (Open-Meteo) — coarser than live radar", warn: false }
      : forecastStatus === "error"
        ? { text: "Forecast unavailable for this area", warn: true }
        : { text: "Loading forecast for this area…", warn: false }
    : forecastStatus === "error" && !hasForecastSteps
      ? { text: "Forecast unavailable — showing observed radar only", warn: true }
      : { text: "", warn: false };

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-semibold leading-none text-slate-50">
            {formatUnixHHMM(current.time)}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              isForecast
                ? "bg-fuchsia-500/20 text-fuchsia-300"
                : "bg-sky-500/20 text-sky-300"
            )}
          >
            {isForecast ? "Forecast" : "Radar"}
          </span>
        </div>
        <span className="truncate text-[11px] text-slate-400">
          {formatUnixDateTime(current.time)}
        </span>
      </div>

      <div className="relative py-1">
        <input
          type="range"
          min={0}
          max={max}
          value={frameIndex}
          onChange={(e) => setFrameIndex(Number(e.target.value))}
          className="mrad-slider"
          style={{
            // Past is blue, forecast is magenta, split at the "now" marker.
            background: `linear-gradient(to right,
              rgba(56,189,248,0.9) 0%,
              rgba(56,189,248,0.9) ${Math.min(pct, nowPct)}%,
              rgba(217,70,239,0.85) ${Math.min(pct, nowPct)}%,
              rgba(217,70,239,0.85) ${pct}%,
              rgba(255,255,255,0.12) ${pct}%)`,
          }}
          aria-label="Radar and forecast timeline"
        />
        <span
          className="pointer-events-none absolute -top-0.5 h-3.5 w-px bg-white/50"
          style={{ left: `${nowPct}%` }}
        />
      </div>

      <div className="mt-0.5 flex justify-between text-[10px] font-medium text-slate-500">
        <span>{formatUnixHHMM(timeline[0].time)}</span>
        <span className="text-slate-400">now</span>
        <span>{formatUnixHHMM(timeline[max].time)}</span>
      </div>

      {/*
        Fixed height and always rendered: this sits in the bottom sheet's
        always-visible dock, so a line appearing or vanishing mid-scrub would
        resize the dock and make the sheet jump under the user's finger.
      */}
      <p
        className={cn(
          "mt-1.5 h-3.5 truncate text-[10px] leading-3.5",
          caption.warn ? "text-amber-300/80" : "text-slate-500"
        )}
      >
        {caption.text}
      </p>
    </div>
  );
}
