-- Migration: Seed Detail Data for Valuation Testing
-- Purpose: Create sample data for testing Pages 2-7 of valuation PDF
-- Depends on: 007_add_detail_tables.sql

BEGIN;

-- ============================================================================
-- Seed: Fuel Consumption Details (Page 2)
-- For Valuation ID 1 (CON-2024-001, EXC-001, Period 2024-01)
-- ============================================================================
INSERT INTO equipo.equipo_combustible 
(valorizacion_id, fecha, num_vale_salida, horometro_odometro, inicial, cantidad, precio_unitario, monto_total, comentario)
VALUES 
-- Week 1
(1, '2024-01-05', 'VS-001', 'HORÓMETRO', 1250.5, 150.5, 15.80, 2377.90, 'Consumo normal operación'),
(1, '2024-01-08', 'VS-002', 'HORÓMETRO', 1285.3, 142.3, 15.80, 2248.34, 'Trabajo en zona A'),
(1, '2024-01-12', 'VS-003', 'HORÓMETRO', 1318.7, 155.8, 15.80, 2461.64, 'Trabajo intensivo'),
-- Week 2
(1, '2024-01-15', 'VS-004', 'HORÓMETRO', 1355.2, 148.2, 15.80, 2341.56, 'Mantenimiento preventivo'),
(1, '2024-01-19', 'VS-005', 'HORÓMETRO', 1390.5, 145.6, 15.80, 2300.48, 'Operación estándar'),
-- Week 3
(1, '2024-01-22', 'VS-006', 'HORÓMETRO', 1424.8, 152.4, 15.80, 2407.92, 'Zona difícil acceso'),
(1, '2024-01-26', 'VS-007', 'HORÓMETRO', 1460.3, 149.7, 15.80, 2365.26, 'Trabajo nocturno'),
-- Week 4
(1, '2024-01-29', 'VS-008', 'HORÓMETRO', 1495.1, 146.9, 15.80, 2321.02, 'Finalización mes');

-- ============================================================================
-- Seed: Excess Fuel Charges (Page 3)
-- For Valuation ID 1
-- ============================================================================
INSERT INTO equipo.exceso_combustible 
(valorizacion_id, consumo_combustible, tipo_horo_odo, inicio, final, total, 
 rendimiento, ratio_control, diferencia, exceso_combustible, precio_unitario, importe_exceso_combustible, observaciones)
VALUES 
(1, 1191.4, 'HORÓMETRO', 1250.5, 1495.1, 244.6,
 4.87, 4.50, 90.52, 90.52, 15.80, 1430.22, 
 'Exceso por condiciones de terreno difícil y trabajo intensivo en zona A');

-- ============================================================================
-- Seed: Work Expenses (Page 4)
-- For Valuation ID 1
-- ============================================================================
INSERT INTO equipo.gasto_obra 
(valorizacion_id, fecha_operacion, proveedor, concepto, tipo_documento, num_documento, 
 importe, incluye_igv, importe_sin_igv, observaciones)
VALUES 
-- Lubricants and filters
(1, '2024-01-10', 'Lubricantes del Sur S.A.C.', 'Aceite Motor 15W40 (20 galones)', 'FACTURA', 'F001-12345', 
 1180.00, 'SI', 1000.00, 'Cambio aceite preventivo'),
(1, '2024-01-10', 'Lubricantes del Sur S.A.C.', 'Filtros (aceite, combustible, aire)', 'FACTURA', 'F001-12346', 
 590.00, 'SI', 500.00, 'Kit filtros mantenimiento'),
-- Spare parts
(1, '2024-01-15', 'Repuestos Maquinaria S.A.', 'Correa alternador', 'FACTURA', 'F002-8765', 
 236.00, 'SI', 200.00, 'Reemplazo por desgaste'),
(1, '2024-01-18', 'Ferretería Industrial', 'Pernos y tuercas varios', 'BOLETA', 'B001-5432', 
 94.40, 'SI', 80.00, 'Sujeción componentes'),
-- Minor repairs
(1, '2024-01-22', 'Taller Mecánico Central', 'Reparación bomba hidráulica', 'FACTURA', 'F003-4321', 
 1770.00, 'SI', 1500.00, 'Urgente - falla operativa'),
-- Consumables
(1, '2024-01-25', 'Distribuidora Norte', 'Grasa multipropósito (10 kg)', 'BOLETA', 'B002-9876', 
 141.60, 'SI', 120.00, 'Engrase general');

-- ============================================================================
-- Seed: Advances/Amortizations (Page 5)
-- For Valuation ID 1
-- ============================================================================
INSERT INTO equipo.adelanto_amortizacion 
(valorizacion_id, equipo_id, fecha_operacion, tipo_operacion, num_documento, concepto, num_cuota, monto, observaciones)
VALUES 
-- Previous advance from December
(1, 1, '2023-12-01', 'ADELANTO', 'ADL-2023-12-001', 'Adelanto mes Diciembre 2023', NULL, 5000.00, 
 'Adelanto solicitado por proveedor para costos operativos'),
-- Amortization in current month
(1, 1, '2024-01-31', 'AMORTIZACION', 'VAL-001', 'Amortización adelanto Diciembre', '1/5', -1000.00, 
 'Primera cuota de 5 para amortización adelanto');

