'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  Users,
  CreditCard,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import type { SearchHypotheque, SearchClient, SearchPret, SearchDocument } from '@/hooks/useGlobalSearch';

type ResultItem =
  | { _type: 'hypotheque'; item: SearchHypotheque }
  | { _type: 'client'; item: SearchClient }
  | { _type: 'pret'; item: SearchPret }
  | { _type: 'document'; item: SearchDocument };

function getItemUrl(entry: ResultItem): string {
  switch (entry._type) {
    case 'hypotheque':
      return `/hypotheques/${entry.item.id}`;
    case 'client':
      return `/clients/${entry.item.id}`;
    case 'pret':
      return `/prets/${entry.item.id}`;
    case 'document':
      return `/ged/${entry.item.id}`;
  }
}

const STATUT_COLORS: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  SOLDE: 'bg-slate-100 text-slate-600',
  EN_DEFAUT: 'bg-red-100 text-red-700',
};

export default function GlobalSearch() {
  const router = useRouter();
  const { open, handleClose, query, setQuery, results, loading } = useGlobalSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Flatten all results for keyboard navigation
  const allItems: ResultItem[] = [];
  if (results) {
    results.hypotheques.forEach((item) => allItems.push({ _type: 'hypotheque', item }));
    results.clients.forEach((item) => allItems.push({ _type: 'client', item }));
    results.prets.forEach((item) => allItems.push({ _type: 'pret', item }));
    results.documents.forEach((item) => allItems.push({ _type: 'document', item }));
  }

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && allItems[selectedIndex]) {
        e.preventDefault();
        router.push(getItemUrl(allItems[selectedIndex]));
        handleClose();
      }
    },
    [allItems, selectedIndex, router, handleClose]
  );

  const navigate = (entry: ResultItem) => {
    router.push(getItemUrl(entry));
    handleClose();
  };

  if (!open) return null;

  let itemCursor = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-20 px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de recherche */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          {loading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher clients, hypothèques, prêts..."
            className="flex-1 text-base outline-none text-slate-800 placeholder-slate-400 bg-transparent"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Résultats */}
        <div className="max-h-96 overflow-y-auto">
          {!query || query.length < 2 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Commencez à taper pour rechercher...
            </div>
          ) : loading && !results ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Recherche en cours...
            </div>
          ) : results && allItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Aucun résultat pour &ldquo;{query}&rdquo;
            </div>
          ) : results ? (
            <div className="py-2">
              {/* Hypothèques */}
              {results.hypotheques.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <Building2 className="w-3.5 h-3.5" />
                    Hypothèques
                  </div>
                  {results.hypotheques.map((h) => {
                    const idx = itemCursor++;
                    return (
                      <button
                        key={`hyp-${h.id}`}
                        onClick={() => navigate({ _type: 'hypotheque', item: h })}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-medium text-sm truncate">{h.nomClient}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-2">
                          <span>{h.numeroPret}</span>
                          {h.ville && <span>· {h.ville}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100">
                    <Users className="w-3.5 h-3.5" />
                    Clients
                  </div>
                  {results.clients.map((c) => {
                    const idx = itemCursor++;
                    const displayName = c.raisonSociale ?? `${c.nom}${c.prenom ? ' ' + c.prenom : ''}`;
                    return (
                      <button
                        key={`cli-${c.id}`}
                        onClick={() => navigate({ _type: 'client', item: c })}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-medium text-sm truncate">{displayName}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-2">
                          <span>{c.codeClient}</span>
                          {c.email && <span>· {c.email}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Prêts */}
              {results.prets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100">
                    <CreditCard className="w-3.5 h-3.5" />
                    Prêts
                  </div>
                  {results.prets.map((p) => {
                    const idx = itemCursor++;
                    return (
                      <button
                        key={`pret-${p.id}`}
                        onClick={() => navigate({ _type: 'pret', item: p })}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-medium text-sm">{p.numeroPret}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-2 flex-shrink-0">
                          {p.client?.nom && <span>{p.client.nom}</span>}
                          {p.statut && (
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                                STATUT_COLORS[p.statut] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.statut}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Documents */}
              {results.documents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100">
                    <FileText className="w-3.5 h-3.5" />
                    Documents
                  </div>
                  {results.documents.map((d) => {
                    const idx = itemCursor++;
                    return (
                      <button
                        key={`doc-${d.id}`}
                        onClick={() => navigate({ _type: 'document', item: d })}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-medium text-sm truncate">{d.titre}</span>
                        {d.type && (
                          <span className="text-xs text-slate-400 flex-shrink-0">{d.type}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Pied */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-500 font-mono">ESC</kbd>{' '}
            Fermer
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-500 font-mono">↑↓</kbd>{' '}
            Naviguer
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-500 font-mono">↵</kbd>{' '}
            Ouvrir
          </span>
        </div>
      </div>
    </div>
  );
}
