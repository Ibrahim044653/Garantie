'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { WidgetConfig } from '@/types/dashboard';
import { DEFAULT_WIDGET_CONFIG } from '@/types/dashboard';

export function useDashboardConfig() {
  const [config, setConfig] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/config')
      .then(res => setConfig(res.data.config))
      .catch(() => {
        // Fallback to default config if endpoint not available
        setConfig(DEFAULT_WIDGET_CONFIG);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig(newConfig: WidgetConfig[]) {
    setConfig(newConfig);
    try {
      await apiClient.put('/dashboard/config', { config: newConfig });
    } catch {
      // Silently fail — the local state is still updated
    }
  }

  async function resetConfig() {
    try {
      const res = await apiClient.delete('/dashboard/config');
      setConfig(res.data.config);
    } catch {
      setConfig(DEFAULT_WIDGET_CONFIG);
    }
  }

  return { config, loading, saveConfig, resetConfig };
}
