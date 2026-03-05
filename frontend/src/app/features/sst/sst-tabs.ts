import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const SST_TABS: TabItem[] = [
  { label: 'Incidentes', route: '/sst', icon: 'fa-triangle-exclamation', exact: true },
  { label: 'Inspecciones', route: '/sst/inspecciones', icon: 'fa-magnifying-glass' },
  { label: 'Reportes A/C', route: '/sst/reportes-acto', icon: 'fa-file-lines' },
];
