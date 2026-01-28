-- ============================================
-- Migration 007: January 2026 Monthly Valuations Seed Data
-- Date: 2026-01-18
-- Purpose: Create monthly valuation records (valorizaciones) for January 2026
--          based on daily reports, linking partes diarios to valuations
-- ============================================

-- Current state:
--   - 79 daily reports covering 18 equipment items
--   - 16 equipment with January 2026 daily reports
--   - 3 existing valuations (from previous periods: 2025-01, 2025-02)
--   - 0 daily reports linked to valuations (valorizacion_id = NULL)
--   - 17 active contracts with various pricing models:
--     - 11 hourly (POR_HORA)
--     - 5 monthly flat rate (TARIFA_FIJA_MENSUAL)
--     - 1 daily rate (POR_DIA)
--
-- Target state:
--   - Add 16 valuations for January 2026 (periodo = '2026-01')
--   - Link 52 daily reports to their respective valuations
--   - Calculate costs based on contract type:
--     * Hourly: hours_worked × hourly_rate
--     * Monthly: flat_rate (assuming within included hours)
--     * Daily: days_worked × daily_rate
--   - Status distribution: 12 APROBADO, 3 PENDIENTE, 1 EN_REVISION
--   - Include fuel costs (fuel_consumed × PEN 15/liter)

-- ============================================
-- SECTION 1: HOURLY CONTRACTS (POR_HORA)
-- ============================================

-- Valuation 4: EXC-001 (Contract 2: CONT-2025-001-AD01)
-- Adenda pricing: PEN 380/hour, 8 hours included daily, excess @ PEN 55/hour
-- January reports: 3 reports, 28.5 hours total (Jan 14-16)
-- Calculation: 28.5 hours × PEN 380 = PEN 10,830
-- Fuel: 139.5 liters × PEN 15 = PEN 2,092.50
-- Total: PEN 12,922.50
INSERT INTO equipo.valorizacion_equipo (
  equipo_id,
  contrato_id,
  proyecto_id,
  periodo,
  fecha_inicio,
  fecha_fin,
  dias_trabajados,
  horas_trabajadas,
  combustible_consumido,
  costo_base,
  costo_combustible,
  cargos_adicionales,
  total_valorizado,
  numero_valorizacion,
  tipo_cambio,
  descuento_porcentaje,
  descuento_monto,
  igv_porcentaje,
  igv_monto,
  total_con_igv,
  estado,
  observaciones,
  creado_por,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-001'),
  2, -- Contract ID for CONT-2025-001-AD01
  1, -- Proyecto "Proyecto Lima Norte"
  '2026-01',
  '2026-01-14',
  '2026-01-16',
  3,
  28.50,
  139.50,
  10830.00, -- 28.5 × 380
  2092.50, -- 139.5 × 15
  0.00,
  12922.50, -- 10830 + 2092.50
  'VAL-2026-01-001',
  3.75, -- USD/PEN exchange rate
  0.00,
  0.00,
  18.00,
  2326.05, -- 12922.50 × 0.18
  15248.55, -- 12922.50 + 2326.05
  'APROBADO',
  'Valorización parcial enero 2026 - Excavadora CAT 320D',
  1, -- Created by admin
  '2026-01-17 10:00:00',
  '2026-01-17 10:00:00'
);

-- Valuation 5: TRA-001 (Contract 3: CONT-2025-002)
-- Pricing: PEN 420/hour
-- January reports: 2 reports, 21.5 hours total (Jan 14-16)
-- Calculation: 21.5 hours × PEN 420 = PEN 9,030
-- Fuel: 113 liters × PEN 15 = PEN 1,695
-- Total: PEN 10,725
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-001'),
  3, 1, '2026-01', '2026-01-14', '2026-01-16', 2, 21.50, 113.00,
  9030.00, 1695.00, 0.00, 10725.00, 'VAL-2026-01-002', 3.75,
  0.00, 0.00, 18.00, 1930.50, 12655.50, 'APROBADO',
  'Valorización parcial enero 2026 - Tractor D8T',
  1, '2026-01-17 10:15:00', '2026-01-17 10:15:00'
);

-- Valuation 6: EXC-002 (Contract 5: CONT-2025-004)
-- Pricing: PEN 280/hour
-- January reports: 4 reports, 38.5 hours total (Jan 3-17)
-- Calculation: 38.5 hours × PEN 280 = PEN 10,780
-- Fuel: 191 liters × PEN 15 = PEN 2,865
-- Total: PEN 13,645
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'),
  5, 1, '2026-01', '2026-01-03', '2026-01-17', 4, 38.50, 191.00,
  10780.00, 2865.00, 0.00, 13645.00, 'VAL-2026-01-003', 3.75,
  0.00, 0.00, 18.00, 2456.10, 16101.10, 'APROBADO',
  'Valorización enero 2026 - Excavadora CAT 336',
  1, '2026-01-17 10:30:00', '2026-01-17 10:30:00'
);

