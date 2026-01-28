-- ============================================
-- Seed: 014_seed_logistics_data.sql
-- Description: Seed initial logistics data (products and movements)
-- Date: 2026-01-18
-- ============================================

-- ============================================
-- PRODUCTOS (Sample Products)
-- ============================================
INSERT INTO logistica.producto (codigo, nombre, descripcion, categoria, unidad_medida, stock_actual, stock_minimo, precio_unitario, is_active) VALUES
  ('CEMENT-001', 'Cemento Portland Tipo I', 'Cemento para uso general en construcción', 'Materiales', 'BOL', 150, 50, 25.50, true),
  ('STEEL-001', 'Varilla de Acero 1/2"', 'Varilla corrugada de acero para construcción', 'Materiales', 'VAR', 200, 100, 35.00, true),
  ('SAND-001', 'Arena Gruesa', 'Arena gruesa para concreto', 'Agregados', 'M3', 25, 10, 45.00, true),
  ('STONE-001', 'Piedra Chancada 3/4"', 'Piedra chancada para concreto', 'Agregados', 'M3', 30, 15, 55.00, true),
  ('FUEL-DIESEL', 'Combustible Diesel B5', 'Diesel para maquinaria pesada', 'Combustibles', 'GAL', 500, 200, 12.50, true),
  ('FUEL-GAS', 'Gasolina 90', 'Gasolina para vehículos livianos', 'Combustibles', 'GAL', 300, 100, 15.80, true),
  ('GREASE-001', 'Grasa Multipropósito', 'Grasa para lubricación de equipos', 'Lubricantes', 'KG', 50, 20, 18.00, true),
  ('OIL-ENGINE', 'Aceite Motor 15W40', 'Aceite para motores diésel', 'Lubricantes', 'GAL', 80, 30, 45.00, true),
  ('PAINT-001', 'Pintura Esmalte Blanco', 'Pintura esmalte sintético', 'Pinturas', 'GAL', 20, 10, 65.00, true),
  ('TOOL-SHOVEL', 'Pala Cuchara', 'Pala de construcción', 'Herramientas', 'UND', 15, 5, 35.00, true),
  ('TOOL-PICKAXE', 'Pico de Construcción', 'Pico para excavación', 'Herramientas', 'UND', 12, 5, 42.00, true),
  ('SAFETY-HELMET', 'Casco de Seguridad', 'Casco protector tipo jockey', 'Seguridad', 'UND', 50, 20, 18.00, true),
  ('SAFETY-VEST', 'Chaleco Reflectivo', 'Chaleco alta visibilidad', 'Seguridad', 'UND', 60, 30, 12.00, true),
  ('SAFETY-GLOVES', 'Guantes de Cuero', 'Guantes de trabajo reforzados', 'Seguridad', 'PAR', 100, 50, 8.50, true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- MOVIMIENTOS (Sample Movements - January 2026)
-- ============================================

-- Entrada de materiales (Stock In) - Jan 5, 2026
INSERT INTO logistica.movimiento (fecha, tipo_movimiento, numero_documento, observaciones, estado, creado_por, proyecto_id) VALUES
  ('2026-01-05', 'entrada', 'GR-2026-001', 'Recepción de materiales para Proyecto ARAMSA', 'completado', 1, 1),
  ('2026-01-08', 'entrada', 'GR-2026-002', 'Compra de combustible para equipos', 'completado', 1, NULL),
  ('2026-01-10', 'entrada', 'GR-2026-003', 'EPPs para operadores', 'completado', 1, NULL);

-- Salida de materiales (Stock Out) - Jan 12-15, 2026
INSERT INTO logistica.movimiento (fecha, tipo_movimiento, numero_documento, observaciones, estado, creado_por, proyecto_id) VALUES
  ('2026-01-12', 'salida', 'SAL-2026-001', 'Despacho de materiales a obra ARAMSA', 'completado', 1, 1),
  ('2026-01-15', 'salida', 'SAL-2026-002', 'Combustible para excavadoras', 'completado', 1, 1);

-- Transferencia entre proyectos (Transfer) - Jan 16, 2026
INSERT INTO logistica.movimiento (fecha, tipo_movimiento, numero_documento, observaciones, estado, creado_por, proyecto_id) VALUES
  ('2026-01-16', 'transferencia', 'TRF-2026-001', 'Transferencia de herramientas a Proyecto COSAPI', 'aprobado', 1, 2);

-- Ajuste de inventario (Adjustment) - Jan 17, 2026
INSERT INTO logistica.movimiento (fecha, tipo_movimiento, numero_documento, observaciones, estado, creado_por, proyecto_id) VALUES
  ('2026-01-17', 'ajuste', 'AJU-2026-001', 'Ajuste por inventario físico', 'pendiente', 1, NULL);

-- ============================================
-- DETALLE_MOVIMIENTO (Movement Line Items)
-- ============================================

-- Details for GR-2026-001 (Entrada de materiales)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total, observaciones) VALUES
  (1, 1, 50, 25.50, 1275.00, 'Cemento Portland'),
  (1, 2, 100, 35.00, 3500.00, 'Varillas 1/2"'),
  (1, 3, 10, 45.00, 450.00, 'Arena gruesa'),
  (1, 4, 15, 55.00, 825.00, 'Piedra chancada');

