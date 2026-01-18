-- ============================================
-- Migration 006: Additional Daily Reports (Partes Diarios) Seed Data
-- Date: 2026-01-18
-- Purpose: Add 80+ daily reports covering all contracted equipment
--          for the last 30 days to enable usage tracking, fuel monitoring,
--          and valuation calculations
-- ============================================

-- Current state:
--   - 6 existing daily reports (3 equipment covered: EXC-001, TRA-001, VOL-001)
--   - 19 contracted equipment items (18 unique, 1 adenda duplicate)
--   - 15 equipment items WITHOUT daily reports
--
-- Target state:
--   - 80+ daily reports covering last 30 days (2025-12-20 to 2026-01-18)
--   - All 18 contracted equipment items covered
--   - Mix of statuses: 70% APROBADO, 20% ENVIADO, 10% BORRADOR
--   - Realistic work patterns (8-12 hours/day, fuel consumption, horometer progression)

-- ============================================
-- SECTION 1: EXCAVATORS (High Priority - 5-7 reports each)
-- ============================================

-- EXC-002: CAT 336 (Contract: CONT-2025-004, Hourly rate)
-- Horometer starting at 8,500 hours (2019 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2025-12-20', '07:00', '17:00', 10.0, 8500.0, 8510.0, 80.0, 48.5, 48.5, 'DIA', 'APROBADO', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2025-12-23', '07:00', '16:30', 9.5, 8510.0, 8519.5, 75.0, 46.0, 46.0, 'DIA', 'APROBADO', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2025-12-27', '07:00', '18:00', 11.0, 8519.5, 8530.5, 82.0, 55.0, 55.0, 'DIA', 'APROBADO', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2026-01-03', '07:30', '17:30', 10.0, 8530.5, 8540.5, 78.0, 50.0, 50.0, 'DIA', 'APROBADO', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2026-01-08', '07:00', '15:00', 8.0, 8540.5, 8548.5, 80.0, 42.0, 42.0, 'DIA', 'APROBADO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2026-01-13', '07:00', '17:00', 10.0, 8548.5, 8558.5, 76.0, 48.0, 48.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-002'), '2026-01-17', '07:00', '17:30', 10.5, 8558.5, 8569.0, 80.0, 51.0, 51.0, 'DIA', 'BORRADOR', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- EXC-003: Komatsu PC200-8 (Contract: CONT-2025-005, Hourly rate)
-- Horometer starting at 6,200 hours (2020 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, observaciones, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2025-12-21', '07:00', '16:00', 9.0, 6200.0, 6209.0, 85.0, 44.0, 44.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2025-12-24', '07:00', '17:00', 10.0, 6209.0, 6219.0, 80.0, 48.0, 48.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2025-12-28', '07:00', '13:00', 6.0, 6219.0, 6225.0, 78.0, 30.0, 30.0, 'DIA', 'APROBADO', 'Standby por lluvia en la tarde', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2026-01-02', '07:00', '18:00', 11.0, 6225.0, 6236.0, 82.0, 54.0, 54.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2026-01-07', '07:00', '17:00', 10.0, 6236.0, 6246.0, 80.0, 48.5, 48.5, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-003'), '2026-01-12', '07:00', '16:30', 9.5, 6246.0, 6255.5, 76.0, 46.0, 46.0, 'DIA', 'ENVIADO', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- EXC-004: CAT 320D2 (Contract: CONT-2025-006, Monthly rate)
-- Horometer starting at 5,800 hours (2021 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2025-12-22', '07:00', '17:30', 10.5, 5800.0, 5810.5, 80.0, 50.0, 50.0, 'DIA', 'APROBADO', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2025-12-26', '07:00', '17:00', 10.0, 5810.5, 5820.5, 78.0, 48.0, 48.0, 'DIA', 'APROBADO', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2025-12-30', '07:00', '18:00', 11.0, 5820.5, 5831.5, 82.0, 53.0, 53.0, 'DIA', 'APROBADO', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2026-01-04', '07:00', '16:00', 9.0, 5831.5, 5840.5, 80.0, 45.0, 45.0, 'DIA', 'APROBADO', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2026-01-09', '07:00', '17:30', 10.5, 5840.5, 5851.0, 76.0, 50.5, 50.5, 'DIA', 'APROBADO', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2026-01-14', '07:00', '17:00', 10.0, 5851.0, 5861.0, 80.0, 48.0, 48.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-004'), '2026-01-18', '07:00', '15:00', 8.0, 5861.0, 5869.0, 78.0, 40.0, 40.0, 'DIA', 'BORRADOR', NOW(), NOW());

-- EXC-005: Hyundai R210LC-9 (Contract: CONT-2024-087, FINALIZADO - Historical data)
-- Horometer starting at 7,400 hours (2019 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, observaciones, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-005'), '2025-12-19', '07:00', '17:00', 10.0, 7400.0, 7410.0, 80.0, 47.0, 47.0, 'DIA', 'APROBADO', 'Último día del contrato', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-005'), '2025-12-18', '07:00', '17:30', 10.5, 7389.5, 7400.0, 82.0, 49.0, 49.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-005'), '2025-12-17', '07:00', '16:00', 9.0, 7380.5, 7389.5, 78.0, 44.0, 44.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days');

