'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface SearchHypotheque {
  id: number;
  nomClient: string;
  numeroPret: string;
  numeroTitreFoncier?: string;
  ville?: string;
  zoneGeographique?: string;
}

export interface SearchClient {
  id: number;
  codeClient: string;
  nom: string;
  prenom?: string;
  raisonSociale?: string;
  email?: string;
}

export interface SearchPret {
  id: number;
  numeroPret: string;
  codeClient: string;
  statut: string;
  client?: { nom: string };
}

export interface SearchDocument {
  id: number;
  titre: string;
  description?: string;
  type?: string;
}

export interface SearchResults {
  hypotheques: SearchHypotheque[];
  clients: SearchClient[];
  prets: SearchPret[];
  documents: SearchDocument[];
  total: number;
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get('/search', { params: { q } });
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
  }, []);

  return { open, setOpen, handleClose, query, setQuery, results, loading };
}
