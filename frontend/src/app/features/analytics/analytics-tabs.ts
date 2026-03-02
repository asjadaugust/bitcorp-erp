import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const ANALYTICS_TABS: TabItem[] = [
  { label: 'Resumen de Flota', route: '/analytics/flota', icon: 'fa-truck-fast' },
  { label: 'Utilización', route: '/analytics/utilizacion', icon: 'fa-clock' },
  { label: 'Combustible', route: '/analytics/combustible', icon: 'fa-gas-pump' },
];
