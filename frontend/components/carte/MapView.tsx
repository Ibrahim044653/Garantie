'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

// Fix Leaflet default icon issue with webpack/bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface HypothequePoint {
  id: number;
  nomClient: string;
  codeClient: string;
  numeroPret: string;
  ville: string;
  quartier?: string;
  zoneGeographique: string;
  natureBien: string;
  valeurExpertiseInitiale: number;
  soldePret: number;
  latitude: number;
  longitude: number;
  statut?: string;
}

interface ZoneCount {
  ZONE_A: number;
  ZONE_B: number;
  ZONE_C: number;
  ZONE_INDUSTRIELLE: number;
}

interface MapViewProps {
  points: HypothequePoint[];
  zoneCounts: ZoneCount;
}

const ZONE_COLORS: Record<string, string> = {
  ZONE_A: '#22c55e',
  ZONE_B: '#f59e0b',
  ZONE_C: '#ef4444',
  ZONE_INDUSTRIELLE: '#64748b',
};

const ZONE_LABELS: Record<string, string> = {
  ZONE_A: 'Zone A',
  ZONE_B: 'Zone B',
  ZONE_C: 'Zone C',
  ZONE_INDUSTRIELLE: 'Zone Industrielle',
};

function formatFCFA(value: number): string {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(value) + ' FCFA';
}

// Composant interne pour reset la vue
function MapResetter({ points }: { points: HypothequePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([14.6928, -17.4467], 12);
    }
  }, [points, map]);
  return null;
}

export default function MapView({ points, zoneCounts }: MapViewProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[14.6928, -17.4467]}
        zoom={12}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResetter points={points} />
        {points.map((point) => {
          const color = ZONE_COLORS[point.zoneGeographique] ?? '#3b82f6';
          const hasShortfall = point.soldePret > point.valeurExpertiseInitiale * 0.8;
          return (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={8}
              pathOptions={{
                fillColor: color,
                color: hasShortfall ? '#dc2626' : color,
                weight: hasShortfall ? 2.5 : 1,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div className="min-w-[200px] text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Bien :</span> {point.natureBien.replace(/_/g, ' ')}
                  </p>
                  <p>
                    <span className="font-semibold">Client :</span> {point.nomClient}
                  </p>
                  <p>
                    <span className="font-semibold">Prêt :</span> {point.numeroPret}
                  </p>
                  <p>
                    <span className="font-semibold">Valeur :</span> {formatFCFA(point.valeurExpertiseInitiale)}
                  </p>
                  <p>
                    <span className="font-semibold">Zone :</span>{' '}
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-white text-xs"
                      style={{ backgroundColor: color }}
                    >
                      {ZONE_LABELS[point.zoneGeographique] ?? point.zoneGeographique}
                    </span>
                  </p>
                  {hasShortfall && (
                    <p className="text-red-600 text-xs font-medium">Shortfall détecté</p>
                  )}
                  <div className="pt-1 border-t border-slate-200 mt-1">
                    <Link
                      href={`/hypotheques/${point.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Voir la fiche →
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Légende zone counts */}
      <div className="absolute bottom-6 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-slate-200 p-3 text-xs space-y-1.5 min-w-[180px]">
        <p className="font-semibold text-slate-700 mb-2">Répartition par zone</p>
        {(Object.keys(ZONE_COLORS) as (keyof typeof ZONE_COLORS)[]).map((zone) => (
          <div key={zone} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: ZONE_COLORS[zone] }}
              />
              <span className="text-slate-600">{ZONE_LABELS[zone]}</span>
            </div>
            <span className="font-semibold text-slate-800">
              {zoneCounts[zone as keyof ZoneCount] ?? 0} biens
            </span>
          </div>
        ))}
        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
          <span className="text-slate-500">Total affiché</span>
          <span className="font-semibold text-slate-800">{points.length}</span>
        </div>
      </div>
    </div>
  );
}