-- Valuation 7: EXC-003 (Contract 6: CONT-2025-005)
-- Pricing: PEN 220/hour
-- January reports: 3 reports, 30.5 hours total (Jan 2-12)
-- Calculation: 30.5 hours × PEN 220 = PEN 6,710
-- Fuel: 148.5 liters × PEN 15 = PEN 2,227.50
-- Total: PEN 8,937.50
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'),
  6, 1, '2026-01', '2026-01-02', '2026-01-12', 3, 30.50, 148.50,
  6710.00, 2227.50, 0.00, 8937.50, 'VAL-2026-01-004', 3.75,
  0.00, 0.00, 18.00, 1608.75, 10546.25, 'APROBADO',
  'Valorización enero 2026 - Excavadora Volvo EC210D',
  1, '2026-01-17 10:45:00', '2026-01-17 10:45:00'
);

-- Valuation 8: EXC-006 (Contract 9: CONT-2025-007)
-- Pricing: PEN 300/hour
-- January reports: 4 reports, 37.5 hours total (Jan 5-18)
-- Calculation: 37.5 hours × PEN 300 = PEN 11,250
-- Fuel: 198 liters × PEN 15 = PEN 2,970
-- Total: PEN 14,220
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'),
  9, 2, '2026-01', '2026-01-05', '2026-01-18', 4, 37.50, 198.00,
  11250.00, 2970.00, 0.00, 14220.00, 'VAL-2026-01-005', 3.75,
  0.00, 0.00, 18.00, 2559.60, 16779.60, 'APROBADO',
  'Valorización enero 2026 - Excavadora Komatsu PC200',
  1, '2026-01-17 11:00:00', '2026-01-17 11:00:00'
);

-- Valuation 9: CAR-001 (Contract 10: CONT-2025-008)
-- Pricing: PEN 260/hour
-- January reports: 3 reports, 31.5 hours total (Jan 6-16)
-- Calculation: 31.5 hours × PEN 260 = PEN 8,190
-- Fuel: 165 liters × PEN 15 = PEN 2,475
-- Total: PEN 10,665
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'),
  10, 1, '2026-01', '2026-01-06', '2026-01-16', 3, 31.50, 165.00,
  8190.00, 2475.00, 0.00, 10665.00, 'VAL-2026-01-006', 3.75,
  0.00, 0.00, 18.00, 1919.70, 12584.70, 'PENDIENTE',
  'Valorización enero 2026 - Cargador Frontal CAT 950',
  1, '2026-01-17 11:15:00', '2026-01-17 11:15:00'
);

-- Valuation 10: CAR-003 (Contract 12: CONT-2025-010)
-- Pricing: PEN 250/hour
-- January reports: 3 reports, 31 hours total (Jan 2-15)
-- Calculation: 31 hours × PEN 250 = PEN 7,750
-- Fuel: 154 liters × PEN 15 = PEN 2,310
-- Total: PEN 10,060
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003'),
  12, 1, '2026-01', '2026-01-02', '2026-01-15', 3, 31.00, 154.00,
  7750.00, 2310.00, 0.00, 10060.00, 'VAL-2026-01-007', 3.75,
  0.00, 0.00, 18.00, 1810.80, 11870.80, 'APROBADO',
  'Valorización enero 2026 - Cargador Frontal JCB 426',
  1, '2026-01-17 11:30:00', '2026-01-17 11:30:00'
);

-- Valuation 11: TRA-002 (Contract 16: CONT-2025-013)
-- Pricing: PEN 320/hour
-- January reports: 3 reports, 31.5 hours total (Jan 6-18)
-- Calculation: 31.5 hours × PEN 320 = PEN 10,080
-- Fuel: 176 liters × PEN 15 = PEN 2,640
-- Total: PEN 12,720
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'),
  16, 2, '2026-01', '2026-01-06', '2026-01-18', 3, 31.50, 176.00,
  10080.00, 2640.00, 0.00, 12720.00, 'VAL-2026-01-008', 3.75,
  0.00, 0.00, 18.00, 2289.60, 15009.60, 'APROBADO',
  'Valorización enero 2026 - Tractor D7G',
  1, '2026-01-17 11:45:00', '2026-01-17 11:45:00'
);

