import { useRadarStore } from "@/store/radarStore";
import {
  PauseIcon,
  PlayIcon,
  StepBackIcon,
  StepForwardIcon,
} from "@/components/ui/icons";
import { cn } from "@/utils/cn";

export function PlaybackControls() {
  const playing = useRadarStore((s) => s.playing);
  const togglePlay = useRadarStore((s) => s.togglePlay);
  const stepForward = useRadarStore((s) => s.stepForward);
  const stepBackward = useRadarStore((s) => s.stepBackward);
  const speed = useRadarStore((s) => s.speed);
  const cycleSpeed = useRadarStore((s) => s.cycleSpeed);
  const status = useRadarStore((s) => s.status);

  const disabled = status !== "ready";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={stepBackward}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40"
        aria-label="Step back"
      >
        <StepBackIcon className="h-5 w-5" />
      </button>

      <button
        onClick={togglePlay}
        disabled={disabled}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-40",
          "bg-sky-500 shadow-sky-500/30 hover:bg-sky-400"
        )}
        aria-label={playing ? "Pause" : "Play"}
        title={`${playing ? "Pause" : "Play"} (Space)`}
      >
        {playing ? (
          <PauseIcon className="h-5 w-5" />
        ) : (
          <PlayIcon className="h-5 w-5 translate-x-0.5" />
        )}
      </button>

      <button
        onClick={stepForward}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40"
        aria-label="Step forward"
      >
        <StepForwardIcon className="h-5 w-5" />
      </button>

      <button
        onClick={cycleSpeed}
        disabled={disabled}
        className="ml-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-xs font-semibold text-sky-300 transition-colors hover:bg-white/10 disabled:opacity-40"
        aria-label="Playback speed"
      >
        {speed}x
      </button>
    </div>
  );
}
