import { create } from "zustand";
import type { RainViewerFrame } from "@/types/radar";
import type { PlaybackSpeed } from "@/types/common";

export type RadarStatus = "idle" | "loading" | "ready" | "error";
export type ForecastStatus = "idle" | "loading" | "ready" | "error";

/**
 * One step on the scrubber. Observed radar tiles and modelled forecast frames
 * share a single timeline so the slider runs continuously from the past,
 * through now, into the forecast.
 */
export type TimelineEntry =
  | { kind: "radar"; time: number; path: string }
  | { kind: "forecast"; time: number };

interface RadarState {
  frames: RainViewerFrame[];
  satellite: RainViewerFrame[];
  host: string;
  status: RadarStatus;
  error: string | null;
  lastUpdated: number | null;

  /** Hourly forecast instants, in UNIX seconds. */
  forecastTimes: number[];
  forecastStatus: ForecastStatus;

  /** Radar frames followed by forecast frames. */
  timeline: TimelineEntry[];
  /** Index of the newest entry that is not in the future. */
  nowIndex: number;
  frameIndex: number;

  playing: boolean;
  speed: PlaybackSpeed;
  /** Overlay opacity in 0..1, shared by the radar and forecast layers. */
  opacity: number;
  showSatellite: boolean;
  showLegend: boolean;
  showForecast: boolean;

  setData: (
    frames: RainViewerFrame[],
    satellite: RainViewerFrame[],
    host: string
  ) => void;
  setStatus: (status: RadarStatus, error?: string | null) => void;
  setForecastTimes: (times: number[]) => void;
  setForecastStatus: (status: ForecastStatus) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setFrameIndex: (index: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  advance: () => void;
  cycleSpeed: () => void;
  setOpacity: (opacity: number) => void;
  toggleSatellite: () => void;
  toggleLegend: () => void;
  toggleForecast: () => void;
}

function buildTimeline(
  frames: RainViewerFrame[],
  forecastTimes: number[],
  showForecast: boolean
): TimelineEntry[] {
  const radar: TimelineEntry[] = frames.map((f) => ({
    kind: "radar",
    time: f.time,
    path: f.path,
  }));
  // Forecast steps are generated locally and land before the radar feed
  // answers. Holding them back until there are radar frames keeps the app from
  // opening on a forecast step and pulling imagery nobody asked to see.
  if (!showForecast || forecastTimes.length === 0 || radar.length === 0) {
    return radar;
  }

  // Only keep forecast steps that start after the last radar frame, so the two
  // sources never cover the same moment twice.
  const lastRadarTime = radar.length ? radar[radar.length - 1].time : 0;
  const future: TimelineEntry[] = forecastTimes
    .filter((time) => time > lastRadarTime)
    .map((time) => ({ kind: "forecast" as const, time }));

  return [...radar, ...future];
}

function resolveNowIndex(timeline: TimelineEntry[]): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const futureIdx = timeline.findIndex((e) => e.time > nowSec);
  return futureIdx === -1
    ? Math.max(0, timeline.length - 1)
    : Math.max(0, futureIdx - 1);
}

const clamp = (length: number, index: number) =>
  length === 0 ? 0 : Math.max(0, Math.min(length - 1, index));

export const useRadarStore = create<RadarState>((set, get) => ({
  frames: [],
  satellite: [],
  host: "",
  status: "idle",
  error: null,
  lastUpdated: null,

  forecastTimes: [],
  forecastStatus: "idle",

  timeline: [],
  nowIndex: 0,
  frameIndex: 0,

  playing: false,
  speed: 1,
  opacity: 0.85,
  showSatellite: false,
  showLegend: true,
  showForecast: true,

  setData: (frames, satellite, host) =>
    set((s) => {
      const timeline = buildTimeline(frames, s.forecastTimes, s.showForecast);
      const nowIndex = resolveNowIndex(timeline);
      return {
        frames,
        satellite,
        host,
        timeline,
        nowIndex,
        // Start at "now"; afterwards keep whatever the user was looking at.
        // Keyed on radar frames rather than the timeline, which can already
        // hold locally-generated forecast steps before the first feed arrives.
        frameIndex:
          s.frames.length === 0 ? nowIndex : clamp(timeline.length, s.frameIndex),
        lastUpdated: Date.now(),
      };
    }),

  setStatus: (status, error = null) => set({ status, error }),

  setForecastTimes: (forecastTimes) =>
    set((s) => {
      const timeline = buildTimeline(s.frames, forecastTimes, s.showForecast);
      return {
        forecastTimes,
        timeline,
        nowIndex: resolveNowIndex(timeline),
        frameIndex: clamp(timeline.length, s.frameIndex),
      };
    }),

  setForecastStatus: (forecastStatus) => set({ forecastStatus }),

  setPlaying: (playing) => set({ playing }),

  togglePlay: () => {
    const { timeline, playing, frameIndex } = get();
    if (!timeline.length) return;
    if (playing) {
      set({ playing: false });
    } else {
      const nextIndex = frameIndex >= timeline.length - 1 ? 0 : frameIndex;
      set({ playing: true, frameIndex: nextIndex });
    }
  },

  setFrameIndex: (index) =>
    set((s) => ({ frameIndex: clamp(s.timeline.length, index), playing: false })),

  stepForward: () =>
    set((s) => ({
      frameIndex:
        s.timeline.length === 0 ? 0 : (s.frameIndex + 1) % s.timeline.length,
      playing: false,
    })),

  stepBackward: () =>
    set((s) => ({
      frameIndex:
        s.timeline.length === 0
          ? 0
          : (s.frameIndex - 1 + s.timeline.length) % s.timeline.length,
      playing: false,
    })),

  advance: () =>
    set((s) => ({
      frameIndex:
        s.timeline.length === 0 ? 0 : (s.frameIndex + 1) % s.timeline.length,
    })),

  cycleSpeed: () =>
    set((s) => ({ speed: s.speed === 0.5 ? 1 : s.speed === 1 ? 2 : 0.5 })),

  setOpacity: (opacity) => set({ opacity }),
  toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
  toggleLegend: () => set((s) => ({ showLegend: !s.showLegend })),

  toggleForecast: () =>
    set((s) => {
      const showForecast = !s.showForecast;
      const timeline = buildTimeline(s.frames, s.forecastTimes, showForecast);
      return {
        showForecast,
        timeline,
        nowIndex: resolveNowIndex(timeline),
        frameIndex: clamp(timeline.length, s.frameIndex),
      };
    }),
}));
