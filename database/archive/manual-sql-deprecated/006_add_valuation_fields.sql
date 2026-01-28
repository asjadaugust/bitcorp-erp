-- Migration: Add missing fields for valuation PDF generation
-- Date: 2026-01-05
-- Purpose: Add fields needed for Reporte_Valorizacion template

-- ===================================================================
-- 1. Add fields to equipo.contrato_adenda table
-- ===================================================================

-- Add modalidad (contract modality/type)
-- Example: "MÁQUINA SECA NO OPERADA", "MAQUINA CON OPERADOR"
ALTER TABLE equipo.contrato_adenda
ADD COLUMN IF NOT EXISTS modalidad VARCHAR(100) NULL;

-- Add minimo_por (minimum billing period)
-- Example: "MES", "DIA", "HORA"
ALTER TABLE equipo.contrato_adenda
ADD COLUMN IF NOT EXISTS minimo_por VARCHAR(20) NULL;

COMMENT ON COLUMN equipo.contrato_adenda.modalidad IS 'Contract modality/type (e.g., MÁQUINA SECA NO OPERADA, MAQUINA CON OPERADOR)';
COMMENT ON COLUMN equipo.contrato_adenda.minimo_por IS 'Minimum billing period (MES, DIA, HORA)';


-- ===================================================================
-- 2. Add fields to equipo.valorizacion_equipo table
-- ===================================================================

-- Add tipo_cambio (exchange rate for USD contracts)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS tipo_cambio DECIMAL(10,4) NULL;

-- Add numero_valorizacion (short valuation number for display)
-- Example: "057", "058"
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS numero_valorizacion VARCHAR(20) NULL;

-- Add descuento_porcentaje (discount percentage)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00;

-- Add descuento_monto (discount amount in currency)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS descuento_monto DECIMAL(15,2) DEFAULT 0.00;

-- Add igv_porcentaje (IGV/VAT percentage, typically 18% in Peru)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS igv_porcentaje DECIMAL(5,2) DEFAULT 18.00;

-- Add igv_monto (calculated IGV/VAT amount)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS igv_monto DECIMAL(15,2) DEFAULT 0.00;

-- Add total_con_igv (total including IGV)
ALTER TABLE equipo.valorizacion_equipo
ADD COLUMN IF NOT EXISTS total_con_igv DECIMAL(15,2) DEFAULT 0.00;

COMMENT ON COLUMN equipo.valorizacion_equipo.tipo_cambio IS 'Exchange rate for USD contracts (PEN/USD)';
COMMENT ON COLUMN equipo.valorizacion_equipo.numero_valorizacion IS 'Short valuation number for display (e.g., 057)';
COMMENT ON COLUMN equipo.valorizacion_equipo.descuento_porcentaje IS 'Discount percentage applied to valuation';
COMMENT ON COLUMN equipo.valorizacion_equipo.descuento_monto IS 'Discount amount in contract currency';
COMMENT ON COLUMN equipo.valorizacion_equipo.igv_porcentaje IS 'IGV/VAT percentage (typically 18% in Peru)';
COMMENT ON COLUMN equipo.valorizacion_equipo.igv_monto IS 'Calculated IGV/VAT amount';
COMMENT ON COLUMN equipo.valorizacion_equipo.total_con_igv IS 'Total amount including IGV/VAT';


-- ===================================================================
-- 3. Create indexes for new fields
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_valorizacion_equipo_numero 
ON equipo.valorizacion_equipo(numero_valorizacion);


-- ===================================================================
-- 4. Update existing records with default values
-- ===================================================================

-- Set default modalidad for existing contracts
UPDATE equipo.contrato_adenda
SET modalidad = CASE 
  WHEN incluye_operador = TRUE THEN 'MAQUINA CON OPERADOR'
  ELSE 'MÁQUINA SECA NO OPERADA'
END
WHERE modalidad IS NULL;

-- Set default minimo_por for existing contracts
UPDATE equipo.contrato_adenda
SET minimo_por = CASE
  WHEN tipo_tarifa ILIKE '%hora%' THEN 'HORA'
  WHEN tipo_tarifa ILIKE '%dia%' OR tipo_tarifa ILIKE '%day%' THEN 'DIA'
  ELSE 'MES'
END
WHERE minimo_por IS NULL;

-- Generate numero_valorizacion for existing valuations
-- Format: Sequential number padded to 3 digits
WITH numbered_valuations AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM equipo.valorizacion_equipo
  WHERE numero_valorizacion IS NULL
)
UPDATE equipo.valorizacion_equipo v
SET numero_valorizacion = LPAD(nv.row_num::TEXT, 3, '0')
FROM numbered_valuations nv
WHERE v.id = nv.id;

-- Set default exchange rate for USD contracts (example rate: 3.75)
UPDATE equipo.valorizacion_equipo v
SET tipo_cambio = 3.75
FROM equipo.contrato_adenda c
WHERE v.contrato_id = c.id 
  AND c.moneda = 'USD'
  AND v.tipo_cambio IS NULL;

-- Calculate IGV for existing valuations
UPDATE equipo.valorizacion_equipo
SET 
  igv_monto = ROUND((total_valorizado * igv_porcentaje / 100), 2),
  total_con_igv = ROUND((total_valorizado * (1 + igv_porcentaje / 100)), 2)
WHERE total_valorizado IS NOT NULL
  AND (igv_monto IS NULL OR igv_monto = 0);


-- ===================================================================
-- 5. Verification queries
-- ===================================================================

-- Verify contract updates
DO $$
DECLARE
  contract_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO contract_count
  FROM equipo.contrato_adenda
  WHERE modalidad IS NOT NULL;
  
  RAISE NOTICE 'Contracts with modalidad: %', contract_count;
END $$;

-- Verify valuation updates
DO $$
DECLARE
  valuation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO valuation_count
  FROM equipo.valorizacion_equipo
  WHERE numero_valorizacion IS NOT NULL;
  
  RAISE NOTICE 'Valuations with numero_valorizacion: %', valuation_count;
END $$;

-- Display sample data
SELECT 
  'Sample Contract Data' as info,
  id,
  numero_contrato,
  modalidad,
  minimo_por,
  moneda
FROM equipo.contrato_adenda
LIMIT 3;

SELECT 
  'Sample Valuation Data' as info,
  id,
  numero_valorizacion,
  periodo,
  tipo_cambio,
  total_valorizado,
  igv_monto,
  total_con_igv
FROM equipo.valorizacion_equipo
LIMIT 3;
