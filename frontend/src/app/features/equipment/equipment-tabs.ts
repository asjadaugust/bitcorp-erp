import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const EQUIPMENT_MODULE_TABS: TabItem[] = [
  { label: 'Dashboard', route: '/equipment/dashboard', icon: 'fa-chart-line' },
  { label: 'Equipos', route: '/equipment', icon: 'fa-list', exact: true },
  { label: 'Solicitudes', route: '/equipment/solicitudes', icon: 'fa-file-invoice' },
  { label: 'Órdenes', route: '/equipment/ordenes-alquiler', icon: 'fa-file-contract' },
  { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
  { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
  { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-signature' },
  { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  { label: 'Devoluciones', route: '/equipment/actas-devolucion', icon: 'fa-rotate-left' },
  { label: 'Inoperatividad', route: '/equipment/inoperatividad', icon: 'fa-triangle-exclamation' },
  { label: 'Combustible', route: '/equipment/vales-combustible', icon: 'fa-gas-pump' },
];
