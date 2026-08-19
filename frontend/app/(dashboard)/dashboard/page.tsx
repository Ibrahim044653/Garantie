'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Settings2 } from 'lucide-react';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DraggableWidget } from '@/components/dashboard/DraggableWidget';

// Taille → col-span Tailwind
const sizeClass: Record<string, string> = {
  sm:   'col-span-1',
  md:   'col-span-2',
  lg:   'col-span-3',
  full: 'col-span-4',
};

export default function DashboardPage() {
  const { config, loading, saveConfig, resetConfig } = useDashboardConfig();
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = config.findIndex(w => w.id === active.id);
    const newIndex = config.findIndex(w => w.id === over.id);
    const newConfig = arrayMove(config, oldIndex, newIndex).map((w, i) => ({
      ...w,
      position: i,
    }));
    saveConfig(newConfig);
  }

  const visibleWidgets = config
    .filter(w => w.visible)
    .sort((a, b) => a.position - b.position);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">
          Tableau de bord personnalisé — glissez les widgets pour les réorganiser
        </p>
        <button
          onClick={() => setCustomizerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          Personnaliser
        </button>
      </div>

      {/* Widget grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
            {visibleWidgets.map(widget => (
              <div
                key={widget.id}
                className={`${sizeClass[widget.size] ?? 'col-span-1'} max-lg:col-span-full sm:max-lg:col-span-2`}
              >
                <DraggableWidget id={widget.id} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500 text-sm mb-3">
            Aucun widget affiché. Utilisez &quot;Personnaliser&quot; pour en ajouter.
          </p>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Settings2 className="w-4 h-4" />
            Personnaliser le tableau de bord
          </button>
        </div>
      )}

      {/* Customizer panel */}
      {customizerOpen && (
        <DashboardCustomizer
          config={config}
          onSave={saveConfig}
          onReset={resetConfig}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
    </div>
  );
}
