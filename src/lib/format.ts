export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatHHMM(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatUnixHHMM(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatUnixDateTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Index of the hourly entry that contains the current time. */
export function currentHourIndex(times: string[]): number {
  const now = Date.now();
  let idx = 0;
  for (let i = 0; i < times.length; i += 1) {
    const t = new Date(times[i]).getTime();
    if (Number.isNaN(t)) continue;
    if (t <= now) idx = i;
    else break;
  }
  return idx;
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export function compassDirection(deg: number): string {
  if (deg == null || Number.isNaN(deg)) return "—";
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return COMPASS[idx] ?? "N";
}

export interface WeatherMeta {
  label: string;
  emoji: string;
}

export function weatherMeta(code: number): WeatherMeta {
  if (code === 0) return { label: "Clear sky", emoji: "☀️" };
  if (code === 1) return { label: "Mainly clear", emoji: "🌤️" };
  if (code === 2) return { label: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { label: "Overcast", emoji: "☁️" };
  if (code === 45 || code === 48) return { label: "Fog", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { label: "Rain", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { label: "Snow", emoji: "🌨️" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", emoji: "🌦️" };
  if (code === 85 || code === 86) return { label: "Snow showers", emoji: "🌨️" };
  if (code >= 95) return { label: "Thunderstorm", emoji: "⛈️" };
  return { label: "Unknown", emoji: "🌡️" };
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatPercent(n: number | null | undefined): string {
  return n == null ? "—" : `${Math.round(n)}%`;
}

export function formatMm(n: number | null | undefined): string {
  return n == null ? "—" : `${round1(n)} mm`;
}

export function formatWind(speedKmh: number | null | undefined): string {
  return speedKmh == null ? "—" : `${Math.round(speedKmh)} km/h`;
}

/** "Today" / "Tomorrow" / short weekday ("Wed") for a daily forecast date. */
export function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
