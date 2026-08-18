'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface VncAreaChartProps {
  data: { mois: string; vnc: number }[];
}

function formatMillions(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-blue-600">
          VNC:{' '}
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
          })
            .format(payload[0].value)
            .replace('XOF', 'FCFA')}
        </p>
      </div>
    );
  }
  return null;
}

export default function VncAreaChart({ data }: VncAreaChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="vncGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1e40af" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="mois"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatMillions}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="vnc"
          stroke="#1e40af"
          strokeWidth={2.5}
          fill="url(#vncGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#1e40af', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
