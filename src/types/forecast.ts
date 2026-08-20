/** One hourly step of modelled precipitation over the grid. */
export interface ForecastFrame {
  /** UNIX timestamp in seconds. */
  time: number;
  /** Row-major precipitation values in mm/h; length === cols * rows. */
  values: number[];
}

/**
 * A rectangular grid of modelled precipitation covering a map extent.
 * Rows are spaced evenly in Web Mercator Y (not latitude) so the grid can be
 * drawn straight onto the map as an image overlay without distortion.
 */
export interface ForecastGrid {
  cols: number;
  rows: number;
  west: number;
  east: number;
  south: number;
  north: number;
  frames: ForecastFrame[];
}
