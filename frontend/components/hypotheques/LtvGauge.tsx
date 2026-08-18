'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface LtvGaugeProps {
  value: number; // 0-100+
  size?: 'sm' | 'md' | 'lg';
}

function getColor(ltv: number) {
  if (ltv <= 70) return '#16a34a';  // green — OK
  if (ltv <= 100) return '#d97706'; // amber — caution
  return '#dc2626';                 // red — critical
}

function getLabel(ltv: number) {
  if (ltv <= 70) return 'Optimal';
  if (ltv <= 100) return 'Attention';
  return 'Critique';
}

export default function LtvGauge({ value, size = 'md' }: LtvGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), 150);
  const ratio = clamped / 150; // fill ratio on 180° arc
  const fill = ratio * 100;
  const empty = 100 - fill;
  const color = getColor(value);

  const dims = size === 'sm' ? 120 : size === 'lg' ? 200 : 160;
  const fontSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  // Gauge data: filled portion + empty portion, only show half-circle
  const data = [
    { value: fill, color },
    { value: empty, color: '#e2e8f0' },
    { value: 100, color: 'transparent' }, // hidden bottom half
  ];

  return (
    <div className="gauge-container" style={{ width: dims, height: dims * 0.6 }}>
      <ResponsiveContainer width={dims} height={dims * 0.7}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={dims * 0.32}
            outerRadius={dims * 0.44}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center value */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{ bottom: '-4px' }}
      >
        <span className={`font-bold leading-tight ${fontSize}`} style={{ color }}>
          {value.toFixed(1)}%
        </span>
        <span className="text-xs text-slate-500 font-medium">{getLabel(value)}</span>
      </div>
    </div>
  );
}
