import { useRadarStore } from "@/store/radarStore";
import { Toggle } from "@/components/ui/Toggle";
import { LayersIcon } from "@/components/ui/icons";

export function LayerControls() {
  const opacity = useRadarStore((s) => s.opacity);
  const setOpacity = useRadarStore((s) => s.setOpacity);
  const showSatellite = useRadarStore((s) => s.showSatellite);
  const toggleSatellite = useRadarStore((s) => s.toggleSatellite);
  const showLegend = useRadarStore((s) => s.showLegend);
  const toggleLegend = useRadarStore((s) => s.toggleLegend);

  const pct = Math.round(opacity * 100);

  return (
    <div className="space-y-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <LayersIcon className="h-4 w-4" /> Layers
      </span>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-300">Radar opacity</span>
          <span className="font-mono text-slate-400">{pct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="mrad-slider"
          style={{
            background: `linear-gradient(to right, rgba(56,189,248,0.9) 0%, rgba(56,189,248,0.9) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          }}
          aria-label="Radar opacity"
        />
      </div>

      <div className="space-y-2.5">
        <Toggle
          checked={showSatellite}
          onChange={toggleSatellite}
          label="Satellite infrared"
        />
        <Toggle
          checked={showLegend}
          onChange={toggleLegend}
          label="Intensity legend"
        />
      </div>

      {showLegend && (
        <div>
          <div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-500">
            <span>Light</span>
            <span>Moderate</span>
            <span>Heavy</span>
          </div>
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444, #d946ef)",
            }}
          />
        </div>
      )}
    </div>
  );
}
