import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWeatherStore } from "@/store/weatherStore";
import { currentHourIndex, formatHHMM, formatMm } from "@/lib/format";

interface ChartPoint {
  time: string;
  label: string;
  precip: number;
  prob: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="font-mono text-slate-300">{label}</p>
      <p className="mt-1 text-sky-300">Precip {formatMm(p.precip)}</p>
      <p className="text-slate-400">Chance {Math.round(p.prob)}%</p>
    </div>
  );
}

export function PrecipChart() {
  const data = useWeatherStore((s) => s.data);
  if (!data) return null;

  const ci = currentHourIndex(data.hourly.map((h) => h.time));
  const points: ChartPoint[] = data.hourly.slice(ci, ci + 24).map((h) => ({
    time: h.time,
    label: formatHHMM(h.time),
    precip: h.precipitation,
    prob: h.precipitationProbability,
  }));
  const next1h =
    data.hourly[ci + 1]?.precipitation ?? data.hourly[ci]?.precipitation ?? 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Precipitation · next 24h
        </h3>
        <span className="text-xs text-slate-400">
          1h accum
          <span className="ml-1 font-semibold text-sky-300">{formatMm(next1h)}</span>
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="precipFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              interval={3}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
            <Area
              type="monotone"
              dataKey="precip"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#precipFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
