-- =====================================================
-- Database Migration: Daily Report Details Tables
-- Version: 009
-- Description: Add tables for production control, activities, and delays
-- Date: 2026-01-05
-- =====================================================

-- Production Control Table (up to 16 rows per daily report)
CREATE TABLE equipo.parte_diario_produccion (
  id SERIAL PRIMARY KEY,
  parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
  numero SMALLINT NOT NULL CHECK (numero BETWEEN 1 AND 16),
  ubicacion_labores_prog_ini VARCHAR(100),
  ubicacion_labores_prog_fin VARCHAR(100),
  hora_ini TIME,
  hora_fin TIME,
  material_trabajado_descripcion TEXT,
  metrado VARCHAR(50),
  edt VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parte_diario_id, numero)
);

COMMENT ON TABLE equipo.parte_diario_produccion IS 'CONTROL DE LA PRODUCCIÓN section - up to 16 rows per report';
COMMENT ON COLUMN equipo.parte_diario_produccion.numero IS 'Row number (01-16)';
COMMENT ON COLUMN equipo.parte_diario_produccion.ubicacion_labores_prog_ini IS 'Ubicación Labores - Prog. Ini.';
COMMENT ON COLUMN equipo.parte_diario_produccion.ubicacion_labores_prog_fin IS 'Ubicación Labores - Prog. Fin.';
COMMENT ON COLUMN equipo.parte_diario_produccion.material_trabajado_descripcion IS 'Material Trabajado o Descripción Actividad';
COMMENT ON COLUMN equipo.parte_diario_produccion.metrado IS 'METRADO measurement';
COMMENT ON COLUMN equipo.parte_diario_produccion.edt IS 'EDT code';

-- Production Activities Checkboxes (codes 01-11)
CREATE TABLE equipo.parte_diario_actividad_produccion (
  id SERIAL PRIMARY KEY,
  parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
  codigo VARCHAR(10) NOT NULL CHECK (codigo IN ('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11')),
  descripcion TEXT, -- For 'Otras' activities (09, 10, 11)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parte_diario_id, codigo)
);

COMMENT ON TABLE equipo.parte_diario_actividad_produccion IS 'ACTIVIDADES DE PRODUCCIÓN checkboxes';
COMMENT ON COLUMN equipo.parte_diario_actividad_produccion.codigo IS '01=Excavación, 02=Sub Base, 03=Base Estabilizada, 04=Tratamiento Superficial Bicapa, 05=Producción de Agregados, 06=Ejecución de Cunetas, 07=Producción de Concreto, 08=Transporte de Material por Volquetes, 09-11=Otras Actividades de Producción';
COMMENT ON COLUMN equipo.parte_diario_actividad_produccion.descripcion IS 'Description for Otras Actividades (codes 09, 10, 11)';

-- Operational Delays Checkboxes (codes D01-D07)
CREATE TABLE equipo.parte_diario_demora_operativa (
  id SERIAL PRIMARY KEY,
  parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
  codigo VARCHAR(10) NOT NULL CHECK (codigo IN ('D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parte_diario_id, codigo)
);

COMMENT ON TABLE equipo.parte_diario_demora_operativa IS 'DEMORAS OPERATIVAS checkboxes';
COMMENT ON COLUMN equipo.parte_diario_demora_operativa.codigo IS 'D01=Abastecimiento de combustible, D02=Toma de alimentos y/o descanso, D03=Espera de ruta, D04=Falla de operador, D05=Traslado de frente, D06=Cambio de guardia, D07=Inspección de Equipo';

-- Other Events Checkboxes (codes D08-D13)
CREATE TABLE equipo.parte_diario_otro_evento (
  id SERIAL PRIMARY KEY,
  parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
  codigo VARCHAR(10) NOT NULL CHECK (codigo IN ('D08', 'D09', 'D10', 'D11', 'D12', 'D13')),
  descripcion TEXT, -- For 'Otros' event (D13)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parte_diario_id, codigo)
);

COMMENT ON TABLE equipo.parte_diario_otro_evento IS 'OTROS EVENTOS checkboxes';
COMMENT ON COLUMN equipo.parte_diario_otro_evento.codigo IS 'D08=Limpieza de Tolva, D09=Limpieza de Tolva, D10=Stand By, D11=Condición Climática, D12=Paros Sociales, D13=Otros';
COMMENT ON COLUMN equipo.parte_diario_otro_evento.descripcion IS 'Description for Otros (code D13)';

-- Mechanical Delays Checkboxes (codes D14-D20)
CREATE TABLE equipo.parte_diario_demora_mecanica (
  id SERIAL PRIMARY KEY,
  parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
  codigo VARCHAR(10) NOT NULL CHECK (codigo IN ('D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20')),
  descripcion TEXT, -- For 'Otros' (D20)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parte_diario_id, codigo)
);

COMMENT ON TABLE equipo.parte_diario_demora_mecanica IS 'DEMORAS MECÁNICAS checkboxes';
COMMENT ON COLUMN equipo.parte_diario_demora_mecanica.codigo IS 'D14=Cambio de Aceite, D15=Cambio de Llanta, D16=Lubricación, D17=Mantenimiento Programado, D18=Falla Mecánica, D19=Cambio Uñas/Cuchillas, D20=Otros';
COMMENT ON COLUMN equipo.parte_diario_demora_mecanica.descripcion IS 'Description for Otros (code D20)';

-- Create indexes for performance
CREATE INDEX idx_parte_produccion_parte ON equipo.parte_diario_produccion(parte_diario_id);
CREATE INDEX idx_parte_produccion_numero ON equipo.parte_diario_produccion(parte_diario_id, numero);
CREATE INDEX idx_actividad_prod_parte ON equipo.parte_diario_actividad_produccion(parte_diario_id);
CREATE INDEX idx_actividad_prod_codigo ON equipo.parte_diario_actividad_produccion(codigo);
CREATE INDEX idx_demora_op_parte ON equipo.parte_diario_demora_operativa(parte_diario_id);
CREATE INDEX idx_demora_op_codigo ON equipo.parte_diario_demora_operativa(codigo);
CREATE INDEX idx_otro_evento_parte ON equipo.parte_diario_otro_evento(parte_diario_id);
CREATE INDEX idx_otro_evento_codigo ON equipo.parte_diario_otro_evento(codigo);
CREATE INDEX idx_demora_mec_parte ON equipo.parte_diario_demora_mecanica(parte_diario_id);
CREATE INDEX idx_demora_mec_codigo ON equipo.parte_diario_demora_mecanica(codigo);
