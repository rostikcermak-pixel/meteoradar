export interface RainViewerFrame {
  /** UNIX timestamp in seconds. */
  time: number;
  /** Tile path on the RainViewer tile host. */
  path: string;
}

export interface RainViewerRadar {
  /** Past ~2 hours of radar frames (10-minute cadence). */
  past: RainViewerFrame[];
  /** Nowcast radar frames (~30 minutes into the future). */
  nowcast: RainViewerFrame[];
}

export interface RainViewerSatellite {
  infrared: RainViewerFrame[];
}

export interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: RainViewerRadar;
  satellite: RainViewerSatellite;
}
