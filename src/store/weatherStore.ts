import { create } from "zustand";
import type { WeatherData } from "@/types/weather";
import type { UnitSystem } from "@/types/common";

export type WeatherStatus = "idle" | "loading" | "ready" | "error";

interface WeatherState {
  data: WeatherData | null;
  status: WeatherStatus;
  error: string | null;
  unit: UnitSystem;

  setData: (data: WeatherData) => void;
  setStatus: (status: WeatherStatus, error?: string | null) => void;
  setUnit: (unit: UnitSystem) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  data: null,
  status: "idle",
  error: null,
  unit: "celsius",

  setData: (data) => set({ data, status: "ready", error: null }),
  setStatus: (status, error = null) => set({ status, error }),
  setUnit: (unit) => set({ unit }),
}));
