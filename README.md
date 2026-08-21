# MeteoRadar

Live, animated weather radar with precipitation forecasts and hyperlocal
conditions — running as a static site, hosted on GitHub Pages, updating
itself 24/7 with no server to maintain.

**Live app:** https://rostikcermak-pixel.github.io/meteoradar/

## Features

- **Animated precipitation radar** — the last ~2 hours of observed radar from
  [RainViewer](https://www.rainviewer.com/), with play/pause, step, speed
  control, and a scrubbable timeline.
- **Forecast on the same timeline** — the scrubber continues past "now" into
  24 hours of hourly precipitation forecast, drawn straight onto the map as
  DWD ICON-EU model imagery (~7 km). RainViewer's free feed returns no
  nowcast frames in practice, so this is what fills the future half of the
  timeline; forecast steps are labelled and coloured differently from
  observed radar, and can be switched off in the layer controls.
- **Infrared satellite overlay** and an adjustable radar opacity / intensity
  legend.
- **Hyperlocal current conditions** — temperature, feels-like, humidity,
  pressure, wind, UV index, and rain rate for whatever point is centered on
  the map, from [Open-Meteo](https://open-meteo.com/).
- **24-hour precipitation forecast chart** plus a **7-day forecast strip**
  (daily high/low, condition icon, rain chance), and derived weather
  advisories (heavy rain, snow, storms, high winds).
- **Place search** (via OpenStreetMap Nominatim) and automatic geolocation,
  with a graceful fallback if location access is denied.
- Auto-refreshing data (radar every 5 min, conditions every 10 min) so a tab
  left open stays accurate — no manual refresh required.
- Keyboard shortcuts: <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd>
  step a frame.
- Installable as a home-screen / desktop app (PWA manifest).
- Responsive layout: docked side panels on desktop, a swipe-up sheet on
  mobile.

## Tech stack

React 19 + TypeScript, Vite, Tailwind CSS v4, Leaflet / react-leaflet,
Zustand, Recharts. The production build is inlined into a single
`index.html` via `vite-plugin-singlefile`.

## Data sources

| Source | Used for |
| --- | --- |
| [RainViewer](https://www.rainviewer.com/api) | Radar & satellite tiles |
| [Open-Meteo](https://open-meteo.com/) | Current conditions, hourly & daily forecast |
| [DWD open WMS](https://maps.dwd.de/geoserver/dwd/wms) | ICON-EU precipitation forecast imagery |
| [OpenStreetMap Nominatim](https://nominatim.org/) | Place search / geocoding |
| [CARTO](https://carto.com/basemaps) | Dark basemap tiles |

All requests are made client-side, directly from the browser to each
provider — nothing is proxied or stored server-side.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes `dist/` to GitHub Pages automatically — no manual deploy
step.
