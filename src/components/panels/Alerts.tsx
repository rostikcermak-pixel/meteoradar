import { useWeatherStore } from "@/store/weatherStore";
import type { AlertSeverity } from "@/types/weather";

const SEVERITY: Record<
  AlertSeverity,
  { color: string; bg: string; label: string }
> = {
  severe: { color: "text-rose-300", bg: "bg-rose-500", label: "Severe" },
  warning: { color: "text-amber-300", bg: "bg-amber-500", label: "Warning" },
  watch: { color: "text-yellow-300", bg: "bg-yellow-500", label: "Watch" },
  info: { color: "text-sky-300", bg: "bg-sky-500", label: "Info" },
};

export function Alerts() {
  const alerts = useWeatherStore((s) => s.data?.alerts ?? []);

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-500">
        <span className="mr-1.5 text-emerald-400">✓</span>
        No active weather advisories for this area.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const s = SEVERITY[a.severity];
        return (
          <div
            key={a.id}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${s.bg}`} />
              <span className="text-sm font-semibold text-slate-100">{a.title}</span>
              <span
                className={`ml-auto text-[10px] font-bold uppercase ${s.color}`}
              >
                {s.label}
              </span>
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-400">{a.description}</p>
            <p className="mt-1.5 text-[10px] text-slate-600">Source: {a.source}</p>
          </div>
        );
      })}
    </div>
  );
}