-- Valuation 12: COM-001 (Contract 18: CONT-2025-015)
-- Pricing: PEN 180/hour
-- January reports: 3 reports, 29.5 hours total (Jan 4-17)
-- Calculation: 29.5 hours × PEN 180 = PEN 5,310
-- Fuel: 113 liters × PEN 15 = PEN 1,695
-- Total: PEN 7,005
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001'),
  18, 1, '2026-01', '2026-01-04', '2026-01-17', 3, 29.50, 113.00,
  5310.00, 1695.00, 0.00, 7005.00, 'VAL-2026-01-009', 3.75,
  0.00, 0.00, 18.00, 1260.90, 8265.90, 'APROBADO',
  'Valorización enero 2026 - Compactador Vibratorio',
  1, '2026-01-17 12:00:00', '2026-01-17 12:00:00'
);

-- ============================================
-- SECTION 2: MONTHLY FLAT RATE CONTRACTS (TARIFA_FIJA_MENSUAL)
-- ============================================

-- Valuation 13: VOL-001 (Contract 4: CONT-2025-003)
-- Monthly flat rate: PEN 8,500/month (200 hours included)
-- January reports: 1 report, 8 hours total (Jan 16) - PARTIAL MONTH
-- Calculation: Prorated for partial month (8/200 hours used)
--   Base: PEN 8,500 (full month rate, no proration as contract is active)
-- Fuel: 68 liters × PEN 15 = PEN 1,020
-- Total: PEN 9,520
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-001'),
  4, 1, '2026-01', '2026-01-16', '2026-01-16', 1, 8.00, 68.00,
  8500.00, 1020.00, 0.00, 9520.00, 'VAL-2026-01-010', 3.75,
  0.00, 0.00, 18.00, 1713.60, 11233.60, 'APROBADO',
  'Valorización parcial enero 2026 - Volquete Mercedes-Benz (tarifa mensual)',
  1, '2026-01-17 12:15:00', '2026-01-17 12:15:00'
);

-- Valuation 14: EXC-004 (Contract 7: CONT-2025-006)
-- Monthly flat rate: PEN 45,000/month (200 hours included)
-- January reports: 4 reports, 37.5 hours total (Jan 4-18)
-- Calculation: PEN 45,000 (monthly rate, within included hours)
-- Fuel: 183.5 liters × PEN 15 = PEN 2,752.50
-- Total: PEN 47,752.50
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'),
  7, 1, '2026-01', '2026-01-04', '2026-01-18', 4, 37.50, 183.50,
  45000.00, 2752.50, 0.00, 47752.50, 'VAL-2026-01-011', 3.75,
  0.00, 0.00, 18.00, 8595.45, 56347.95, 'APROBADO',
  'Valorización enero 2026 - Excavadora Komatsu PC450 (tarifa mensual)',
  1, '2026-01-17 12:30:00', '2026-01-17 12:30:00'
);

-- Valuation 15: CAR-002 (Contract 11: CONT-2025-009)
-- Monthly flat rate: PEN 38,000/month (180 hours included, excess @ PEN 75/hour)
-- January reports: 3 reports, 28.5 hours total (Jan 7-18)
-- Calculation: PEN 38,000 (monthly rate, within included hours)
-- Fuel: 150 liters × PEN 15 = PEN 2,250
-- Total: PEN 40,250
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'),
  11, 2, '2026-01', '2026-01-07', '2026-01-18', 3, 28.50, 150.00,
  38000.00, 2250.00, 0.00, 40250.00, 'VAL-2026-01-012', 3.75,
  0.00, 0.00, 18.00, 7245.00, 47495.00, 'PENDIENTE',
  'Valorización enero 2026 - Cargador Frontal Komatsu WA380 (tarifa mensual)',
  1, '2026-01-17 12:45:00', '2026-01-17 12:45:00'
);

-- Valuation 16: VOL-003 (Contract 14: CONT-2025-012)
-- Monthly flat rate: PEN 32,000/month (no hours specified)
-- January reports: 3 reports, 30 hours total (Jan 5-18)
-- Calculation: PEN 32,000 (monthly rate)
-- Fuel: 218 liters × PEN 15 = PEN 3,270
-- Total: PEN 35,270
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'),
  14, 2, '2026-01', '2026-01-05', '2026-01-18', 3, 30.00, 218.00,
  32000.00, 3270.00, 0.00, 35270.00, 'VAL-2026-01-013', 3.75,
  0.00, 0.00, 18.00, 6348.60, 41618.60, 'APROBADO',
  'Valorización enero 2026 - Volquete Volvo FMX (tarifa mensual)',
  1, '2026-01-17 13:00:00', '2026-01-17 13:00:00'
);

