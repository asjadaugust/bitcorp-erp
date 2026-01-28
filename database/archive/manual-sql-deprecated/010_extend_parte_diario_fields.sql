-- =====================================================
-- Database Migration: Extend Parte Diario Table
-- Version: 010
-- Description: Add fields for complete form template (CLUC-GEM-F-005)
-- Date: 2026-01-05
-- =====================================================

ALTER TABLE equipo.parte_diario
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50), -- Equipment code/form code
ADD COLUMN IF NOT EXISTS empresa VARCHAR(100) DEFAULT 'Consorcio La Unión',
ADD COLUMN IF NOT EXISTS placa VARCHAR(20),
ADD COLUMN IF NOT EXISTS responsable_frente VARCHAR(100),
ADD COLUMN IF NOT EXISTS turno VARCHAR(20) CHECK (turno IN ('DIA', 'NOCHE')),
ADD COLUMN IF NOT EXISTS numero_parte INTEGER, -- Sequential report number per project
ADD COLUMN IF NOT EXISTS petroleo_gln DECIMAL(10,2), -- Diesel in gallons (Petroleo D-2 Gln)
ADD COLUMN IF NOT EXISTS gasolina_gln DECIMAL(10,2), -- Gasoline in gallons (Gasolina Gln)
ADD COLUMN IF NOT EXISTS hora_abastecimiento TIME, -- Refueling time
ADD COLUMN IF NOT EXISTS num_vale_combustible VARCHAR(50), -- Fuel voucher number
ADD COLUMN IF NOT EXISTS horometro_kilometraje VARCHAR(100), -- Combined reading at refueling
ADD COLUMN IF NOT EXISTS lugar_salida VARCHAR(200), -- Departure location
ADD COLUMN IF NOT EXISTS lugar_llegada VARCHAR(200), -- Arrival location
ADD COLUMN IF NOT EXISTS observaciones_correcciones TEXT, -- "OBSERVACIONES / CORRECCIONES" section
ADD COLUMN IF NOT EXISTS firma_operador TEXT, -- Digital signature (base64 or path)
ADD COLUMN IF NOT EXISTS firma_supervisor TEXT,
ADD COLUMN IF NOT EXISTS firma_jefe_equipos TEXT,
ADD COLUMN IF NOT EXISTS firma_residente TEXT,
ADD COLUMN IF NOT EXISTS firma_planeamiento_control TEXT;

-- Add comments for documentation
COMMENT ON COLUMN equipo.parte_diario.codigo IS 'Equipment/form code (CÓDIGO field in header)';
COMMENT ON COLUMN equipo.parte_diario.empresa IS 'Company name (EMPRESA field in form)';
COMMENT ON COLUMN equipo.parte_diario.placa IS 'License plate (PLACA field)';
COMMENT ON COLUMN equipo.parte_diario.responsable_frente IS 'Site supervisor (RESPONSABLE DE FRENTE)';
COMMENT ON COLUMN equipo.parte_diario.turno IS 'Shift: DIA (Day) or NOCHE (Night)';
COMMENT ON COLUMN equipo.parte_diario.numero_parte IS 'Sequential daily report number per project (N° field in red box)';
COMMENT ON COLUMN equipo.parte_diario.petroleo_gln IS 'Diesel in gallons (Petroleo D-2 Gln)';
COMMENT ON COLUMN equipo.parte_diario.gasolina_gln IS 'Gasoline in gallons (Gasolina Gln)';
COMMENT ON COLUMN equipo.parte_diario.hora_abastecimiento IS 'Hora de Abastecimiento - refueling time';
COMMENT ON COLUMN equipo.parte_diario.num_vale_combustible IS 'N° Vale Combustible - fuel voucher number';
COMMENT ON COLUMN equipo.parte_diario.horometro_kilometraje IS 'Horómetro / Kilometraje reading at refueling';
COMMENT ON COLUMN equipo.parte_diario.lugar_salida IS 'Lugar de Salida - departure location';
COMMENT ON COLUMN equipo.parte_diario.lugar_llegada IS 'Lugar de Llegada - arrival location';
COMMENT ON COLUMN equipo.parte_diario.observaciones_correcciones IS 'OBSERVACIONES / CORRECCIONES section text';
COMMENT ON COLUMN equipo.parte_diario.firma_operador IS 'Operator signature (base64 encoded image from canvas)';
COMMENT ON COLUMN equipo.parte_diario.firma_supervisor IS 'Supervisor signature';
COMMENT ON COLUMN equipo.parte_diario.firma_jefe_equipos IS 'Equipment chief signature (JEFE EQUIPOS)';
COMMENT ON COLUMN equipo.parte_diario.firma_residente IS 'Resident/site manager signature (RESIDENTE)';
COMMENT ON COLUMN equipo.parte_diario.firma_planeamiento_control IS 'Planning and control signature (PLANEAMIENTO Y CONTROL)';

-- Create index for report number lookups (per project)
CREATE INDEX IF NOT EXISTS idx_parte_diario_numero_proyecto ON equipo.parte_diario(proyecto_id, numero_parte);

-- Create sequence for auto-generating report numbers per project
-- Note: This will be handled in application logic to ensure per-project sequences
