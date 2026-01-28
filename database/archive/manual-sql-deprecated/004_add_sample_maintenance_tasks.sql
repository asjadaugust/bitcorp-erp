-- ============================================================================
-- Bitcorp ERP - Seed Data for Maintenance and Scheduled Tasks
-- Migration: 004_add_sample_maintenance_tasks.sql
-- Date: 2026-01-04
-- Description: Add sample maintenance schedules and scheduled tasks
-- ============================================================================

-- Sample maintenance schedules for existing equipment
INSERT INTO equipo.programa_mantenimiento 
  (equipo_id, tipo_mantenimiento, descripcion, fecha_programada, costo_estimado, estado, observaciones)
VALUES
  (1, 'PREVENTIVO', 'Cambio de aceite y filtros - 500 horas', '2024-06-15', 850.00, 'PROGRAMADO', 'Mantenimiento rutinario cada 500 horas de operación'),
  (1, 'PREVENTIVO', 'Inspección general del sistema hidráulico', '2024-07-01', 1200.00, 'PROGRAMADO', 'Revisión completa del sistema hidráulico'),
  (2, 'PREVENTIVO', 'Cambio de aceite y filtros - 500 horas', '2024-06-20', 850.00, 'PROGRAMADO', 'Mantenimiento rutinario cada 500 horas de operación'),
  (3, 'CORRECTIVO', 'Reparación del sistema de frenos', '2024-06-18', 2500.00, 'PENDIENTE', 'Frenos requieren atención inmediata'),
  (4, 'PREVENTIVO', 'Mantenimiento de 1000 horas', '2024-07-10', 1800.00, 'PROGRAMADO', 'Mantenimiento mayor programado'),
  (5, 'PREVENTIVO', 'Revisión de motor y transmisión', '2024-06-25', 1500.00, 'PROGRAMADO', 'Inspección detallada de componentes críticos')
ON CONFLICT DO NOTHING;

-- Sample scheduled tasks (general maintenance tasks)
INSERT INTO equipo.tarea_programada 
  (equipo_id, trabajador_id, task_type, title, description, start_date, end_date, start_time, end_time, duration_minutes, priority, status, proyecto_id)
VALUES
  -- Maintenance tasks for EXC-001
  (1, 1, 'maintenance', 'Mantenimiento 500hrs EXC-001', 
   'Cambio de aceite, filtros de aire y combustible. Revisión general del sistema hidráulico.', 
   '2024-06-15', '2024-06-15', '08:00:00', '12:00:00', 240, 'high', 'pending', 1),
  
  (1, 2, 'inspection', 'Inspección diaria EXC-001',
   'Inspección rutinaria de niveles, fugas y componentes críticos antes de iniciar operación.',
   '2024-06-10', '2024-06-10', '07:00:00', '07:30:00', 30, 'medium', 'pending', 1),
  
  -- Maintenance tasks for EXC-002
  (2, 1, 'maintenance', 'Mantenimiento preventivo EXC-002',
   'Servicio de mantenimiento preventivo programado. Incluye revisión completa.',
   '2024-06-20', '2024-06-20', '08:00:00', '13:00:00', 300, 'high', 'pending', 1),
  
  -- Maintenance tasks for CARG-001
  (3, 3, 'maintenance', 'Reparación sistema de frenos CARG-001',
   'Reparación correctiva del sistema de frenos. Reemplazo de pastillas y revisión de discos.',
   '2024-06-18', '2024-06-18', '09:00:00', '16:00:00', 420, 'urgent', 'pending', 1),
  
  (3, 3, 'inspection', 'Inspección post-reparación CARG-001',
   'Verificación del correcto funcionamiento tras reparación de frenos.',
   '2024-06-19', '2024-06-19', '08:00:00', '09:00:00', 60, 'high', 'pending', 1),
  
  -- Maintenance tasks for CARG-002
  (4, 2, 'maintenance', 'Mantenimiento mayor 1000hrs CARG-002',
   'Mantenimiento mayor programado a las 1000 horas. Incluye revisión completa de motor y transmisión.',
   '2024-07-10', '2024-07-10', '08:00:00', '17:00:00', 540, 'high', 'pending', 2),
  
  -- Maintenance tasks for ROD-001
  (5, 4, 'maintenance', 'Revisión motor y transmisión ROD-001',
   'Inspección detallada del motor y sistema de transmisión. Cambio de aceites y filtros.',
   '2024-06-25', '2024-06-25', '08:00:00', '14:00:00', 360, 'medium', 'pending', 2),
  
  -- General inspection task
  (6, 5, 'inspection', 'Inspección semanal MOTO-001',
   'Inspección semanal de rutina. Verificación de niveles, estado general y documentación.',
   '2024-06-12', '2024-06-12', '07:00:00', '08:00:00', 60, 'low', 'pending', 2)
ON CONFLICT DO NOTHING;

-- Add some completed maintenance records (for historical data)
INSERT INTO equipo.programa_mantenimiento 
  (equipo_id, tipo_mantenimiento, descripcion, fecha_programada, fecha_realizada, costo_estimado, costo_real, tecnico_responsable, estado, observaciones)
VALUES
  (1, 'PREVENTIVO', 'Cambio de aceite 250 horas', '2024-05-15', '2024-05-16', 650.00, 680.00, 'Juan Pérez', 'COMPLETADO', 'Mantenimiento completado sin inconvenientes'),
  (2, 'PREVENTIVO', 'Inspección de 250 horas', '2024-05-18', '2024-05-18', 500.00, 500.00, 'Carlos Quispe', 'COMPLETADO', 'Equipo en buen estado'),
  (3, 'CORRECTIVO', 'Cambio de neumáticos', '2024-04-20', '2024-04-22', 3200.00, 3450.00, 'Miguel Torres', 'COMPLETADO', 'Reemplazo de 4 neumáticos por desgaste')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check inserted maintenance schedules
SELECT 
  pm.id,
  e.codigo_equipo,
  pm.tipo_mantenimiento,
  pm.fecha_programada,
  pm.estado
FROM equipo.programa_mantenimiento pm
JOIN equipo.equipo e ON e.id = pm.equipo_id
ORDER BY pm.fecha_programada;

-- Check inserted scheduled tasks
SELECT 
  tp.id,
  e.codigo_equipo,
  t.nombres || ' ' || t.apellido_paterno as operador,
  tp.title,
  tp.start_date,
  tp.priority,
  tp.status
FROM equipo.tarea_programada tp
JOIN equipo.equipo e ON e.id = tp.equipo_id
LEFT JOIN rrhh.trabajador t ON t.id = tp.trabajador_id
ORDER BY tp.start_date, tp.priority DESC;