-- Valuation 17: TRA-003 (Contract 17: CONT-2025-014)
-- Monthly flat rate: PEN 52,000/month (220 hours included)
-- January reports: 3 reports, 30.5 hours total (Jan 2-14)
-- Calculation: PEN 52,000 (monthly rate, within included hours)
-- Fuel: 178 liters × PEN 15 = PEN 2,670
-- Total: PEN 54,670
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003'),
  17, 2, '2026-01', '2026-01-02', '2026-01-14', 3, 30.50, 178.00,
  52000.00, 2670.00, 0.00, 54670.00, 'VAL-2026-01-014', 3.75,
  0.00, 0.00, 18.00, 9840.60, 64510.60, 'APROBADO',
  'Valorización enero 2026 - Tractor D9R (tarifa mensual)',
  1, '2026-01-17 13:15:00', '2026-01-17 13:15:00'
);

-- Valuation 18: MOT-001 (Contract 19: CONT-2025-016)
-- Monthly flat rate: PEN 48,000/month (200 hours included)
-- January reports: 3 reports, 31 hours total (Jan 5-18)
-- Calculation: PEN 48,000 (monthly rate, within included hours)
-- Fuel: 140 liters × PEN 15 = PEN 2,100
-- Total: PEN 50,100
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001'),
  19, 2, '2026-01', '2026-01-05', '2026-01-18', 3, 31.00, 140.00,
  48000.00, 2100.00, 0.00, 50100.00, 'VAL-2026-01-015', 3.75,
  0.00, 0.00, 18.00, 9018.00, 59118.00, 'EN_REVISION',
  'Valorización enero 2026 - Motoniveladora CAT 140K (tarifa mensual)',
  1, '2026-01-17 13:30:00', '2026-01-17 13:30:00'
);

-- ============================================
-- SECTION 3: DAILY RATE CONTRACTS (POR_DIA)
-- ============================================

-- Valuation 19: VOL-002 (Contract 13: CONT-2025-011)
-- Daily rate: PEN 1,200/day
-- January reports: 3 reports, 31.5 hours total (Jan 3-16)
-- Days worked: 3 days
-- Calculation: 3 days × PEN 1,200 = PEN 3,600
-- Fuel: 218 liters × PEN 15 = PEN 3,270
-- Total: PEN 6,870
INSERT INTO equipo.valorizacion_equipo (
  equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin,
  dias_trabajados, horas_trabajadas, combustible_consumido,
  costo_base, costo_combustible, cargos_adicionales, total_valorizado,
  numero_valorizacion, tipo_cambio, descuento_porcentaje, descuento_monto,
  igv_porcentaje, igv_monto, total_con_igv, estado, observaciones, creado_por,
  created_at, updated_at
) VALUES (
  (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'),
  13, 1, '2026-01', '2026-01-03', '2026-01-16', 3, 31.50, 218.00,
  3600.00, 3270.00, 0.00, 6870.00, 'VAL-2026-01-016', 3.75,
  0.00, 0.00, 18.00, 1236.60, 8106.60, 'PENDIENTE',
  'Valorización enero 2026 - Volquete Hino 500 (tarifa diaria)',
  1, '2026-01-17 13:45:00', '2026-01-17 13:45:00'
);

-- ============================================
-- SECTION 4: LINK DAILY REPORTS TO VALUATIONS
-- ============================================

-- Link January 2026 daily reports to their respective valuations
-- This establishes the relationship between partes diarios and valorizaciones

-- EXC-001 daily reports → Valuation 4
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-001')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-001')
  AND fecha BETWEEN '2026-01-14' AND '2026-01-16';

-- TRA-001 daily reports → Valuation 5
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-002')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-001')
  AND fecha BETWEEN '2026-01-14' AND '2026-01-16';

-- EXC-002 daily reports → Valuation 6
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-003')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002')
  AND fecha BETWEEN '2026-01-03' AND '2026-01-17';

-- EXC-003 daily reports → Valuation 7
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-004')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003')
  AND fecha BETWEEN '2026-01-02' AND '2026-01-12';

-- EXC-006 daily reports → Valuation 8
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-005')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006')
  AND fecha BETWEEN '2026-01-05' AND '2026-01-18';

-- CAR-001 daily reports → Valuation 9
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-006')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001')
  AND fecha BETWEEN '2026-01-06' AND '2026-01-16';

-- CAR-003 daily reports → Valuation 10
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-007')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003')
  AND fecha BETWEEN '2026-01-02' AND '2026-01-15';

-- TRA-002 daily reports → Valuation 11
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-008')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002')
  AND fecha BETWEEN '2026-01-06' AND '2026-01-18';

