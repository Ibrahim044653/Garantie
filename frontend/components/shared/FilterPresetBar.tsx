'use client';
import { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useFilterPresets } from '@/hooks/useFilterPresets';

interface Props {
  entity: string;
  currentFilters: Record<string, string | boolean | number | undefined>;
  onApply: (filters: Record<string, string | boolean | number | undefined>) => void;
}

export function FilterPresetBar({ entity, currentFilters, onApply }: Props) {
  const { presets, save, remove } = useFilterPresets(entity);
  const [saveMode, setSaveMode] = useState(false);
  const [name, setName] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    save(name.trim(), currentFilters);
    setName('');
    setSaveMode(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Presets chips */}
      {presets.map(p => (
        <div key={p.id} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs text-blue-700 group">
          <button onClick={() => onApply(p.filters)} className="hover:underline">{p.name}</button>
          <button onClick={() => remove(p.id)} className="ml-1 text-blue-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Save current filter */}
      {saveMode ? (
        <div className="flex items-center gap-1">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Nom du filtre..."
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleSave} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Sauvegarder</button>
          <button onClick={() => setSaveMode(false)} className="text-xs text-slate-400 hover:text-slate-600">Annuler</button>
        </div>
      ) : (
        <button
          onClick={() => setSaveMode(true)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Sauvegarder ce filtre
        </button>
      )}
    </div>
  );
}
