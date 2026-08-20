import { create } from "zustand";
import type { RainViewerFrame } from "@/types/radar";
import type { PlaybackSpeed } from "@/types/common";

export type RadarStatus = "idle" | "loading" | "ready" | "error";

interface RadarState {
  frames: RainViewerFrame[];
  satellite: RainViewerFrame[];
  host: string;
  status: RadarStatus;
  error: string | null;
  lastUpdated: number | null;
  /** Index of the most recent "now" frame (end of the past window). */
  nowIndex: number;
  frameIndex: number;
  playing: boolean;
  speed: PlaybackSpeed;
  /** Radar tile opacity in 0..1. */
  opacity: number;
  showSatellite: boolean;
  showLegend: boolean;

  setData: (
    frames: RainViewerFrame[],
    satellite: RainViewerFrame[],
    host: string
  ) => void;
  setStatus: (status: RadarStatus, error?: string | null) => void;
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
}

const clampIndex = (frames: RainViewerFrame[], index: number) =>
  frames.length === 0 ? 0 : Math.max(0, Math.min(frames.length - 1, index));

export const useRadarStore = create<RadarState>((set, get) => ({
  frames: [],
  satellite: [],
  host: "",
  status: "idle",
  error: null,
  lastUpdated: null,
  nowIndex: 0,
  frameIndex: 0,
  playing: false,
  speed: 1,
  opacity: 0.85,
  showSatellite: false,
  showLegend: true,

  setData: (frames, satellite, host) =>
    set((s) => {
      const nowSec = Math.floor(Date.now() / 1000);
      const futureIdx = frames.findIndex((f) => f.time > nowSec);
      const resolvedNow =
        futureIdx === -1 ? frames.length - 1 : Math.max(0, futureIdx - 1);
      const keepIndex =
        s.frames.length === 0 ? resolvedNow : clampIndex(frames, s.frameIndex);
      return {
        frames,
        satellite,
        host,
        nowIndex: resolvedNow,
        frameIndex: keepIndex,
        lastUpdated: nowSec * 1000,
      };
    }),

  setStatus: (status, error = null) => set({ status, error }),

  setPlaying: (playing) => set({ playing }),

  togglePlay: () => {
    const { frames, playing, frameIndex } = get();
    if (!frames.length) return;
    if (playing) {
      set({ playing: false });
    } else {
      const nextIndex = frameIndex >= frames.length - 1 ? 0 : frameIndex;
      set({ playing: true, frameIndex: nextIndex });
    }
  },

  setFrameIndex: (index) =>
    set((s) => ({ frameIndex: clampIndex(s.frames, index), playing: false })),

  stepForward: () =>
    set((s) => ({
      frameIndex:
        s.frames.length === 0 ? 0 : (s.frameIndex + 1) % s.frames.length,
      playing: false,
    })),

  stepBackward: () =>
    set((s) => ({
      frameIndex:
        s.frames.length === 0
          ? 0
          : (s.frameIndex - 1 + s.frames.length) % s.frames.length,
      playing: false,
    })),

  advance: () =>
    set((s) => ({
      frameIndex:
        s.frames.length === 0 ? 0 : (s.frameIndex + 1) % s.frames.length,
    })),

  cycleSpeed: () =>
    set((s) => ({ speed: s.speed === 0.5 ? 1 : s.speed === 1 ? 2 : 0.5 })),

  setOpacity: (opacity) => set({ opacity }),
  toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
  toggleLegend: () => set((s) => ({ showLegend: !s.showLegend })),
}));
