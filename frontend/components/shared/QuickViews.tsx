'use client';
import { useAuth } from '@/contexts/AuthContext';

interface QuickView {
  id: string;
  label: string;
  icon: string;
  filters: Record<string, string | boolean | undefined>;
  roles?: string[]; // si undefined, visible par tous
}

const QUICK_VIEWS: QuickView[] = [
  { id: 'all', label: 'Toutes', icon: '🏦', filters: {} },
  { id: 'alertes', label: 'En alerte', icon: '⚠️', filters: { alerte: 'oui' } },
  { id: 'zone-a', label: 'Zone A', icon: '🟢', filters: { zone: 'ZONE_A' } },
  { id: 'zone-b', label: 'Zone B', icon: '🟡', filters: { zone: 'ZONE_B' } },
  { id: 'zone-c', label: 'Zone C', icon: '🔴', filters: { zone: 'ZONE_C' } },
  { id: 'expirees', label: 'Expertises expirées', icon: '📅', filters: { alerte: 'oui', alerteType: 'EXPERTISE_EXPIREE' }, roles: ['ADMIN', 'GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES'] },
  { id: 'shortfall', label: 'Shortfalls', icon: '📉', filters: { alerte: 'oui', alerteType: 'SHORTFALL' }, roles: ['ADMIN', 'RESPONSABLE_RISQUES'] },
];

interface Props {
  activeId: string;
  onSelect: (filters: Record<string, string | boolean | undefined>, id: string) => void;
}

export function QuickViews({ activeId, onSelect }: Props) {
  const { user } = useAuth();
  const visible = QUICK_VIEWS.filter(v => !v.roles || v.roles.includes(user?.role ?? ''));

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {visible.map(v => (
        <button
          key={v.id}
          onClick={() => onSelect(v.filters, v.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeId === v.id
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>{v.icon}</span>
          {v.label}
        </button>
      ))}
    </div>
  );
}
