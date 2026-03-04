import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const HR_TABS: TabItem[] = [
  { label: 'Dashboard', route: '/rrhh', icon: 'fa-chart-pie', exact: true },
  { label: 'Personal', route: '/rrhh/employees', icon: 'fa-users' },
  { label: 'Registro', route: '/rrhh/worker-registry', icon: 'fa-id-card' },
];
