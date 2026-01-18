/**
 * Payment Record DTOs
 * All field names use snake_case for API consistency
 */

// ==================== Response DTOs ====================

export interface PaymentRecordListDTO {
  id: number;
  numero_pago: string;
  valorizacion_id: number;
  numero_valorizacion?: string; // From join
  fecha_pago: string; // YYYY-MM-DD
  monto_pagado: number;
  moneda: string;
  metodo_pago: string;
  estado: string;
  conciliado: boolean;
  observaciones?: string;
}

export interface PaymentRecordDetailDTO {
  id: number;
  valorizacion_id: number;
  numero_valorizacion?: string;
  contrato_id?: number;
  proyecto_id?: number;

  // Payment identification
  numero_pago: string;
  fecha_pago: string;
  monto_pagado: number;
  moneda: string;
  tipo_cambio?: number;

  // Payment method
  metodo_pago: string;
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;

  // Receipt/Invoice
  comprobante_tipo?: string;
  comprobante_numero?: string;
  comprobante_fecha?: string;

  // Status
  estado: string;
  conciliado: boolean;
  fecha_conciliacion?: string;

  // Additional info
  observaciones?: string;
  referencia_interna?: string;

  // Audit
  registrado_por_id?: number;
  registrado_por_nombre?: string;
  aprobado_por_id?: number;
  aprobado_por_nombre?: string;
  fecha_registro: string;
  fecha_aprobacion?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PaymentSummaryDTO {
  valorizacion_id: number;
  numero_valorizacion: string;
  monto_total_valorizacion: number;
  estado_valorizacion: string;
  cantidad_pagos: number;
  total_pagado: number;
  saldo_pendiente: number;
  estado_pago: 'SIN_PAGOS' | 'PAGO_PARCIAL' | 'PAGO_COMPLETO';
  fecha_ultimo_pago?: string;
}

// ==================== Request DTOs ====================

export interface CreatePaymentRecordDTO {
  valorizacion_id: number;
  fecha_pago: string; // YYYY-MM-DD
  monto_pagado: number;
  moneda?: string; // Default: PEN
  tipo_cambio?: number;

  // Payment method (required)
  metodo_pago: 'TRANSFERENCIA' | 'CHEQUE' | 'EFECTIVO' | 'LETRA' | 'DEPOSITO' | 'OTROS';

  // Bank details (optional, depends on method)
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;

  // Receipt details (optional)
  comprobante_tipo?: 'FACTURA' | 'RECIBO' | 'BOLETA' | 'OTROS';
  comprobante_numero?: string;
  comprobante_fecha?: string;

  // Status (optional, default: CONFIRMADO)
  estado?: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'ANULADO';

  // Additional info
  observaciones?: string;
  referencia_interna?: string;
}

export interface UpdatePaymentRecordDTO {
  fecha_pago?: string;
  monto_pagado?: number;
  moneda?: string;
  tipo_cambio?: number;

  metodo_pago?: string;
  banco_origen?: string;
  banco_destino?: string;
  cuenta_origen?: string;
  cuenta_destino?: string;
  numero_operacion?: string;
  numero_cheque?: string;

  comprobante_tipo?: string;
  comprobante_numero?: string;
  comprobante_fecha?: string;

  estado?: string;
  observaciones?: string;
  referencia_interna?: string;
}

export interface ReconcilePaymentDTO {
  fecha_conciliacion: string; // YYYY-MM-DD
  observaciones?: string;
}

// ==================== Query DTOs ====================

export interface PaymentRecordQueryDTO {
  page?: number;
  limit?: number;
  valorizacion_id?: number;
  estado?: string;
  conciliado?: boolean;
  metodo_pago?: string;
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  moneda?: string;
}
