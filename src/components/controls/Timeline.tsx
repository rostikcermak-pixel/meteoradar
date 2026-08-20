import { useRadarStore } from "@/store/radarStore";
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
  const frames = useRadarStore((s) => s.frames);
  const frameIndex = useRadarStore((s) => s.frameIndex);
  const setFrameIndex = useRadarStore((s) => s.setFrameIndex);
  const nowIndex = useRadarStore((s) => s.nowIndex);
  const status = useRadarStore((s) => s.status);

  if (status === "error") {
    return (
      <div className="py-1 text-xs font-medium text-rose-300">
        ⚠ Radar feed unavailable — retrying automatically.
      </div>
    );
  }

  if (status !== "ready" || frames.length === 0) {
    return <TimelineSkeleton />;
  }

  const current = frames[frameIndex];
  const max = frames.length - 1;
  const pct = max === 0 ? 0 : (frameIndex / max) * 100;
  const nowPct = max === 0 ? 0 : (nowIndex / max) * 100;
  const isFuture = current.time > Date.now() / 1000;

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
              isFuture
                ? "bg-fuchsia-500/20 text-fuchsia-300"
                : "bg-sky-500/20 text-sky-300"
            )}
          >
            {isFuture ? "Forecast" : "Radar"}
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
            background: `linear-gradient(to right, rgba(56,189,248,0.9) 0%, rgba(56,189,248,0.9) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          }}
          aria-label="Radar timeline"
        />
        <span
          className="pointer-events-none absolute -top-0.5 h-3.5 w-px bg-white/50"
          style={{ left: `${nowPct}%` }}
        />
      </div>

      <div className="mt-0.5 flex justify-between text-[10px] font-medium text-slate-500">
        <span>{formatUnixHHMM(frames[0].time)}</span>
        <span className="text-slate-400">now</span>
        <span>{formatUnixHHMM(frames[max].time)}</span>
      </div>
    </div>
  );
}
