-- =====================================================
-- Checklist System Tables
-- Description: Inspection checklist templates and results
-- =====================================================

-- Table: Checklist Templates (Plantillas)
CREATE TABLE IF NOT EXISTS equipo.checklist_plantilla (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo_equipo VARCHAR(100), -- 'EXCAVADORA', 'CARGADOR', 'VOLQUETE', etc.
  descripcion TEXT,
  frecuencia VARCHAR(50), -- 'DIARIO', 'SEMANAL', 'MENSUAL', 'ANTES_USO'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);

-- Table: Checklist Items (Items de verificación)
CREATE TABLE IF NOT EXISTS equipo.checklist_item (
  id SERIAL PRIMARY KEY,
  plantilla_id INTEGER NOT NULL REFERENCES equipo.checklist_plantilla(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  categoria VARCHAR(100), -- 'MOTOR', 'HIDRAULICO', 'ELECTRICO', 'SEGURIDAD', 'CABINA', etc.
  descripcion TEXT NOT NULL,
  tipo_verificacion VARCHAR(50) DEFAULT 'VISUAL', -- 'VISUAL', 'MEDICION', 'FUNCIONAL', 'AUDITIVO'
  valor_esperado VARCHAR(100), -- For measurements: "80-90 PSI", "Normal", etc.
  es_critico BOOLEAN DEFAULT false, -- If failed, equipment cannot operate
  requiere_foto BOOLEAN DEFAULT false,
  instrucciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Checklist Inspections (Inspecciones realizadas)
CREATE TABLE IF NOT EXISTS equipo.checklist_inspeccion (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL, -- Format: INS-YYYY-NNNN
  plantilla_id INTEGER NOT NULL REFERENCES equipo.checklist_plantilla(id),
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id),
  trabajador_id INTEGER NOT NULL REFERENCES rrhh.trabajador(id),
  fecha_inspeccion DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME,
  hora_fin TIME,
  ubicacion VARCHAR(255), -- GPS coords or project location
  horometro_inicial DECIMAL(10,2),
  odometro_inicial DECIMAL(10,2),
  estado VARCHAR(50) DEFAULT 'EN_PROGRESO', -- 'EN_PROGRESO', 'COMPLETADO', 'RECHAZADO', 'CANCELADO'
  resultado_general VARCHAR(50), -- 'APROBADO', 'APROBADO_CON_OBSERVACIONES', 'RECHAZADO'
  items_conforme INTEGER DEFAULT 0,
  items_no_conforme INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  observaciones_generales TEXT,
  requiere_mantenimiento BOOLEAN DEFAULT false,
  equipo_operativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completado_en TIMESTAMP
);

-- Table: Checklist Results (Resultados por item)
CREATE TABLE IF NOT EXISTS equipo.checklist_resultado (
  id SERIAL PRIMARY KEY,
  inspeccion_id INTEGER NOT NULL REFERENCES equipo.checklist_inspeccion(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES equipo.checklist_item(id),
  conforme BOOLEAN, -- true = OK, false = Failed, null = N/A or Skipped
  valor_medido VARCHAR(100), -- Actual measured value
  observaciones TEXT,
  accion_requerida VARCHAR(50), -- 'NINGUNA', 'OBSERVAR', 'REPARAR', 'REEMPLAZAR'
  foto_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_plantilla_activo ON equipo.checklist_plantilla(activo);
CREATE INDEX IF NOT EXISTS idx_checklist_plantilla_tipo ON equipo.checklist_plantilla(tipo_equipo);

CREATE INDEX IF NOT EXISTS idx_checklist_item_plantilla ON equipo.checklist_item(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_categoria ON equipo.checklist_item(categoria);
CREATE INDEX IF NOT EXISTS idx_checklist_item_critico ON equipo.checklist_item(es_critico);

CREATE INDEX IF NOT EXISTS idx_checklist_inspeccion_fecha ON equipo.checklist_inspeccion(fecha_inspeccion);
CREATE INDEX IF NOT EXISTS idx_checklist_inspeccion_equipo ON equipo.checklist_inspeccion(equipo_id);
CREATE INDEX IF NOT EXISTS idx_checklist_inspeccion_trabajador ON equipo.checklist_inspeccion(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_checklist_inspeccion_estado ON equipo.checklist_inspeccion(estado);
CREATE INDEX IF NOT EXISTS idx_checklist_inspeccion_resultado ON equipo.checklist_inspeccion(resultado_general);

CREATE INDEX IF NOT EXISTS idx_checklist_resultado_inspeccion ON equipo.checklist_resultado(inspeccion_id);
CREATE INDEX IF NOT EXISTS idx_checklist_resultado_conforme ON equipo.checklist_resultado(conforme);

-- Sample Templates
INSERT INTO equipo.checklist_plantilla (codigo, nombre, tipo_equipo, descripcion, frecuencia, created_by)
VALUES 
  ('CHK-EXC-DIARIO', 'Inspección Diaria - Excavadora', 'EXCAVADORA', 'Checklist de inspección diaria antes de iniciar operaciones con excavadora', 'DIARIO', 1),
  ('CHK-CARG-DIARIO', 'Inspección Diaria - Cargador Frontal', 'CARGADOR', 'Checklist de inspección diaria antes de iniciar operaciones con cargador frontal', 'DIARIO', 1),
  ('CHK-VOL-DIARIO', 'Inspección Diaria - Volquete', 'VOLQUETE', 'Checklist de inspección diaria antes de iniciar operaciones con volquete', 'DIARIO', 1);

-- Sample Items for Excavadora
INSERT INTO equipo.checklist_item (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
VALUES 
  (1, 1, 'SEGURIDAD', 'Verificar cinturón de seguridad en buen estado', 'VISUAL', true, false),
  (1, 2, 'SEGURIDAD', 'Verificar funcionamiento de bocina', 'FUNCIONAL', true, false),
  (1, 3, 'SEGURIDAD', 'Verificar luces de trabajo delanteras y traseras', 'FUNCIONAL', true, false),
  (1, 4, 'SEGURIDAD', 'Verificar alarma de retroceso', 'FUNCIONAL', true, false),
  (1, 5, 'MOTOR', 'Nivel de aceite de motor', 'VISUAL', true, false),
  (1, 6, 'MOTOR', 'Nivel de refrigerante', 'VISUAL', true, false),
  (1, 7, 'MOTOR', 'Verificar fugas de aceite o combustible', 'VISUAL', true, true),
  (1, 8, 'HIDRAULICO', 'Nivel de aceite hidráulico', 'VISUAL', true, false),
  (1, 9, 'HIDRAULICO', 'Estado de mangueras hidráulicas', 'VISUAL', true, true),
  (1, 10, 'HIDRAULICO', 'Verificar fugas en sistema hidráulico', 'VISUAL', true, true),
  (1, 11, 'TREN_RODAJE', 'Estado de zapatas/orugas', 'VISUAL', false, true),
  (1, 12, 'TREN_RODAJE', 'Tensión de cadenas', 'VISUAL', false, false),
  (1, 13, 'ESTRUCTURA', 'Estado del balde/cucharón', 'VISUAL', true, true),
  (1, 14, 'ESTRUCTURA', 'Verificar pasadores y seguros', 'VISUAL', true, false),
  (1, 15, 'CABINA', 'Limpieza de vidrios y espejos', 'VISUAL', false, false),
  (1, 16, 'CABINA', 'Funcionamiento de limpiaparabrisas', 'FUNCIONAL', false, false),
  (1, 17, 'INSTRUMENTOS', 'Verificar panel de instrumentos funcional', 'FUNCIONAL', true, false),
  (1, 18, 'INSTRUMENTOS', 'Verificar indicadores de temperatura y presión', 'FUNCIONAL', true, false);

-- Sample Items for Cargador Frontal
INSERT INTO equipo.checklist_item (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
VALUES 
  (2, 1, 'SEGURIDAD', 'Verificar cinturón de seguridad', 'VISUAL', true, false),
  (2, 2, 'SEGURIDAD', 'Verificar bocina de trabajo', 'FUNCIONAL', true, false),
  (2, 3, 'SEGURIDAD', 'Verificar luces de trabajo', 'FUNCIONAL', true, false),
  (2, 4, 'SEGURIDAD', 'Verificar frenos de servicio', 'FUNCIONAL', true, false),
  (2, 5, 'SEGURIDAD', 'Verificar freno de parqueo', 'FUNCIONAL', true, false),
  (2, 6, 'MOTOR', 'Nivel de aceite de motor', 'VISUAL', true, false),
  (2, 7, 'MOTOR', 'Nivel de refrigerante', 'VISUAL', true, false),
  (2, 8, 'HIDRAULICO', 'Nivel de aceite hidráulico', 'VISUAL', true, false),
  (2, 9, 'HIDRAULICO', 'Verificar cilindros de levante', 'VISUAL', true, true),
  (2, 10, 'HIDRAULICO', 'Verificar cilindros de volteo', 'VISUAL', true, true),
  (2, 11, 'NEUMATICOS', 'Presión de neumáticos', 'MEDICION', true, false),
  (2, 12, 'NEUMATICOS', 'Estado de bandas de rodadura', 'VISUAL', true, true),
  (2, 13, 'ESTRUCTURA', 'Estado del balde', 'VISUAL', true, true),
  (2, 14, 'ESTRUCTURA', 'Verificar pasadores del balde', 'VISUAL', true, false);

-- Sample Items for Volquete
INSERT INTO equipo.checklist_item (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
VALUES 
  (3, 1, 'SEGURIDAD', 'Verificar cinturón de seguridad', 'VISUAL', true, false),
  (3, 2, 'SEGURIDAD', 'Verificar bocina', 'FUNCIONAL', true, false),
  (3, 3, 'SEGURIDAD', 'Verificar luces delanteras', 'FUNCIONAL', true, false),
  (3, 4, 'SEGURIDAD', 'Verificar luces traseras y de freno', 'FUNCIONAL', true, false),
  (3, 5, 'SEGURIDAD', 'Verificar sistema de frenos', 'FUNCIONAL', true, false),
  (3, 6, 'MOTOR', 'Nivel de aceite de motor', 'VISUAL', true, false),
  (3, 7, 'MOTOR', 'Nivel de refrigerante', 'VISUAL', true, false),
  (3, 8, 'NEUMATICOS', 'Presión de neumáticos delanteros', 'MEDICION', true, false),
  (3, 9, 'NEUMATICOS', 'Presión de neumáticos traseros', 'MEDICION', true, false),
  (3, 10, 'NEUMATICOS', 'Estado de neumáticos', 'VISUAL', true, true),
  (3, 11, 'TOLVA', 'Verificar mecanismo de levante de tolva', 'FUNCIONAL', true, false),
  (3, 12, 'TOLVA', 'Verificar cilindros hidráulicos', 'VISUAL', true, true),
  (3, 13, 'TOLVA', 'Verificar seguros de compuerta', 'VISUAL', true, false),
  (3, 14, 'ESTRUCTURA', 'Verificar chasis sin fisuras', 'VISUAL', false, true);

COMMENT ON TABLE equipo.checklist_plantilla IS 'Plantillas de checklist para inspección de equipos';
COMMENT ON TABLE equipo.checklist_item IS 'Items de verificación de cada plantilla';
COMMENT ON TABLE equipo.checklist_inspeccion IS 'Inspecciones realizadas basadas en plantillas';
COMMENT ON TABLE equipo.checklist_resultado IS 'Resultados de cada item en una inspección';
