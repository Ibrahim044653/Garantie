import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  gradient: string; // Tailwind gradient classes
  iconBg?: string;
  badge?: { text: string; color: string };
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  gradient,
  badge,
}: StatsCardProps) {
  return (
    <div
      className={`rounded-xl p-5 text-white relative overflow-hidden ${gradient}`}
      style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
    >
      {/* Background decoration */}
      <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute right-4 bottom-0 w-16 h-16 rounded-full bg-white/5 translate-y-6" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-white/20 rounded-lg p-2.5">{icon}</div>
          {badge && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.color}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>

        {trend !== undefined && trendLabel && (
          <div className="flex items-center gap-1 mt-2">
            {trend >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-white/80" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-white/80" />
            )}
            <span className="text-xs text-white/80">
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}% {trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
