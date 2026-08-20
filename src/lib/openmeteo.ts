import type {
  DailyPoint,
  HourlyPoint,
  OpenMeteoResponse,
  WeatherAlert,
  WeatherData,
} from "@/types/weather";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_VARS =
  "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day";
const HOURLY_VARS = "precipitation,precipitation_probability,rain,snowfall,uv_index";
const DAILY_VARS =
  "uv_index_max,sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum";
/** Days of daily/hourly forecast to request, including today. */
const FORECAST_DAYS = 7;

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(5),
    longitude: lon.toFixed(5),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    timezone: "auto",
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: "kmh",
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo responded with HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  return mapWeather(data);
}

function mapWeather(data: OpenMeteoResponse): WeatherData {
  const hourly: HourlyPoint[] = (data.hourly?.time ?? []).map((time, i) => ({
    time,
    precipitation: data.hourly.precipitation?.[i] ?? 0,
    precipitationProbability: data.hourly.precipitation_probability?.[i] ?? 0,
    rain: data.hourly.rain?.[i] ?? 0,
    snowfall: data.hourly.snowfall?.[i] ?? 0,
    uvIndex: data.hourly.uv_index?.[i] ?? 0,
  }));

  const daily: DailyPoint[] = (data.daily?.time ?? []).map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code?.[i] ?? 0,
    tempMax: data.daily.temperature_2m_max?.[i] ?? 0,
    tempMin: data.daily.temperature_2m_min?.[i] ?? 0,
    precipitationProbabilityMax: data.daily.precipitation_probability_max?.[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum?.[i] ?? 0,
  }));

  return {
    current: data.current,
    hourly,
    daily,
    uvIndexMax: data.daily?.uv_index_max?.[0] ?? 0,
    sunrise: data.daily?.sunrise?.[0] ?? "",
    sunset: data.daily?.sunset?.[0] ?? "",
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
    alerts: deriveAlerts(data),
  };
}

/**
 * Open-Meteo's free endpoint does not return a structured severe-weather alert
 * feed, so we derive localized advisory conditions from the returned metrics.
 */
function deriveAlerts(data: OpenMeteoResponse): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const c = data.current;
  if (!c) return alerts;

  const code = c.weather_code;
  const gusts = c.wind_gusts_10m ?? 0;
  const probs = data.hourly?.precipitation_probability ?? [];
  const maxProb = probs.length ? Math.max(...probs.slice(0, 12)) : 0;
  const snow = data.hourly?.snowfall ?? [];
  const maxSnow = snow.length ? Math.max(...snow.slice(0, 12)) : 0;
  const rain = data.hourly?.rain ?? [];
  const maxRain = rain.length ? Math.max(...rain.slice(0, 12)) : 0;

  if (code >= 96) {
    alerts.push({
      id: "tstorm-hail",
      severity: "severe",
      title: "Severe thunderstorm",
      description: "Thunderstorm with hail forecast for your area. Seek shelter indoors.",
      source: "Open-Meteo",
    });
  } else if (code === 95) {
    alerts.push({
      id: "tstorm",
      severity: "warning",
      title: "Thunderstorm warning",
      description: "Thunderstorms expected with lightning and heavy downpours possible.",
      source: "Open-Meteo",
    });
  }

  if (maxSnow >= 5) {
    alerts.push({
      id: "snow",
      severity: "warning",
      title: "Heavy snow",
      description: `Up to ${maxSnow.toFixed(1)} mm of snowfall expected over the next 12 hours.`,
      source: "Open-Meteo",
    });
  } else if (maxSnow >= 1) {
    alerts.push({
      id: "snow-light",
      severity: "watch",
      title: "Snow possible",
      description: "Light snowfall is expected in the coming hours.",
      source: "Open-Meteo",
    });
  }

  if (maxRain >= 10) {
    alerts.push({
      id: "rain",
      severity: "warning",
      title: "Heavy rain",
      description: `Up to ${maxRain.toFixed(1)} mm of rainfall expected. Watch for localized flooding.`,
      source: "Open-Meteo",
    });
  } else if (maxProb >= 70) {
    alerts.push({
      id: "rain-possible",
      severity: "watch",
      title: "Rain likely",
      description: `${Math.round(maxProb)}% chance of precipitation in the next 12 hours.`,
      source: "Open-Meteo",
    });
  }

  if (gusts >= 100) {
    alerts.push({
      id: "wind-severe",
      severity: "severe",
      title: "Severe wind gusts",
      description: `Wind gusts up to ${Math.round(gusts)} km/h expected. Secure loose objects.`,
      source: "Open-Meteo",
    });
  } else if (gusts >= 60) {
    alerts.push({
      id: "wind",
      severity: "watch",
      title: "Strong winds",
      description: `Wind gusts up to ${Math.round(gusts)} km/h expected.`,
      source: "Open-Meteo",
    });
  }

  return alerts.slice(0, 4);
}