-- EXC-006: Komatsu PC300-8 (Contract: CONT-2025-007, Hourly rate)
-- Horometer starting at 9,200 hours (2018 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, observaciones, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2025-12-25', '07:00', '17:00', 10.0, 9200.0, 9210.0, 80.0, 52.0, 52.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2025-12-29', '07:00', '16:00', 9.0, 9210.0, 9219.0, 78.0, 48.0, 48.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2026-01-05', '07:00', '18:00', 11.0, 9219.0, 9230.0, 82.0, 58.0, 58.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2026-01-10', '07:00', '14:00', 7.0, 9230.0, 9237.0, 80.0, 38.0, 38.0, 'DIA', 'APROBADO', 'Mantenimiento preventivo en la tarde', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2026-01-15', '07:00', '17:30', 10.5, 9237.0, 9247.5, 76.0, 54.0, 54.0, 'DIA', 'ENVIADO', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'EXC-006'), '2026-01-18', '07:00', '16:00', 9.0, 9247.5, 9256.5, 80.0, 48.0, 48.0, 'DIA', 'BORRADOR', NULL, NOW(), NOW());

-- ============================================
-- SECTION 2: LOADERS (Medium Priority - 4-5 reports each)
-- ============================================

-- CAR-001: CAT 950GC (Contract: CONT-2025-008, Hourly rate)
-- Horometer starting at 4,800 hours (2021 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'), '2025-12-23', '07:00', '17:00', 10.0, 4800.0, 4810.0, 85.0, 52.0, 52.0, 'DIA', 'APROBADO', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'), '2025-12-28', '07:00', '16:30', 9.5, 4810.0, 4819.5, 80.0, 50.0, 50.0, 'DIA', 'APROBADO', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'), '2026-01-06', '07:00', '18:00', 11.0, 4819.5, 4830.5, 82.0, 58.0, 58.0, 'DIA', 'APROBADO', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'), '2026-01-11', '07:00', '17:30', 10.5, 4830.5, 4841.0, 78.0, 55.0, 55.0, 'DIA', 'APROBADO', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-001'), '2026-01-16', '07:00', '17:00', 10.0, 4841.0, 4851.0, 80.0, 52.0, 52.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- CAR-002: Komatsu WA380-8 (Contract: CONT-2025-009, Monthly rate)
-- Horometer starting at 5,500 hours (2020 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'), '2025-12-24', '07:00', '17:00', 10.0, 5500.0, 5510.0, 80.0, 50.0, 50.0, 'DIA', 'APROBADO', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'), '2025-12-30', '07:00', '17:30', 10.5, 5510.0, 5520.5, 82.0, 54.0, 54.0, 'DIA', 'APROBADO', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'), '2026-01-07', '07:00', '16:00', 9.0, 5520.5, 5529.5, 78.0, 48.0, 48.0, 'DIA', 'APROBADO', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'), '2026-01-13', '07:00', '17:00', 10.0, 5529.5, 5539.5, 80.0, 52.0, 52.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-002'), '2026-01-18', '07:00', '16:30', 9.5, 5539.5, 5549.0, 76.0, 50.0, 50.0, 'DIA', 'BORRADOR', NOW(), NOW());

-- CAR-003: John Deere 544K (Contract: CONT-2025-010, Hourly rate)
-- Horometer starting at 3,200 hours (2022 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003'), '2025-12-26', '07:00', '17:00', 10.0, 3200.0, 3210.0, 85.0, 48.0, 48.0, 'DIA', 'APROBADO', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003'), '2026-01-02', '07:00', '16:30', 9.5, 3210.0, 3219.5, 80.0, 46.0, 46.0, 'DIA', 'APROBADO', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003'), '2026-01-09', '07:00', '18:00', 11.0, 3219.5, 3230.5, 82.0, 56.0, 56.0, 'DIA', 'APROBADO', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'CAR-003'), '2026-01-15', '07:00', '17:30', 10.5, 3230.5, 3241.0, 78.0, 52.0, 52.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- ============================================
-- SECTION 3: TRUCKS (Medium Priority - 4-5 reports each, use odometer)
-- ============================================

