export interface PlaceResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  type: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    format: "jsonv2",
    q: trimmed,
    limit: "6",
    addressdetails: "0",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Nominatim responded with HTTP ${res.status}`);
  return (await res.json()) as PlaceResult[];
}
