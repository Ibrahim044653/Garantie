export type WidgetId =
  | 'kpi-vnc' | 'kpi-encours' | 'kpi-alertes' | 'kpi-ltv' | 'kpi-shortfalls'
  | 'kpi-provisions' | 'kpi-expected-loss' | 'kpi-taux-couverture' | 'kpi-nb-hypotheques'
  | 'chart-evolution-vnc' | 'chart-zones' | 'chart-natures'
  | 'list-alertes' | 'list-shortfalls' | 'table-zones'
  | 'widget-workflow' | 'widget-echeances';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  position: number;
  size: WidgetSize;
}

export const WIDGET_LABELS: Record<WidgetId, string> = {
  'kpi-vnc': 'VNC Totale',
  'kpi-encours': 'Encours Total',
  'kpi-alertes': 'Alertes Actives',
  'kpi-ltv': 'LTV Moyen',
  'kpi-shortfalls': 'Shortfalls',
  'kpi-provisions': 'Provisions IFRS9',
  'kpi-expected-loss': 'Expected Loss',
  'kpi-taux-couverture': 'Taux Couverture',
  'kpi-nb-hypotheques': 'Nb Hypothèques',
  'chart-evolution-vnc': 'Évolution VNC',
  'chart-zones': 'Répartition Zones',
  'chart-natures': 'Répartition Nature',
  'list-alertes': 'Alertes Récentes',
  'list-shortfalls': 'Top Shortfalls',
  'table-zones': 'Performance par Zone',
  'widget-workflow': 'Workflow en attente',
  'widget-echeances': 'Échéances Proches',
};

export const SIZE_LABELS: Record<WidgetSize, string> = {
  sm: 'Petit (1/4)',
  md: 'Moyen (1/2)',
  lg: 'Grand (3/4)',
  full: 'Pleine largeur',
};

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: 'kpi-vnc',            visible: true,  position: 0,  size: 'sm' },
  { id: 'kpi-encours',        visible: true,  position: 1,  size: 'sm' },
  { id: 'kpi-alertes',        visible: true,  position: 2,  size: 'sm' },
  { id: 'kpi-ltv',            visible: true,  position: 3,  size: 'sm' },
  { id: 'kpi-shortfalls',     visible: true,  position: 4,  size: 'sm' },
  { id: 'kpi-provisions',     visible: true,  position: 5,  size: 'sm' },
  { id: 'kpi-expected-loss',  visible: true,  position: 6,  size: 'sm' },
  { id: 'kpi-taux-couverture',visible: true,  position: 7,  size: 'sm' },
  { id: 'kpi-nb-hypotheques', visible: true,  position: 8,  size: 'sm' },
  { id: 'chart-evolution-vnc',visible: true,  position: 9,  size: 'lg' },
  { id: 'chart-zones',        visible: true,  position: 10, size: 'md' },
  { id: 'chart-natures',      visible: true,  position: 11, size: 'md' },
  { id: 'list-alertes',       visible: true,  position: 12, size: 'md' },
  { id: 'list-shortfalls',    visible: true,  position: 13, size: 'md' },
  { id: 'table-zones',        visible: true,  position: 14, size: 'full' },
  { id: 'widget-workflow',    visible: true,  position: 15, size: 'md' },
  { id: 'widget-echeances',   visible: true,  position: 16, size: 'md' },
];
