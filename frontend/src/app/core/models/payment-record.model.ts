/**
 * Payment Record Models
 * Matches backend DTOs from backend/src/types/dto/payment-record.dto.ts
 */

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  RECHAZADO = 'RECHAZADO',
  ANULADO = 'ANULADO',
}

export enum MetodoPago {
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE',
  EFECTIVO = 'EFECTIVO',
  LETRA = 'LETRA',
  DEPOSITO = 'DEPOSITO',
  OTROS = 'OTROS',
}

export enum TipoComprobante {
  FACTURA = 'FACTURA',
  BOLETA = 'BOLETA',
  RECIBO = 'RECIBO',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
}

export enum EstadoPagoResumen {
  SIN_PAGOS = 'SIN_PAGOS',
  PAGO_PARCIAL = 'PAGO_PARCIAL',
  PAGO_COMPLETO = 'PAGO_COMPLETO',
}

/**
 * Payment Record List DTO (minimal fields for list view)
 */
export interface PaymentRecordList {
  id: number;
  numero_pago: string;
  valorizacion_id: number;
  numero_valorizacion?: string;
  fecha_pago: string;
  monto_pagado: number;
  moneda: string;
  metodo_pago: MetodoPago;
  estado: EstadoPago;
  conciliado: boolean;
  numero_operacion?: string;
  created_at: string;
}

/**
 * Payment Record Detail DTO (full fields for detail view)
 */
export interface PaymentRecordDetail {
  id: number;
  numero_pago: string;
  valorizacion_id: number;
  numero_valorizacion?: string;
  contrato_id?: number;
  proyecto_id?: number;
  fecha_pago: string;
  monto_pagado: number;
  moneda: string;
  tipo_cambio?: number;
  metodo_pago: MetodoPago;
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;
  comprobante_tipo?: TipoComprobante;
  comprobante_numero?: string;
  comprobante_fecha?: string;
  estado: EstadoPago;
  conciliado: boolean;
  fecha_conciliacion?: string;
  observaciones?: string;
  referencia_interna?: string;
  registrado_por_id?: number;
  registrado_por_nombre?: string;
  aprobado_por_id?: number;
  aprobado_por_nombre?: string;
  fecha_registro: string;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Payment Summary DTO (aggregated data)
 */
export interface PaymentSummary {
  valorizacion_id: number;
  numero_valorizacion?: string;
  monto_total_valorizacion: number;
  estado_valorizacion: string;
  cantidad_pagos: number;
  total_pagado: number;
  saldo_pendiente: number;
  estado_pago: EstadoPagoResumen;
  fecha_ultimo_pago?: string;
}

/**
 * Create Payment DTO (for new payments)
 */
export interface CreatePaymentRecord {
  valorizacion_id: number;
  contrato_id?: number;
  proyecto_id?: number;
  fecha_pago: string;
  monto_pagado: number;
  moneda?: string;
  tipo_cambio?: number;
  metodo_pago: MetodoPago;
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;
  comprobante_tipo?: TipoComprobante;
  comprobante_numero?: string;
  comprobante_fecha?: string;
  estado?: EstadoPago;
  observaciones?: string;
  referencia_interna?: string;
}

/**
 * Update Payment DTO (for editing payments)
 */
export interface UpdatePaymentRecord {
  fecha_pago?: string;
  monto_pagado?: number;
  moneda?: string;
  tipo_cambio?: number;
  metodo_pago?: MetodoPago;
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;
  comprobante_tipo?: TipoComprobante;
  comprobante_numero?: string;
  comprobante_fecha?: string;
  estado?: EstadoPago;
  observaciones?: string;
  referencia_interna?: string;
}

/**
 * Reconcile Payment DTO
 */
export interface ReconcilePayment {
  fecha_conciliacion: string;
  observaciones?: string;
}

/**
 * Payment Query Filters
 */
export interface PaymentRecordQuery {
  page?: number;
  limit?: number;
  valorizacion_id?: number;
  estado?: EstadoPago;
  conciliado?: boolean;
  metodo_pago?: MetodoPago;
  fecha_desde?: string;
  fecha_hasta?: string;
  moneda?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedPaymentResponse {
  success: boolean;
  data: PaymentRecordList[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Single Response
 */
export interface SinglePaymentResponse {
  success: boolean;
  data: PaymentRecordDetail;
}

/**
 * Summary Response
 */
export interface PaymentSummaryResponse {
  success: boolean;
  data: PaymentSummary;
}
