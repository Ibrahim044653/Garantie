import type { StatutHypotheque, AlerteSeverite } from '@/types';
import { STATUT_LABELS, SEVERITE_LABELS } from '@/lib/format';

interface StatusBadgeProps {
  statut: StatutHypotheque;
  className?: string;
}

export function StatusBadge({ statut, className = '' }: StatusBadgeProps) {
  const colorMap: Record<StatutHypotheque, string> = {
    A_JOUR: 'badge-success',
    EXPERTISE_OBSOLETE: 'badge-danger',
    SHORTFALL: 'badge-warning',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorMap[statut]} ${className}`}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}

interface SeveriteBadgeProps {
  severite: AlerteSeverite;
  className?: string;
}

export function SeveriteBadge({ severite, className = '' }: SeveriteBadgeProps) {
  const colorMap: Record<AlerteSeverite, string> = {
    LOW: 'badge-muted',
    MEDIUM: 'badge-info',
    HIGH: 'badge-warning',
    CRITICAL: 'badge-danger',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorMap[severite]} ${className}`}
    >
      {SEVERITE_LABELS[severite]}
    </span>
  );
}