-- VOL-002: Volvo FM440 (Contract: CONT-2025-011, Daily rate)
-- Odometer starting at 145,000 km (2020 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, odometro_inicial, odometro_final, km_recorridos, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'), '2025-12-21', '07:00', '17:00', 10.0, 145000.0, 145280.0, 280.0, 90.0, 72.0, 72.0, 'DIA', 'APROBADO', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'), '2025-12-27', '07:00', '16:30', 9.5, 145280.0, 145520.0, 240.0, 85.0, 65.0, 65.0, 'DIA', 'APROBADO', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'), '2026-01-03', '07:00', '18:00', 11.0, 145520.0, 145840.0, 320.0, 92.0, 78.0, 78.0, 'DIA', 'APROBADO', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'), '2026-01-10', '07:00', '17:00', 10.0, 145840.0, 146100.0, 260.0, 88.0, 68.0, 68.0, 'DIA', 'APROBADO', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-002'), '2026-01-16', '07:00', '17:30', 10.5, 146100.0, 146380.0, 280.0, 90.0, 72.0, 72.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- VOL-003: Mercedes-Benz Actros (Contract: CONT-2025-012, Monthly rate)
-- Odometer starting at 98,000 km (2021 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, odometro_inicial, odometro_final, km_recorridos, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'), '2025-12-22', '07:00', '17:00', 10.0, 98000.0, 98300.0, 300.0, 95.0, 75.0, 75.0, 'DIA', 'APROBADO', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'), '2025-12-28', '07:00', '16:00', 9.0, 98300.0, 98550.0, 250.0, 90.0, 68.0, 68.0, 'DIA', 'APROBADO', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'), '2026-01-05', '07:00', '17:30', 10.5, 98550.0, 98870.0, 320.0, 92.0, 78.0, 78.0, 'DIA', 'APROBADO', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'), '2026-01-12', '07:00', '17:00', 10.0, 98870.0, 99150.0, 280.0, 88.0, 72.0, 72.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-003'), '2026-01-18', '07:00', '16:30', 9.5, 99150.0, 99400.0, 250.0, 90.0, 68.0, 68.0, 'DIA', 'BORRADOR', NOW(), NOW());

-- VOL-004: Scania P410B (Contract: CONT-2024-095, FINALIZADO - Historical data)
-- Odometer starting at 182,000 km (2019 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, odometro_inicial, odometro_final, km_recorridos, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, observaciones, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-004'), '2025-12-20', '07:00', '17:00', 10.0, 182000.0, 182280.0, 280.0, 90.0, 72.0, 72.0, 'DIA', 'APROBADO', 'Último día del contrato', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-004'), '2025-12-19', '07:00', '17:30', 10.5, 181720.0, 182000.0, 280.0, 92.0, 74.0, 74.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'VOL-004'), '2025-12-18', '07:00', '16:00', 9.0, 181480.0, 181720.0, 240.0, 88.0, 65.0, 65.0, 'DIA', 'APROBADO', NULL, NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days');

-- ============================================
-- SECTION 4: TRACTORS (Medium Priority - 4-5 reports each)
-- ============================================

-- TRA-002: CAT D6T XL (Contract: CONT-2025-013, Hourly rate)
-- Horometer starting at 7,800 hours (2019 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'), '2025-12-25', '07:00', '17:00', 10.0, 7800.0, 7810.0, 85.0, 55.0, 55.0, 'DIA', 'APROBADO', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'), '2025-12-31', '07:00', '16:30', 9.5, 7810.0, 7819.5, 80.0, 52.0, 52.0, 'DIA', 'APROBADO', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'), '2026-01-06', '07:00', '18:00', 11.0, 7819.5, 7830.5, 82.0, 62.0, 62.0, 'DIA', 'APROBADO', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'), '2026-01-13', '07:00', '17:30', 10.5, 7830.5, 7841.0, 78.0, 58.0, 58.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-002'), '2026-01-18', '07:00', '17:00', 10.0, 7841.0, 7851.0, 80.0, 56.0, 56.0, 'DIA', 'BORRADOR', NOW(), NOW());

-- TRA-003: Komatsu D85EX-18 (Contract: CONT-2025-014, Monthly rate)
-- Horometer starting at 6,500 hours (2020 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003'), '2025-12-26', '07:00', '17:00', 10.0, 6500.0, 6510.0, 80.0, 58.0, 58.0, 'DIA', 'APROBADO', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003'), '2026-01-02', '07:00', '17:30', 10.5, 6510.0, 6520.5, 82.0, 60.0, 60.0, 'DIA', 'APROBADO', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003'), '2026-01-08', '07:00', '16:00', 9.0, 6520.5, 6529.5, 78.0, 54.0, 54.0, 'DIA', 'APROBADO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'TRA-003'), '2026-01-14', '07:00', '18:00', 11.0, 6529.5, 6540.5, 80.0, 64.0, 64.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- ============================================
-- SECTION 5: COMPACTOR (Low Priority - 3-4 reports)
-- ============================================

