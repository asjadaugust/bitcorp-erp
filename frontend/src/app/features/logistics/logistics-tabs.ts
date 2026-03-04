import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const LOGISTICS_TABS: TabItem[] = [
  { label: 'Productos', route: '/logistics/products', icon: 'fa-boxes-stacked' },
  { label: 'Movimientos', route: '/logistics/movements', icon: 'fa-dolly' },
  { label: 'Solicitudes', route: '/logistics/material-requests', icon: 'fa-file-lines' },
  { label: 'Requerimientos', route: '/logistics/requirements', icon: 'fa-clipboard-list' },
  { label: 'Categorias', route: '/logistics/categories', icon: 'fa-tags' },
];
