import { useEffect } from "react";
import { useRadarStore } from "@/store/radarStore";

/**
 * Global playback shortcuts: Space toggles play/pause, Left/Right steps a
 * frame. Ignored while the user is typing in an input (e.g. the search box).
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          useRadarStore.getState().togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          useRadarStore.getState().stepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          useRadarStore.getState().stepBackward();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