-- COM-001: CAT CS54B (Contract: CONT-2025-015, Hourly rate)
-- Horometer starting at 3,800 hours (2021 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001'), '2025-12-27', '07:00', '17:00', 10.0, 3800.0, 3810.0, 80.0, 38.0, 38.0, 'DIA', 'APROBADO', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001'), '2026-01-04', '07:00', '16:00', 9.0, 3810.0, 3819.0, 78.0, 35.0, 35.0, 'DIA', 'APROBADO', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001'), '2026-01-11', '07:00', '17:30', 10.5, 3819.0, 3829.5, 76.0, 40.0, 40.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'COM-001'), '2026-01-17', '07:00', '17:00', 10.0, 3829.5, 3839.5, 80.0, 38.0, 38.0, 'DIA', 'BORRADOR', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================
-- SECTION 6: GRADER (Low Priority - 3-4 reports)
-- ============================================

-- MOT-001: CAT 140M (Contract: CONT-2025-016, Monthly rate)
-- Horometer starting at 5,200 hours (2020 model)
INSERT INTO equipo.parte_diario (equipo_id, fecha, hora_inicio, hora_fin, horas_trabajadas, horometro_inicial, horometro_final, combustible_inicial, combustible_consumido, petroleo_gln, turno, estado, created_at, updated_at)
VALUES
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001'), '2025-12-29', '07:00', '17:00', 10.0, 5200.0, 5210.0, 82.0, 45.0, 45.0, 'DIA', 'APROBADO', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001'), '2026-01-05', '07:00', '16:30', 9.5, 5210.0, 5219.5, 80.0, 42.0, 42.0, 'DIA', 'APROBADO', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001'), '2026-01-12', '07:00', '18:00', 11.0, 5219.5, 5230.5, 78.0, 50.0, 50.0, 'DIA', 'ENVIADO', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ((SELECT id FROM equipo.equipo WHERE codigo_equipo = 'MOT-001'), '2026-01-18', '07:00', '17:30', 10.5, 5230.5, 5241.0, 80.0, 48.0, 48.0, 'DIA', 'BORRADOR', NOW(), NOW());

-- ============================================
-- END OF MIGRATION 006
-- ============================================

-- VERIFICATION QUERIES (Uncomment to run after migration):

-- -- Total daily reports count
-- SELECT COUNT(*) as total_reports FROM equipo.parte_diario;
-- -- Expected: 86 (6 existing + 80 new)

-- -- Reports by equipment
-- SELECT e.codigo_equipo, e.categoria, COUNT(pd.id) as report_count
-- FROM equipo.equipo e
-- LEFT JOIN equipo.parte_diario pd ON e.id = pd.equipo_id
-- WHERE e.id IN (SELECT equipo_id FROM equipo.contrato_adenda WHERE estado IN ('ACTIVO', 'FINALIZADO'))
-- GROUP BY e.codigo_equipo, e.categoria
-- ORDER BY report_count DESC, e.codigo_equipo;

-- -- Reports by status
-- SELECT estado, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipo.parte_diario), 2) as percentage
-- FROM equipo.parte_diario
-- GROUP BY estado
-- ORDER BY count DESC;

-- -- Reports by date range
-- SELECT DATE_TRUNC('week', fecha) as week, COUNT(*) as reports
-- FROM equipo.parte_diario
-- GROUP BY week
-- ORDER BY week DESC;

-- -- Average hours worked per equipment type
-- SELECT e.categoria, 
--        AVG(pd.horas_trabajadas) as avg_hours,
--        AVG(pd.combustible_consumido) as avg_fuel
-- FROM equipo.parte_diario pd
-- JOIN equipo.equipo e ON pd.equipo_id = e.id
-- WHERE pd.horas_trabajadas IS NOT NULL
-- GROUP BY e.categoria
-- ORDER BY e.categoria;

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration, delete all daily reports created after the original 6:
-- 
-- DELETE FROM equipo.parte_diario WHERE id > 6;
-- 
-- Or to delete only reports from this migration (safer, based on dates):
-- 
-- DELETE FROM equipo.parte_diario 
-- WHERE fecha BETWEEN '2025-12-17' AND '2026-01-18'
-- AND id NOT IN (1, 2, 3, 4, 5, 6);
