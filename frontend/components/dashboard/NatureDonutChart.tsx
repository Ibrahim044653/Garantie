'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NATURE_LABELS } from '@/lib/format';
import type { NatureBien } from '@/types';

interface NatureDonutChartProps {
  data: { nature: string; count: number }[];
}

const COLORS = ['#1e40af', '#0891b2', '#7c3aed', '#d97706', '#16a34a'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">
          {NATURE_LABELS[payload[0].name as NatureBien] ?? payload[0].name}
        </p>
        <p className="text-blue-600">{payload[0].value} dossiers</p>
      </div>
    );
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {payload?.map((entry: { color: string; value: string }, idx: number) => (
        <li key={idx} className="flex items-center gap-1 text-xs text-slate-600">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          {NATURE_LABELS[entry.value as NatureBien] ?? entry.value}
        </li>
      ))}
    </ul>
  );
}

export default function NatureDonutChart({ data }: NatureDonutChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="nature"
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={3}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
