export interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  is_day: number;
}

export interface OpenMeteoHourly {
  time: string[];
  precipitation: number[];
  precipitation_probability: number[];
  rain: number[];
  snowfall: number[];
  uv_index: number[];
}

export interface OpenMeteoDaily {
  time: string[];
  uv_index_max: number[];
  sunrise: string[];
  sunset: string[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
}

export interface HourlyPoint {
  time: string;
  precipitation: number;
  precipitationProbability: number;
  rain: number;
  snowfall: number;
  uvIndex: number;
}

export type AlertSeverity = "severe" | "warning" | "watch" | "info";

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
}

export interface WeatherData {
  current: OpenMeteoCurrent;
  hourly: HourlyPoint[];
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  timezone: string;
  utcOffsetSeconds: number;
  alerts: WeatherAlert[];
}
