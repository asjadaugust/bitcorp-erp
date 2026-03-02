import { TabItem } from '../../shared/components/page-layout/page-layout.component';

export const ADMINISTRACION_TABS: TabItem[] = [
  { label: 'Centros de Costo', route: '/administracion/cost-centers', icon: 'fa-building-columns' },
  {
    label: 'Cuentas por Pagar',
    route: '/administracion/accounts-payable',
    icon: 'fa-file-invoice-dollar',
  },
  {
    label: 'Cronograma de Pagos',
    route: '/administracion/payment-schedules',
    icon: 'fa-calendar-check',
  },
];
