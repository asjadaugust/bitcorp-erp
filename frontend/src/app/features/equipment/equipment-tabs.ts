import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const EQUIPMENT_MODULE_TABS: TabItem[] = [
  { label: 'Dashboard', route: '/equipment/dashboard', icon: 'fa-chart-line' },
  { label: 'Equipos', route: '/equipment', icon: 'fa-list', exact: true },
  { label: 'Operaciones', route: '/equipment/operaciones', icon: 'fa-gears' },
  { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
  { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  { label: 'Devoluciones', route: '/equipment/actas-devolucion', icon: 'fa-rotate-left' },
  { label: 'Combustible', route: '/equipment/vales-combustible', icon: 'fa-gas-pump' },
];
