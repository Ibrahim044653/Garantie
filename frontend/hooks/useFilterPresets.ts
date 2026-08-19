'use client';
import { useState, useEffect } from 'react';

export interface FilterPreset {
  id: string;
  name: string;
  entity: string;
  filters: Record<string, string | boolean | number | undefined>;
  createdAt: string;
}

const STORAGE_KEY = 'sgh-filter-presets';

export function useFilterPresets(entity: string) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: FilterPreset[] = JSON.parse(stored);
        setPresets(all.filter(p => p.entity === entity));
      }
    } catch {}
  }, [entity]);

  function save(name: string, filters: Record<string, string | boolean | number | undefined>) {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      entity,
      filters,
      createdAt: new Date().toISOString(),
    };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all: FilterPreset[] = stored ? JSON.parse(stored) : [];
      all.push(newPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setPresets(prev => [...prev, newPreset]);
    } catch {}
    return newPreset;
  }

  function remove(id: string) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all: FilterPreset[] = stored ? JSON.parse(stored) : [];
      const updated = all.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPresets(prev => prev.filter(p => p.id !== id));
    } catch {}
  }

  return { presets, save, remove };
}
