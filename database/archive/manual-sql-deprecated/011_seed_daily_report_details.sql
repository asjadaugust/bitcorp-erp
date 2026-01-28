-- =====================================================
-- Database Seed: Daily Report Details
-- Version: 011
-- Description: Seed data for testing daily report PDF generation
-- Date: 2026-01-05
-- =====================================================

-- First, update existing daily reports with new fields (migration for existing data)
UPDATE equipo.parte_diario pd
SET 
  empresa = 'Consorcio La Unión',
  turno = CASE 
    WHEN EXTRACT(HOUR FROM pd.hora_inicio) >= 6 AND EXTRACT(HOUR FROM pd.hora_inicio) < 18 THEN 'DIA'
    ELSE 'NOCHE'
  END,
  codigo = e.codigo_equipo,
  placa = e.placa
FROM equipo.equipo e
WHERE pd.equipo_id = e.id
AND pd.empresa IS NULL;

-- Update report numbers sequentially per project
WITH numbered_reports AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY proyecto_id ORDER BY fecha, created_at) as row_num
  FROM equipo.parte_diario
  WHERE numero_parte IS NULL
)
UPDATE equipo.parte_diario pd
SET numero_parte = nr.row_num
FROM numbered_reports nr
WHERE pd.id = nr.id;

-- =====================================================
-- Create a complete sample daily report for testing
-- =====================================================

-- Get IDs for sample data (using existing records)
DO $$
DECLARE
  v_parte_diario_id INTEGER;
  v_equipo_id INTEGER;
  v_trabajador_id INTEGER;
  v_proyecto_id INTEGER;
BEGIN
  -- Get first available equipment, worker, and project
  SELECT id INTO v_equipo_id FROM equipo.equipo LIMIT 1;
  SELECT id INTO v_trabajador_id FROM rrhh.trabajador LIMIT 1;
  SELECT id INTO v_proyecto_id FROM proyectos.edt LIMIT 1;

  -- Insert a complete daily report
  INSERT INTO equipo.parte_diario (
    equipo_id, trabajador_id, proyecto_id,
    fecha, hora_inicio, hora_fin, horas_trabajadas,
    horometro_inicial, horometro_final,
    odometro_inicial, odometro_final, km_recorridos,
    combustible_inicial, combustible_consumido,
    estado, creado_por,
    -- New fields
    codigo, empresa, placa, responsable_frente, turno, numero_parte,
    petroleo_gln, gasolina_gln, hora_abastecimiento, num_vale_combustible, horometro_kilometraje,
    lugar_salida, lugar_llegada, observaciones_correcciones
  ) VALUES (
    v_equipo_id, v_trabajador_id, v_proyecto_id,
    CURRENT_DATE, '07:00:00', '17:00:00', 10.00,
    1250.50, 1260.50,
    5200.00, 5300.00, 100.00,
    80.00, 25.50,
    'APROBADO', 1,
    -- New field values
    'EXC-001', 'Consorcio La Unión', 'ABC-123', 'Juan García', 'DIA', 1,
    45.5, 12.3, '12:30:00', 'VC-2024-001', '1255.25',
    'Campamento Base', 'Km 45+200', 
    'Trabajo realizado sin inconvenientes. Se completaron las actividades programadas según EDT.'
  ) RETURNING id INTO v_parte_diario_id;

  -- Insert production control rows (sample data)
  INSERT INTO equipo.parte_diario_produccion (parte_diario_id, numero, ubicacion_labores_prog_ini, ubicacion_labores_prog_fin, hora_ini, hora_fin, material_trabajado_descripcion, metrado, edt) VALUES
  (v_parte_diario_id, 1, 'Km 45+000', 'Km 45+200', '07:00', '09:30', 'Excavación masiva material suelto', '350 m3', '01.02.03'),
  (v_parte_diario_id, 2, 'Km 45+200', 'Km 45+400', '09:30', '12:00', 'Excavación en roca suelta', '280 m3', '01.02.04'),
  (v_parte_diario_id, 3, 'Km 45+400', 'Km 45+500', '13:00', '15:30', 'Conformación de sub-rasante', '150 m2', '01.03.01'),
  (v_parte_diario_id, 4, 'Km 45+500', 'Km 45+600', '15:30', '17:00', 'Perfilado y compactación', '120 m2', '01.03.02');

  -- Insert production activities (checkboxes selected)
  INSERT INTO equipo.parte_diario_actividad_produccion (parte_diario_id, codigo, descripcion) VALUES
  (v_parte_diario_id, '01', NULL), -- Excavación
  (v_parte_diario_id, '02', NULL), -- Sub Base
  (v_parte_diario_id, '03', NULL); -- Base Estabilizada

  -- Insert operational delays
  INSERT INTO equipo.parte_diario_demora_operativa (parte_diario_id, codigo) VALUES
  (v_parte_diario_id, 'D01'), -- Abastecimiento de combustible
  (v_parte_diario_id, 'D02'); -- Toma de alimentos

  -- Insert other events
  INSERT INTO equipo.parte_diario_otro_evento (parte_diario_id, codigo, descripcion) VALUES
  (v_parte_diario_id, 'D11', NULL); -- Condición Climática

  -- Insert mechanical delays
  INSERT INTO equipo.parte_diario_demora_mecanica (parte_diario_id, codigo, descripcion) VALUES
  (v_parte_diario_id, 'D16', NULL); -- Lubricación

  RAISE NOTICE 'Sample daily report created with ID: %', v_parte_diario_id;
END $$;

-- =====================================================
-- Add more production rows to first existing daily report
-- (for testing with real data)
-- =====================================================

DO $$
DECLARE
  v_existing_parte_id INTEGER;
BEGIN
  -- Get first existing daily report
  SELECT id INTO v_existing_parte_id FROM equipo.parte_diario ORDER BY id LIMIT 1;
  
  IF v_existing_parte_id IS NOT NULL THEN
    -- Add production rows if not exists
    INSERT INTO equipo.parte_diario_produccion (parte_diario_id, numero, ubicacion_labores_prog_ini, ubicacion_labores_prog_fin, hora_ini, hora_fin, material_trabajado_descripcion, metrado, edt)
    SELECT v_existing_parte_id, 1, 'Zona A', 'Zona B', '08:00', '10:00', 'Excavación y nivelación', '200 m3', '01.01'
    WHERE NOT EXISTS (SELECT 1 FROM equipo.parte_diario_produccion WHERE parte_diario_id = v_existing_parte_id);
    
    -- Add some activities
    INSERT INTO equipo.parte_diario_actividad_produccion (parte_diario_id, codigo)
    SELECT v_existing_parte_id, '01'
    WHERE NOT EXISTS (SELECT 1 FROM equipo.parte_diario_actividad_produccion WHERE parte_diario_id = v_existing_parte_id AND codigo = '01');
    
    RAISE NOTICE 'Updated existing daily report ID: %', v_existing_parte_id;
  END IF;
END $$;

-- Verify data
SELECT 'Daily Reports' as table_name, COUNT(*) as count FROM equipo.parte_diario
UNION ALL
SELECT 'Production Rows', COUNT(*) FROM equipo.parte_diario_produccion
UNION ALL
SELECT 'Production Activities', COUNT(*) FROM equipo.parte_diario_actividad_produccion
UNION ALL
SELECT 'Operational Delays', COUNT(*) FROM equipo.parte_diario_demora_operativa
UNION ALL
SELECT 'Other Events', COUNT(*) FROM equipo.parte_diario_otro_evento
UNION ALL
SELECT 'Mechanical Delays', COUNT(*) FROM equipo.parte_diario_demora_mecanica;
