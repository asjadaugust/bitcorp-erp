-- ============================================
-- Migration: Create payment_records table
-- Version: 013
-- Description: Track actual payment transactions for valuations
--              Supports partial payments and payment reconciliation
-- Author: BitCorp Development Team
-- Date: 2026-01-18
-- ============================================

-- Create payment_records table
CREATE TABLE IF NOT EXISTS equipo.registro_pago (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Foreign keys
  valorizacion_id INTEGER NOT NULL REFERENCES equipo.valorizacion_equipo(id) ON DELETE RESTRICT,
  contrato_id INTEGER,  -- Reference to contract (when contract table exists)
  proyecto_id INTEGER,  -- Reference to project (when project table exists)
  
  -- Payment details
  numero_pago VARCHAR(50) UNIQUE NOT NULL,  -- e.g., PAG-2026-001
  fecha_pago DATE NOT NULL,
  monto_pagado DECIMAL(12, 2) NOT NULL CHECK (monto_pagado > 0),
  moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',  -- PEN, USD
  tipo_cambio DECIMAL(10, 4),  -- Exchange rate if USD
  
  -- Payment method
  metodo_pago VARCHAR(50) NOT NULL,  -- TRANSFERENCIA, CHEQUE, EFECTIVO, LETRA
  banco_origen VARCHAR(100),  -- Paying bank
  banco_destino VARCHAR(100),  -- Receiving bank
  cuenta_origen VARCHAR(50),  -- Account number (paying)
  cuenta_destino VARCHAR(50),  -- Account number (receiving)
  numero_operacion VARCHAR(100),  -- Transaction/operation number
  numero_cheque VARCHAR(50),  -- Check number (if applicable)
  
  -- Document references
  comprobante_tipo VARCHAR(20),  -- FACTURA, RECIBO, BOLETA
  comprobante_numero VARCHAR(50),
  comprobante_fecha DATE,
  
  -- Status and reconciliation
  estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',  -- PENDIENTE, CONFIRMADO, RECHAZADO, ANULADO
  conciliado BOOLEAN DEFAULT FALSE,  -- Bank reconciliation status
  fecha_conciliacion TIMESTAMP,
  
  -- Notes and observations
  observaciones TEXT,
  referencia_interna VARCHAR(100),  -- Internal reference
  
  -- Audit fields
  registrado_por_id INTEGER REFERENCES sistema.usuario(id),
  aprobado_por_id INTEGER REFERENCES sistema.usuario(id),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_registro_pago_valorizacion ON equipo.registro_pago(valorizacion_id);
CREATE INDEX idx_registro_pago_contrato ON equipo.registro_pago(contrato_id);
CREATE INDEX idx_registro_pago_proyecto ON equipo.registro_pago(proyecto_id);
CREATE INDEX idx_registro_pago_fecha ON equipo.registro_pago(fecha_pago);
CREATE INDEX idx_registro_pago_estado ON equipo.registro_pago(estado);
CREATE INDEX idx_registro_pago_numero ON equipo.registro_pago(numero_pago);
CREATE INDEX idx_registro_pago_conciliado ON equipo.registro_pago(conciliado);

-- Add comments for documentation
COMMENT ON TABLE equipo.registro_pago IS 'Registro detallado de pagos realizados para valorizaciones de equipos';
COMMENT ON COLUMN equipo.registro_pago.numero_pago IS 'Número único de pago generado automáticamente (PAG-YYYY-NNN)';
COMMENT ON COLUMN equipo.registro_pago.monto_pagado IS 'Monto real pagado (puede ser parcial)';
COMMENT ON COLUMN equipo.registro_pago.tipo_cambio IS 'Tipo de cambio aplicado si el pago es en moneda extranjera';
COMMENT ON COLUMN equipo.registro_pago.metodo_pago IS 'Forma de pago: TRANSFERENCIA, CHEQUE, EFECTIVO, LETRA';
COMMENT ON COLUMN equipo.registro_pago.conciliado IS 'Indica si el pago fue conciliado con el extracto bancario';
COMMENT ON COLUMN equipo.registro_pago.estado IS 'Estado del pago: PENDIENTE, CONFIRMADO, RECHAZADO, ANULADO';

-- Create view for payment summary by valuation
CREATE OR REPLACE VIEW equipo.vista_resumen_pagos AS
SELECT 
  v.id as valorizacion_id,
  v.numero_valorizacion,
  v.total_con_igv as monto_total_valorizacion,
  v.estado as estado_valorizacion,
  COUNT(rp.id) as cantidad_pagos,
  COALESCE(SUM(rp.monto_pagado), 0) as total_pagado,
  v.total_con_igv - COALESCE(SUM(rp.monto_pagado), 0) as saldo_pendiente,
  CASE 
    WHEN COALESCE(SUM(rp.monto_pagado), 0) = 0 THEN 'SIN_PAGOS'
    WHEN COALESCE(SUM(rp.monto_pagado), 0) < v.total_con_igv THEN 'PAGO_PARCIAL'
    WHEN COALESCE(SUM(rp.monto_pagado), 0) >= v.total_con_igv THEN 'PAGO_COMPLETO'
    ELSE 'DESCONOCIDO'
  END as estado_pago,
  MAX(rp.fecha_pago) as fecha_ultimo_pago
FROM equipo.valorizacion_equipo v
LEFT JOIN equipo.registro_pago rp ON v.id = rp.valorizacion_id AND rp.estado = 'CONFIRMADO'
GROUP BY v.id, v.numero_valorizacion, v.total_con_igv, v.estado;

COMMENT ON VIEW equipo.vista_resumen_pagos IS 'Resumen de pagos por valorización con cálculo de saldo pendiente';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION equipo.actualizar_registro_pago_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_registro_pago_timestamp
  BEFORE UPDATE ON equipo.registro_pago
  FOR EACH ROW
  EXECUTE FUNCTION equipo.actualizar_registro_pago_timestamp();

-- Create function to generate payment number
CREATE OR REPLACE FUNCTION equipo.generar_numero_pago()
RETURNS VARCHAR AS $$
DECLARE
  anio VARCHAR(4);
  contador INTEGER;
  nuevo_numero VARCHAR(50);
BEGIN
  anio := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO contador
  FROM equipo.registro_pago
  WHERE numero_pago LIKE 'PAG-' || anio || '-%';
  
  nuevo_numero := 'PAG-' || anio || '-' || LPAD(contador::TEXT, 4, '0');
  
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION equipo.generar_numero_pago IS 'Genera número de pago automático en formato PAG-YYYY-NNNN';

-- Migration complete
SELECT 'Migration 013: payment_records table created successfully' as status;
