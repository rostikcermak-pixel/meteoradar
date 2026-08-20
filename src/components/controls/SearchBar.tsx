import { useEffect, useRef, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import { notify } from "@/store/toastStore";
import { searchPlaces, type PlaceResult } from "@/lib/nominatim";
import { debounce } from "@/lib/geo";
import { MapPinIcon, SearchIcon, XIcon } from "@/components/ui/icons";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useRef(
    debounce(async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const places = await searchPlaces(q, controller.signal);
        setResults(places);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          notify("error", "Search failed", "Could not reach the geocoding service.");
        }
      } finally {
        setLoading(false);
      }
    }, 300)
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      abortRef.current?.abort();
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debouncedSearch.current(value);
  };

  const select = (p: PlaceResult) => {
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    const label = p.display_name.split(",")[0] || p.name || "Selected place";
    useMapStore.getState().setLocationLabel(label);
    useMapStore.getState().flyTo({ lat, lon }, 11);
    setQuery(label);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="glass flex items-center gap-2 rounded-xl px-3 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search a city or place…"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
        />
        {loading && (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
        )}
        {query && !loading && (
          <button
            onClick={() => onChange("")}
            className="text-slate-400 transition-colors hover:text-slate-200"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="glass-strong absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => select(r)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
            >
              <MapPinIcon className="h-4 w-4 shrink-0 text-sky-400" />
              <span className="truncate">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
