import { SearchBar } from "@/components/controls/SearchBar";
import { UnitToggle } from "@/components/controls/UnitToggle";
import { CrosshairIcon } from "@/components/ui/icons";
import { useMapStore } from "@/store/mapStore";
import { notify } from "@/store/toastStore";
import { DEFAULT_CENTER } from "@/lib/geo";

export function Header() {
  const recenter = () => {
    const { userLocation, flyTo } = useMapStore.getState();
    if (userLocation) {
      flyTo(userLocation, 11);
      notify("info", "Recenter", "Map centered on your location.");
    } else {
      flyTo(DEFAULT_CENTER, 8);
      notify("info", "Recenter", "No saved location — recentered on London.");
    }
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 p-3">
      <div className="flex items-center gap-2">
        <div className="pointer-events-auto hidden items-center gap-2.5 rounded-xl glass px-3 py-2 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 shadow-lg shadow-sky-500/20">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="8" opacity={0.35} />
              <circle cx="12" cy="12" r="3.5" opacity={0.5} />
              <path d="M12 12 L18.5 5.5" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-50">
            Meteo<span className="text-sky-400">Radar</span>
          </span>
        </div>

        <div className="pointer-events-auto min-w-0 max-w-xl flex-1">
          <SearchBar />
        </div>

        <button
          onClick={recenter}
          className="pointer-events-auto flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl glass text-slate-300 transition-colors hover:text-white"
          aria-label="Recenter map"
          title="Recenter"
        >
          <CrosshairIcon className="h-5 w-5" />
        </button>

        <div className="pointer-events-auto shrink-0">
          <UnitToggle />
        </div>
      </div>
    </header>
  );
}
