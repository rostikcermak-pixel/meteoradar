import { useWeatherStore } from "@/store/weatherStore";
import { cn } from "@/utils/cn";

export function UnitToggle() {
  const unit = useWeatherStore((s) => s.unit);
  const setUnit = useWeatherStore((s) => s.setUnit);

  return (
    <div className="glass flex items-center rounded-xl p-0.5 text-xs font-semibold">
      {(["celsius", "fahrenheit"] as const).map((u) => (
        <button
          key={u}
          onClick={() => setUnit(u)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 transition-colors",
            unit === u
              ? "bg-sky-500 text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {u === "celsius" ? "°C" : "°F"}
        </button>
      ))}
    </div>
  );
}