-- Details for GR-2026-002 (Combustible)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total) VALUES
  (2, 5, 300, 12.50, 3750.00), -- Diesel
  (2, 6, 150, 15.80, 2370.00); -- Gasolina

-- Details for GR-2026-003 (EPPs)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total) VALUES
  (3, 12, 30, 18.00, 540.00),  -- Cascos
  (3, 13, 40, 12.00, 480.00),  -- Chalecos
  (3, 14, 50, 8.50, 425.00);   -- Guantes

-- Details for SAL-2026-001 (Salida a obra)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total) VALUES
  (4, 1, -25, 25.50, -637.50),  -- Negative quantity = stock out
  (4, 2, -50, 35.00, -1750.00),
  (4, 3, -5, 45.00, -225.00);

-- Details for SAL-2026-002 (Combustible a equipos)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total) VALUES
  (5, 5, -200, 12.50, -2500.00); -- Diesel para excavadoras

-- Details for TRF-2026-001 (Transferencia de herramientas)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total) VALUES
  (6, 10, -5, 35.00, -175.00),  -- Palas (salida proyecto 1)
  (6, 11, -3, 42.00, -126.00);  -- Picos (salida proyecto 1)

-- Details for AJU-2026-001 (Ajuste de inventario)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, monto_total, observaciones) VALUES
  (7, 1, 5, 25.50, 127.50, 'Diferencia por conteo físico'),
  (7, 5, -10, 12.50, -125.00, 'Merma detectada en tanque');

-- ============================================
-- UPDATE STOCK LEVELS (Based on movements)
-- ============================================

-- Update producto stock based on completed movements
UPDATE logistica.producto SET stock_actual = 150 WHERE id = 1; -- Cement: 50 + 50 entrada - 25 salida + 5 ajuste
UPDATE logistica.producto SET stock_actual = 200 WHERE id = 2; -- Steel: 0 + 100 entrada - 50 salida
UPDATE logistica.producto SET stock_actual = 25 WHERE id = 3;  -- Sand: 0 + 10 entrada - 5 salida
UPDATE logistica.producto SET stock_actual = 30 WHERE id = 4;  -- Stone: 0 + 15 entrada
UPDATE logistica.producto SET stock_actual = 500 WHERE id = 5; -- Diesel: 0 + 300 entrada - 200 salida - 10 ajuste
UPDATE logistica.producto SET stock_actual = 300 WHERE id = 6; -- Gas: 0 + 150 entrada
UPDATE logistica.producto SET stock_actual = 50 WHERE id = 7;  -- Grease
UPDATE logistica.producto SET stock_actual = 80 WHERE id = 8;  -- Oil
UPDATE logistica.producto SET stock_actual = 20 WHERE id = 9;  -- Paint
UPDATE logistica.producto SET stock_actual = 15 WHERE id = 10; -- Shovel: 0 - 5 transfer
UPDATE logistica.producto SET stock_actual = 12 WHERE id = 11; -- Pickaxe: 0 - 3 transfer
UPDATE logistica.producto SET stock_actual = 50 WHERE id = 12; -- Helmet: 0 + 30 entrada
UPDATE logistica.producto SET stock_actual = 60 WHERE id = 13; -- Vest: 0 + 40 entrada
UPDATE logistica.producto SET stock_actual = 100 WHERE id = 14; -- Gloves: 0 + 50 entrada

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Summary of products
SELECT 
  categoria,
  COUNT(*) as total_productos,
  SUM(stock_actual * precio_unitario) as valor_inventario
FROM logistica.producto
WHERE is_active = true
GROUP BY categoria
ORDER BY categoria;

-- Summary of movements by type
SELECT 
  tipo_movimiento,
  estado,
  COUNT(*) as total_movimientos,
  SUM((SELECT SUM(monto_total) FROM logistica.detalle_movimiento WHERE movimiento_id = m.id)) as monto_total
FROM logistica.movimiento m
GROUP BY tipo_movimiento, estado
ORDER BY tipo_movimiento, estado;
