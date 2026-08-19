'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { WidgetId } from '@/types/dashboard';
import { KpiCard } from './widgets/KpiCard';
import { ChartEvolutionVNC } from './widgets/ChartEvolutionVNC';
import { ChartZones } from './widgets/ChartZones';
import { ChartNatures } from './widgets/ChartNatures';
import { ListAlertes } from './widgets/ListAlertes';
import { ListShortfalls } from './widgets/ListShortfalls';
import { TableZones } from './widgets/TableZones';
import { WidgetWorkflow } from './widgets/WidgetWorkflow';
import { WidgetEcheances } from './widgets/WidgetEcheances';

interface Props {
  id: WidgetId;
}

const KPI_IDS: WidgetId[] = [
  'kpi-vnc',
  'kpi-encours',
  'kpi-alertes',
  'kpi-ltv',
  'kpi-shortfalls',
  'kpi-provisions',
  'kpi-expected-loss',
  'kpi-taux-couverture',
  'kpi-nb-hypotheques',
];

function renderWidget(id: WidgetId): React.ReactNode {
  if (KPI_IDS.includes(id)) return <KpiCard id={id} />;
  switch (id) {
    case 'chart-evolution-vnc': return <ChartEvolutionVNC />;
    case 'chart-zones':         return <ChartZones />;
    case 'chart-natures':       return <ChartNatures />;
    case 'list-alertes':        return <ListAlertes />;
    case 'list-shortfalls':     return <ListShortfalls />;
    case 'table-zones':         return <TableZones />;
    case 'widget-workflow':     return <WidgetWorkflow />;
    case 'widget-echeances':    return <WidgetEcheances />;
    default:                    return null;
  }
}

export function DraggableWidget({ id }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full"
    >
      {/* Drag handle — only visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Widget content */}
      <div className="p-4">
        {renderWidget(id)}
      </div>
    </div>
  );
}