-- ============================================================================
-- Seed: Data for Valuation ID 2 (Different equipment, different patterns)
-- ============================================================================
INSERT INTO equipo.equipo_combustible 
(valorizacion_id, fecha, num_vale_salida, horometro_odometro, inicial, cantidad, precio_unitario, monto_total, comentario)
VALUES 
(2, '2024-01-03', 'VS-101', 'HORÓMETRO', 2100.0, 165.2, 15.80, 2610.16, 'Inicio operaciones'),
(2, '2024-01-10', 'VS-102', 'HORÓMETRO', 2142.5, 170.8, 15.80, 2698.64, 'Trabajo pesado'),
(2, '2024-01-17', 'VS-103', 'HORÓMETRO', 2186.3, 168.4, 15.80, 2660.72, 'Operación continua'),
(2, '2024-01-24', 'VS-104', 'HORÓMETRO', 2228.9, 172.1, 15.80, 2719.18, 'Cierre mes'),
(2, '2024-01-31', 'VS-105', 'HORÓMETRO', 2273.2, 169.3, 15.80, 2674.94, 'Final periodo');

INSERT INTO equipo.exceso_combustible 
(valorizacion_id, consumo_combustible, tipo_horo_odo, inicio, final, total, 
 rendimiento, ratio_control, diferencia, exceso_combustible, precio_unitario, importe_exceso_combustible)
VALUES 
(2, 845.8, 'HORÓMETRO', 2100.0, 2273.2, 173.2,
 4.88, 4.50, 65.82, 65.82, 15.80, 1039.96);

INSERT INTO equipo.gasto_obra 
(valorizacion_id, fecha_operacion, proveedor, concepto, tipo_documento, num_documento, 
 importe, incluye_igv, importe_sin_igv)
VALUES 
(2, '2024-01-12', 'Servicios Técnicos S.A.', 'Mantenimiento preventivo 500 horas', 'FACTURA', 'F004-1111', 
 2360.00, 'SI', 2000.00),
(2, '2024-01-20', 'Repuestos Originales', 'Rodamiento principal', 'FACTURA', 'F005-2222', 
 826.00, 'SI', 700.00);

-- ============================================================================
-- Seed: Data for Valuation ID 3 (Loader - different fuel pattern)
-- ============================================================================
INSERT INTO equipo.equipo_combustible 
(valorizacion_id, fecha, num_vale_salida, horometro_odometro, inicial, cantidad, precio_unitario, monto_total, comentario)
VALUES 
(3, '2024-01-04', 'VS-201', 'HORÓMETRO', 3450.0, 95.5, 15.80, 1508.90, 'Cargador frontal'),
(3, '2024-01-11', 'VS-202', 'HORÓMETRO', 3492.3, 98.2, 15.80, 1551.56, 'Trabajo medio'),
(3, '2024-01-18', 'VS-203', 'HORÓMETRO', 3535.8, 96.8, 15.80, 1529.44, 'Operación normal'),
(3, '2024-01-25', 'VS-204', 'HORÓMETRO', 3578.1, 99.4, 15.80, 1570.52, 'Cierre periodo');

INSERT INTO equipo.gasto_obra 
(valorizacion_id, fecha_operacion, proveedor, concepto, tipo_documento, num_documento, 
 importe, incluye_igv, importe_sin_igv)
VALUES 
(3, '2024-01-08', 'Llantas y Neumáticos', 'Neumático 20.5R25', 'FACTURA', 'F006-3333', 
 3540.00, 'SI', 3000.00),
(3, '2024-01-16', 'Lubricantes Express', 'Aceite hidráulico 68 (55 gal)', 'FACTURA', 'F007-4444', 
 1770.00, 'SI', 1500.00);

INSERT INTO equipo.adelanto_amortizacion 
(valorizacion_id, equipo_id, fecha_operacion, tipo_operacion, num_documento, concepto, num_cuota, monto)
VALUES 
(3, 3, '2023-12-15', 'ADELANTO', 'ADL-2023-12-003', 'Adelanto Diciembre reparación mayor', NULL, 8000.00),
(3, 3, '2024-01-31', 'AMORTIZACION', 'VAL-003', 'Amortización adelanto', '1/8', -1000.00);

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Check fuel consumption
-- SELECT v.id, v.numero_valorizacion, COUNT(ec.*) as fuel_records, SUM(ec.cantidad) as total_gallons
-- FROM equipo.valorizacion_equipo v
-- LEFT JOIN equipo.equipo_combustible ec ON ec.valorizacion_id = v.id
-- GROUP BY v.id, v.numero_valorizacion
-- ORDER BY v.id;

-- Check excess fuel
-- SELECT v.numero_valorizacion, ef.exceso_combustible, ef.importe_exceso_combustible
-- FROM equipo.valorizacion_equipo v
-- LEFT JOIN equipo.exceso_combustible ef ON ef.valorizacion_id = v.id
-- ORDER BY v.id;

-- Check work expenses
-- SELECT v.numero_valorizacion, COUNT(go.*) as expense_count, SUM(go.importe_sin_igv) as total_expenses
-- FROM equipo.valorizacion_equipo v
-- LEFT JOIN equipo.gasto_obra go ON go.valorizacion_id = v.id
-- GROUP BY v.numero_valorizacion
-- ORDER BY v.numero_valorizacion;

-- Check advances
-- SELECT v.numero_valorizacion, aa.tipo_operacion, aa.concepto, aa.monto
-- FROM equipo.valorizacion_equipo v
-- LEFT JOIN equipo.adelanto_amortizacion aa ON aa.valorizacion_id = v.id
-- ORDER BY v.id, aa.fecha_operacion;