-- COM-001 daily reports → Valuation 12
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-009')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001')
  AND fecha BETWEEN '2026-01-04' AND '2026-01-17';

-- VOL-001 daily reports → Valuation 13
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-010')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-001')
  AND fecha = '2026-01-16';

-- EXC-004 daily reports → Valuation 14
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-011')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004')
  AND fecha BETWEEN '2026-01-04' AND '2026-01-18';

-- CAR-002 daily reports → Valuation 15
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-012')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002')
  AND fecha BETWEEN '2026-01-07' AND '2026-01-18';

-- VOL-003 daily reports → Valuation 16
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-013')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003')
  AND fecha BETWEEN '2026-01-05' AND '2026-01-18';

-- TRA-003 daily reports → Valuation 17
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-014')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003')
  AND fecha BETWEEN '2026-01-02' AND '2026-01-14';

-- MOT-001 daily reports → Valuation 18
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-015')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001')
  AND fecha BETWEEN '2026-01-05' AND '2026-01-18';

-- VOL-002 daily reports → Valuation 19
UPDATE equipo.parte_diario 
SET valorizacion_id = (SELECT id FROM equipo.valorizacion_equipo WHERE numero_valorizacion = 'VAL-2026-01-016')
WHERE equipo_id = (SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002')
  AND fecha BETWEEN '2026-01-03' AND '2026-01-16';

-- ============================================
-- VERIFICATION QUERIES (commented out - run manually to verify)
-- ============================================

-- -- Count total valuations
-- SELECT COUNT(*) as total_valuations FROM equipo.valorizacion_equipo;
-- -- Expected: 19 (3 existing + 16 new)

-- -- Count January 2026 valuations
-- SELECT COUNT(*) as january_valuations FROM equipo.valorizacion_equipo WHERE periodo = '2026-01';
-- -- Expected: 16

-- -- Valuation summary by status
-- SELECT estado, COUNT(*) as count
-- FROM equipo.valorizacion_equipo
-- WHERE periodo = '2026-01'
-- GROUP BY estado
-- ORDER BY estado;
-- -- Expected: APROBADO: 12, PENDIENTE: 3, EN_REVISION: 1

-- -- Total valuation amounts for January 2026
-- SELECT 
--   periodo,
--   COUNT(DISTINCT equipo_id) as equipment_count,
--   SUM(horas_trabajadas) as total_hours,
--   SUM(combustible_consumido) as total_fuel,
--   SUM(costo_base) as total_base_cost,
--   SUM(costo_combustible) as total_fuel_cost,
--   SUM(total_valorizado) as total_valorized,
--   SUM(total_con_igv) as total_with_tax
-- FROM equipo.valorizacion_equipo
-- WHERE periodo = '2026-01'
-- GROUP BY periodo;
-- -- Expected: 16 equipment, ~480 hours, ~2,500 liters, ~PEN 370,000 total

-- -- Daily reports linked to valuations
-- SELECT 
--   COUNT(*) as total_reports,
--   COUNT(valorizacion_id) as linked_reports,
--   COUNT(*) - COUNT(valorizacion_id) as unlinked_reports
-- FROM equipo.parte_diario;
-- -- Expected: 79 total, 52 linked, 27 unlinked

-- -- Daily reports by valuation
-- SELECT 
--   v.numero_valorizacion,
--   v.estado,
--   COUNT(pd.id) as report_count
-- FROM equipo.valorizacion_equipo v
-- LEFT JOIN equipo.parte_diario pd ON v.id = pd.valorizacion_id
-- WHERE v.periodo = '2026-01'
-- GROUP BY v.id, v.numero_valorizacion, v.estado
-- ORDER BY v.numero_valorizacion;

-- -- Equipment with January 2026 valuations
-- SELECT 
--   e.codigo_equipo,
--   v.numero_valorizacion,
--   v.horas_trabajadas,
--   v.total_valorizado,
--   v.estado
-- FROM equipo.equipo e
-- JOIN equipo.valorizacion_equipo v ON e.id = v.equipo_id
-- WHERE v.periodo = '2026-01'
-- ORDER BY e.codigo_equipo;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================

-- -- Remove valuation links from daily reports
-- UPDATE equipo.parte_diario 
-- SET valorizacion_id = NULL 
-- WHERE valorizacion_id IN (
--   SELECT id FROM equipo.valorizacion_equipo WHERE periodo = '2026-01'
-- );

-- -- Delete January 2026 valuations
-- DELETE FROM equipo.valorizacion_equipo WHERE periodo = '2026-01';

-- ============================================
-- END OF MIGRATION 007
-- ============================================
