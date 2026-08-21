/**
 * Precipitation forecast imagery from Deutscher Wetterdienst's open WMS.
 *
 * This replaced a grid of point forecasts fetched from Open-Meteo. That
 * approach charged one API "location" per grid point, so a few minutes of
 * panning exhausted the free tier and the layer simply stopped working. It
 * also had to interpolate 384 samples into a field, which smeared showers into
 * blobs. DWD renders its own model server-side and serves it as map tiles:
 * no key, no per-location quota, and the real shape of the forecast.
 */

export const DWD_WMS_URL = "https://maps.dwd.de/geoserver/dwd/wms";

/** ICON-EU total precipitation, hourly sums, 0.0625° (~7 km) over Europe. */
export const DWD_LAYER = "dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H";
export const DWD_STYLE = "icon-eu_reg00625_fd_sl_totprec01h_lawa";

export const DWD_ATTRIBUTION =
  'Forecast &copy; <a href="https://www.dwd.de/copyright">DWD</a>';

/**
 * Hours of forecast to put on the timeline. The layer publishes roughly three
 * days ahead, so this stays well inside what the model actually offers.
 */
export const FORECAST_HOURS = 24;

/** WMS wants an ISO instant; the layer is published on whole hours in UTC. */
export function toWmsTime(unixSeconds: number): string {
  return `${new Date(unixSeconds * 1000).toISOString().slice(0, 13)}:00:00.000Z`;
}

/**
 * Hourly forecast instants, starting at the next whole hour. Generated rather
 * than read from GetCapabilities, whose document is ~850 KB — far too much to
 * pull down on a phone just to learn which hours exist.
 */
export function forecastTimes(hours = FORECAST_HOURS): number[] {
  const hourMs = 3600_000;
  const next = Math.ceil(Date.now() / hourMs) * hourMs;
  return Array.from({ length: hours }, (_, i) => (next + i * hourMs) / 1000);
}
