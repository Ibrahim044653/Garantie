'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

interface ZoneBarChartProps {
  data: { zone: string; count: number; vnc: number }[];
}

const ZONE_COLORS: Record<string, string> = {
  A: '#1e40af',
  B: '#0891b2',
  C: '#7c3aed',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">Zone {label}</p>
        <p className="text-blue-600">Dossiers: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
}

export default function ZoneBarChart({ data }: ZoneBarChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="zone"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `Zone ${v}`}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend
          formatter={(value) => (value === 'count' ? 'Dossiers' : value)}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((entry) => (
            <Cell
              key={entry.zone}
              fill={ZONE_COLORS[entry.zone] ?? '#1e40af'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
