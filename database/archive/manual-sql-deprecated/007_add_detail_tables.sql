-- Migration: Add Detail Tables for Valuation Pages 3-7
-- Purpose: Create supporting tables for multi-page valuation PDF
-- Based on: Legacy SSRS RDL tables (tbl_C08002, tbl_C08008, tbl_C08010)

BEGIN;

-- ============================================================================
-- Table: equipo.exceso_combustible
-- Purpose: Track excess fuel consumption charges (Page 3)
-- Legacy: tbl_C08010_ExcesoCombustible
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipo.exceso_combustible (
    id SERIAL PRIMARY KEY,
    valorizacion_id INTEGER NOT NULL,
    
    -- Fuel consumption data
    consumo_combustible NUMERIC(10, 2) DEFAULT 0.00,
    tipo_horo_odo VARCHAR(20), -- "HORÓMETRO" | "ODÓMETRO"
    inicio NUMERIC(10, 2) DEFAULT 0.00,
    final NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Performance calculations
    rendimiento NUMERIC(10, 4) DEFAULT 0.0000, -- Gallons per hour/km
    ratio_control NUMERIC(10, 4) DEFAULT 0.0000,
    diferencia NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Excess charges
    exceso_combustible NUMERIC(10, 2) DEFAULT 0.00, -- Excess gallons
    precio_unitario NUMERIC(10, 4) DEFAULT 0.0000,
    importe_exceso_combustible NUMERIC(15, 2) DEFAULT 0.00,
    
    -- Metadata
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_exceso_valorizacion FOREIGN KEY (valorizacion_id) 
        REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE
);

CREATE INDEX idx_exceso_combustible_valorizacion ON equipo.exceso_combustible(valorizacion_id);

COMMENT ON TABLE equipo.exceso_combustible IS 'Excess fuel consumption charges for valuations';
COMMENT ON COLUMN equipo.exceso_combustible.rendimiento IS 'Fuel efficiency (gallons per hour or per km)';
COMMENT ON COLUMN equipo.exceso_combustible.ratio_control IS 'Control ratio for excess calculation';

-- ============================================================================
-- Table: equipo.gasto_obra
-- Purpose: Track work-related expenses (Page 4)
-- Legacy: tbl_C08008_EquipoGastoObra
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipo.gasto_obra (
    id SERIAL PRIMARY KEY,
    valorizacion_id INTEGER NOT NULL,
    
    -- Transaction data
    fecha_operacion DATE NOT NULL,
    proveedor VARCHAR(200),
    concepto VARCHAR(500),
    tipo_documento VARCHAR(50), -- "FACTURA" | "BOLETA" | "RECIBO" | "NOTA DE CRÉDITO"
    num_documento VARCHAR(50),
    
    -- Amounts
    importe NUMERIC(15, 2) DEFAULT 0.00,
    incluye_igv VARCHAR(2) DEFAULT 'SI', -- "SI" | "NO"
    importe_sin_igv NUMERIC(15, 2) DEFAULT 0.00,
    
    -- Metadata
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_gasto_obra_valorizacion FOREIGN KEY (valorizacion_id) 
        REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE
);

CREATE INDEX idx_gasto_obra_valorizacion ON equipo.gasto_obra(valorizacion_id);
CREATE INDEX idx_gasto_obra_fecha ON equipo.gasto_obra(fecha_operacion);

COMMENT ON TABLE equipo.gasto_obra IS 'Work-related expenses charged to valuations';
COMMENT ON COLUMN equipo.gasto_obra.incluye_igv IS 'Whether the amount includes IGV (18%)';

-- ============================================================================
-- Table: equipo.adelanto_amortizacion
-- Purpose: Track advances and amortization installments (Page 5)
-- Legacy: tbl_C08002_AdelantoAmortizacion
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipo.adelanto_amortizacion (
    id SERIAL PRIMARY KEY,
    valorizacion_id INTEGER NOT NULL,
    equipo_id INTEGER NOT NULL,
    
    -- Transaction data
    fecha_operacion DATE NOT NULL,
    tipo_operacion VARCHAR(50) NOT NULL, -- "ADELANTO" | "AMORTIZACION"
    num_documento VARCHAR(50),
    concepto VARCHAR(500),
    num_cuota VARCHAR(20), -- Installment number (e.g., "1/12")
    
    -- Amount
    monto NUMERIC(15, 2) DEFAULT 0.00,
    
    -- Metadata
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_adelanto_valorizacion FOREIGN KEY (valorizacion_id) 
        REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE,
    CONSTRAINT fk_adelanto_equipo FOREIGN KEY (equipo_id) 
        REFERENCES equipo.equipo(id) ON DELETE CASCADE
);

CREATE INDEX idx_adelanto_valorizacion ON equipo.adelanto_amortizacion(valorizacion_id);
CREATE INDEX idx_adelanto_equipo ON equipo.adelanto_amortizacion(equipo_id);
CREATE INDEX idx_adelanto_fecha ON equipo.adelanto_amortizacion(fecha_operacion);
CREATE INDEX idx_adelanto_tipo ON equipo.adelanto_amortizacion(tipo_operacion);

COMMENT ON TABLE equipo.adelanto_amortizacion IS 'Advances and amortization installments';
COMMENT ON COLUMN equipo.adelanto_amortizacion.tipo_operacion IS 'ADELANTO (advance) or AMORTIZACION (payment)';

-- ============================================================================
-- Update: equipo.equipo_combustible
-- Purpose: Add missing columns for complete fuel tracking (Page 2)
-- ============================================================================
DO $$
BEGIN
    -- Add num_vale_salida if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'equipo' 
                   AND table_name = 'equipo_combustible' 
                   AND column_name = 'num_vale_salida') THEN
        ALTER TABLE equipo.equipo_combustible 
        ADD COLUMN num_vale_salida VARCHAR(50);
    END IF;
    
    -- Add horometro_odometro if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'equipo' 
                   AND table_name = 'equipo_combustible' 
                   AND column_name = 'horometro_odometro') THEN
        ALTER TABLE equipo.equipo_combustible 
        ADD COLUMN horometro_odometro VARCHAR(20);
    END IF;
    
    -- Add inicial if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'equipo' 
                   AND table_name = 'equipo_combustible' 
                   AND column_name = 'inicial') THEN
        ALTER TABLE equipo.equipo_combustible 
        ADD COLUMN inicial NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    
    -- Add comentario if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'equipo' 
                   AND table_name = 'equipo_combustible' 
                   AND column_name = 'comentario') THEN
        ALTER TABLE equipo.equipo_combustible 
        ADD COLUMN comentario TEXT;
    END IF;
END $$;

COMMENT ON COLUMN equipo.equipo_combustible.num_vale_salida IS 'Fuel voucher/receipt number';
COMMENT ON COLUMN equipo.equipo_combustible.horometro_odometro IS 'Meter type: HORÓMETRO or ODÓMETRO';
COMMENT ON COLUMN equipo.equipo_combustible.inicial IS 'Initial meter reading';
COMMENT ON COLUMN equipo.equipo_combustible.comentario IS 'Additional notes';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- SELECT COUNT(*) FROM equipo.exceso_combustible;
-- SELECT COUNT(*) FROM equipo.gasto_obra;
-- SELECT COUNT(*) FROM equipo.adelanto_amortizacion;
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_schema = 'equipo' AND table_name = 'equipo_combustible' 
-- ORDER BY ordinal_position;
