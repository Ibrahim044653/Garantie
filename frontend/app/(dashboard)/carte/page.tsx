'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { MapPin, AlertTriangle, Filter, X, Loader2 } from 'lucide-react';
import type { HypothequePoint } from '@/components/carte/MapView';

// Import dynamique — Leaflet ne fonctionne pas en SSR
const MapView = dynamic(() => import('@/components/carte/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

type HypothequeRaw = Omit<HypothequePoint, 'latitude' | 'longitude'> & {
  latitude: number | null;
  longitude: number | null;
};

type ZoneFilter = '' | 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ZONE_INDUSTRIELLE';
type StatutFilter = '' | 'shortfall' | 'normale';
type NatureFilter = '' | 'TERRAIN_NU' | 'VILLA' | 'IMMEUBLE_RAPPORT' | 'USINE' | 'BUREAU';

export default function CartePage() {
  const [allData, setAllData] = useState<HypothequeRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('');
  const [natureFilter, setNatureFilter] = useState<NatureFilter>('');

  // Table sans coords — edition
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/hypotheques', { params: { limit: 500 } });
        const items: HypothequeRaw[] = res.data?.data ?? res.data ?? [];
        setAllData(items);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const withCoords = useMemo(
    () =>
      allData.filter(
        (h): h is HypothequePoint =>
          h.latitude != null && h.longitude != null
      ),
    [allData]
  );

  const withoutCoords = useMemo(
    () => allData.filter((h) => h.latitude == null || h.longitude == null),
    [allData]
  );

  const filteredPoints = useMemo(() => {
    return withCoords.filter((h) => {
      if (zoneFilter && h.zoneGeographique !== zoneFilter) return false;
      if (natureFilter && h.natureBien !== natureFilter) return false;
      if (statutFilter === 'shortfall' && !(h.soldePret > h.valeurExpertiseInitiale * 0.8))
        return false;
      if (statutFilter === 'normale' && h.soldePret > h.valeurExpertiseInitiale * 0.8)
        return false;
      return true;
    });
  }, [withCoords, zoneFilter, natureFilter, statutFilter]);

  const zoneCounts = useMemo(() => {
    const counts = { ZONE_A: 0, ZONE_B: 0, ZONE_C: 0, ZONE_INDUSTRIELLE: 0 };
    filteredPoints.forEach((h) => {
      if (h.zoneGeographique in counts) {
        counts[h.zoneGeographique as keyof typeof counts]++;
      }
    });
    return counts;
  }, [filteredPoints]);

  const hasFilters = zoneFilter || statutFilter || natureFilter;

  const clearFilters = () => {
    setZoneFilter('');
    setStatutFilter('');
    setNatureFilter('');
  };

  const handleSaveCoords = async (id: number) => {
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    if (isNaN(lat) || isNaN(lng)) return;
    try {
      setSaving(true);
      await apiClient.put(`/hypotheques/${id}`, { latitude: lat, longitude: lng });
      setAllData((prev) =>
        prev.map((h) => (h.id === id ? { ...h, latitude: lat, longitude: lng } : h))
      );
      setEditingId(null);
      setEditLat('');
      setEditLng('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Carte des biens hypothéqués</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {filteredPoints.length} bien{filteredPoints.length !== 1 ? 's' : ''} sur la carte
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar gauche : filtres + liste sans coords */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Filtres */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="w-4 h-4" />
                Filtres
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Zone</label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value as ZoneFilter)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les zones</option>
                  <option value="ZONE_A">Zone A</option>
                  <option value="ZONE_B">Zone B</option>
                  <option value="ZONE_C">Zone C</option>
                  <option value="ZONE_INDUSTRIELLE">Zone Industrielle</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Statut</label>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value as StatutFilter)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="shortfall">Avec shortfall</option>
                  <option value="normale">Normale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nature du bien</label>
                <select
                  value={natureFilter}
                  onChange={(e) => setNatureFilter(e.target.value as NatureFilter)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les natures</option>
                  <option value="TERRAIN_NU">Terrain nu</option>
                  <option value="VILLA">Villa</option>
                  <option value="IMMEUBLE_RAPPORT">Immeuble de rapport</option>
                  <option value="USINE">Usine</option>
                  <option value="BUREAU">Bureau</option>
                </select>
              </div>
            </div>
          </div>

          {/* Biens sans coordonnées */}
          {withoutCoords.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-slate-700">
                  Sans coordonnées ({withoutCoords.length})
                </p>
              </div>
              <div className="space-y-3">
                {withoutCoords.map((h) => (
                  <div
                    key={h.id}
                    className="text-xs border border-slate-100 rounded-lg p-2 bg-slate-50"
                  >
                    <p className="font-medium text-slate-700 truncate">{h.nomClient}</p>
                    <p className="text-slate-500 truncate">{h.numeroPret}</p>
                    {editingId === h.id ? (
                      <div className="mt-2 space-y-1.5">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={editLat}
                          onChange={(e) => setEditLat(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={editLng}
                          onChange={(e) => setEditLng(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveCoords(h.id)}
                            disabled={saving}
                            className="flex-1 bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {saving ? '...' : 'Enregistrer'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditLat('');
                              setEditLng('');
                            }}
                            className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(h.id);
                          setEditLat('');
                          setEditLng('');
                        }}
                        className="mt-1.5 w-full text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                      >
                        + Ajouter coordonnées
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Carte */}
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <MapView points={filteredPoints} zoneCounts={zoneCounts} />
        </div>
      </div>
    </div>
  );
}
