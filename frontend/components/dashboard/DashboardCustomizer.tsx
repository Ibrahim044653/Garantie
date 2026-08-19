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
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Eye, EyeOff, RotateCcw, Save } from 'lucide-react';
import type { WidgetConfig, WidgetSize } from '@/types/dashboard';
import { WIDGET_LABELS, SIZE_LABELS } from '@/types/dashboard';

interface Props {
  config: WidgetConfig[];
  onSave: (config: WidgetConfig[]) => Promise<void>;
  onReset: () => Promise<void>;
  onClose: () => void;
}

interface SortableItemProps {
  widget: WidgetConfig;
  onToggle: () => void;
  onSizeChange: (size: WidgetSize) => void;
}

function SortableItem({ widget, onToggle, onSizeChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <span className="flex-1 text-xs font-medium text-slate-700 truncate">
        {WIDGET_LABELS[widget.id]}
      </span>

      <select
        value={widget.size}
        onChange={e => onSizeChange(e.target.value as WidgetSize)}
        className="text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-600 bg-white flex-shrink-0"
      >
        {(Object.entries(SIZE_LABELS) as [WidgetSize, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <button
        onClick={onToggle}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        title="Masquer le widget"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}

export function DashboardCustomizer({ config, onSave, onReset, onClose }: Props) {
  const [localConfig, setLocalConfig] = useState<WidgetConfig[]>([...config]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visibleWidgets = localConfig.filter(w => w.visible).sort((a, b) => a.position - b.position);
  const hiddenWidgets = localConfig.filter(w => !w.visible);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleWidgets.findIndex(w => w.id === active.id);
    const newIndex = visibleWidgets.findIndex(w => w.id === over.id);
    const reordered = arrayMove(visibleWidgets, oldIndex, newIndex);
    setLocalConfig(prev => {
      const hidden = prev.filter(w => !w.visible);
      return [...reordered.map((w, i) => ({ ...w, position: i })), ...hidden];
    });
  }

  function toggleWidget(id: string) {
    setLocalConfig(prev => {
      const updated = prev.map(w =>
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      // Re-index positions for visible widgets
      let pos = 0;
      return updated.map(w => w.visible ? { ...w, position: pos++ } : w);
    });
  }

  function changeSize(id: string, size: WidgetSize) {
    setLocalConfig(prev => prev.map(w => w.id === id ? { ...w, size } : w));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(localConfig);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await onReset();
      onClose();
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed top-16 right-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Personnaliser le tableau de bord</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Active widgets */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Widgets actifs ({visibleWidgets.length})
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleWidgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {visibleWidgets.map(widget => (
                    <SortableItem
                      key={widget.id}
                      widget={widget}
                      onToggle={() => toggleWidget(widget.id)}
                      onSizeChange={size => changeSize(widget.id, size)}
                    />
                  ))}
                  {visibleWidgets.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Aucun widget actif
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Hidden widgets */}
          {hiddenWidgets.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Widgets masqués ({hiddenWidgets.length})
              </p>
              <div className="space-y-1.5">
                {hiddenWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg"
                  >
                    <span className="flex-1 text-xs text-slate-400 truncate">
                      {WIDGET_LABELS[widget.id]}
                    </span>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-green-600 transition-colors"
                      title="Afficher le widget"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-slate-100 space-y-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {resetting ? 'Réinitialisation...' : 'Réinitialiser par défaut'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </>
  );
}
