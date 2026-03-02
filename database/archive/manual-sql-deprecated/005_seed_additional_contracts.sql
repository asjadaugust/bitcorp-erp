-- =====================================================
-- Migration: 005_seed_additional_contracts.sql
-- Description: Add comprehensive contract seed data for equipment
-- Date: 2026-01-18
-- Author: BitCorp ERP Development Team
-- =====================================================
-- This migration adds 15 contracts for the equipment fleet
-- covering different scenarios:
--   - Different pricing models (POR_HORA, TARIFA_FIJA_MENSUAL, POR_DIA)
--   - Different modalities (CON OPERADOR, SIN OPERADOR, CON COMBUSTIBLE)
--   - Various durations (short-term, long-term)
--   - Mix of estados (ACTIVO, FINALIZADO, EN_REVISION)
--
-- Contract Distribution:
--   - Excavators: 5 contracts
--   - Loaders: 3 contracts
--   - Trucks: 3 contracts
--   - Tractors: 2 contracts
--   - Compactor: 1 contract
--   - Grader: 1 contract
-- =====================================================

-- =====================================================
-- SECTION 1: EXCAVATOR CONTRACTS (5 contracts)
-- =====================================================

-- Contract 1: CAT 336 Excavator - Long-term with operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    estado,
    creado_por
) VALUES (
    5, -- EXC-002 (CAT 336)
    'CONT-2025-004',
    'CONTRATO',
    '2025-01-10',
    '2025-02-01',
    '2025-12-31',
    'PEN',
    'HORA',
    280.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    NULL,
    'VIGENTE',
    1
);

-- Contract 2: Komatsu PC200-8 - Short-term without operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    estado,
    creado_por
) VALUES (
    6, -- EXC-003 (Komatsu PC200-8)
    'CONT-2025-005',
    'CONTRATO',
    '2025-02-15',
    '2025-03-01',
    '2025-08-31',
    'PEN',
    'HORA',
    220.00,
    'MAQUINA_SECA_NO_OPERADA',
    true,
    false,
    NULL,
    'VIGENTE',
    1
);

-- Contract 3: CAT 320D2 - Monthly flat rate with operator and fuel
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    7, -- EXC-004 (CAT 320D2)
    'CONT-2025-006',
    'CONTRATO',
    '2025-01-20',
    '2025-02-15',
    '2025-07-15',
    'PEN',
    'MES',
    45000.00,
    'MAQUINA_SERVIDA_OPERADA',
    true,
    true,
    200, -- 200 hours included per month
    'Incluye mantenimiento preventivo mensual. Combustible incluido hasta 200 horas/mes.',
    'VIGENTE',
    1
);

-- Contract 4: Hyundai R210LC-9 - Finalized contract (past)
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    8, -- EXC-005 (Hyundai R210LC-9)
    'CONT-2024-087',
    'CONTRATO',
    '2024-08-01',
    '2024-09-01',
    '2024-12-31',
    'PEN',
    'HORA',
    240.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    'FINALIZADO',
    1
);

-- Contract 5: Komatsu PC300-8 - With additional operator cost
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    costo_adicional_motor,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    9, -- EXC-006 (Komatsu PC300-8)
    'CONT-2025-007',
    'CONTRATO',
    '2025-01-25',
    '2025-02-10',
    '2025-11-10',
    'PEN',
    'HORA',
    300.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    50.00, -- Additional cost per hour for fuel
    'Costo adicional de S/ 50/hora por combustible. Operador certificado incluido.',
    'VIGENTE',
    1
);

-- =====================================================
-- SECTION 2: LOADER CONTRACTS (3 contracts)
-- =====================================================

-- Contract 6: CAT 950GC - Long-term with operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    10, -- CAR-001 (CAT 950GC)
    'CONT-2025-008',
    'CONTRATO',
    '2025-01-05',
    '2025-01-20',
    '2025-12-20',
    'PEN',
    'HORA',
    260.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    'VIGENTE',
    1
);

-- Contract 7: Komatsu WA380-8 - Monthly rate without operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    penalidad_exceso,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    11, -- CAR-002 (Komatsu WA380-8)
    'CONT-2025-009',
    'CONTRATO',
    '2025-02-01',
    '2025-02-20',
    '2025-08-20',
    'PEN',
    'MES',
    38000.00,
    'MAQUINA_SECA_NO_OPERADA',
    false,
    false,
    180, -- 180 hours included per month
    75.00, -- S/ 75/hour penalty for excess hours
    'Cliente provee operador. Incluye 180 horas/mes. Exceso: S/ 75/hora.',
    'VIGENTE',
    1
);

-- Contract 8: John Deere 544K - Short-term hourly
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    12, -- CAR-003 (John Deere 544K)
    'CONT-2025-010',
    'CONTRATO',
    '2025-03-01',
    '2025-03-15',
    '2025-09-15',
    'PEN',
    'HORA',
    250.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    'VIGENTE',
    1
);

-- =====================================================
-- SECTION 3: TRUCK CONTRACTS (3 contracts)
-- =====================================================

-- Contract 9: Volvo FM440 - Daily rate with driver
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    minimo_por,
    incluye_motor,
    incluye_operador,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    13, -- VOL-002 (Volvo FM440)
    'CONT-2025-011',
    'CONTRATO',
    '2025-01-18',
    '2025-02-01',
    '2025-07-31',
    'PEN',
    'DIA',
    1200.00,
    'MAQUINA_SERVIDA_OPERADA',
    'DIA',
    true,
    true,
    'Incluye chofer y combustible. Máximo 200 km/día. Exceso: S/ 3/km.',
    'VIGENTE',
    1
);

-- Contract 10: Mercedes-Benz Actros - Monthly rate with fuel
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    14, -- VOL-003 (Mercedes-Benz Actros)
    'CONT-2025-012',
    'CONTRATO',
    '2025-02-10',
    '2025-03-01',
    '2025-12-31',
    'PEN',
    'MES',
    32000.00,
    'MAQUINA_SERVIDA_OPERADA',
    true,
    true,
    'Incluye chofer, combustible y mantenimiento preventivo. 22 días/mes.',
    'VIGENTE',
    1
);

-- Contract 11: Scania P410B - Finalized contract
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    15, -- VOL-004 (Scania P410B)
    'CONT-2024-095',
    'CONTRATO',
    '2024-09-01',
    '2024-10-01',
    '2024-12-31',
    'PEN',
    'DIA',
    1100.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    'FINALIZADO',
    1
);

-- =====================================================
-- SECTION 4: TRACTOR CONTRACTS (2 contracts)
-- =====================================================

-- Contract 12: CAT D6T XL - Hourly with operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    17, -- TRA-002 (CAT D6T XL)
    'CONT-2025-013',
    'CONTRATO',
    '2025-01-28',
    '2025-02-15',
    '2025-11-15',
    'PEN',
    'HORA',
    320.00,
    'MAQUINA_SECA_OPERADA',
    true,
    true,
    'VIGENTE',
    1
);

-- Contract 13: Komatsu D85EX-18 - Monthly flat rate
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    18, -- TRA-003 (Komatsu D85EX-18)
    'CONT-2025-014',
    'CONTRATO',
    '2025-02-05',
    '2025-02-25',
    '2025-08-25',
    'PEN',
    'MES',
    52000.00,
    'MAQUINA_SERVIDA_OPERADA',
    true,
    true,
    220, -- 220 hours included
    'Incluye operador certificado, combustible y mantenimiento preventivo. 220 horas/mes.',
    'VIGENTE',
    1
);

-- =====================================================
-- SECTION 5: COMPACTOR CONTRACT (1 contract)
-- =====================================================

-- Contract 14: CAT CS54B - Hourly without operator
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    estado,
    creado_por
) VALUES (
    20, -- COM-001 (CAT CS54B)
    'CONT-2025-015',
    'CONTRATO',
    '2025-02-12',
    '2025-03-01',
    '2025-09-30',
    'PEN',
    'HORA',
    180.00,
    'MAQUINA_SECA_NO_OPERADA',
    false,
    false,
    'VIGENTE',
    1
);

-- =====================================================
-- SECTION 6: GRADER CONTRACT (1 contract)
-- =====================================================

-- Contract 15: CAT 140M - Monthly with operator and fuel
INSERT INTO equipo.contrato_adenda (
    equipo_id,
    numero_contrato,
    tipo,
    fecha_contrato,
    fecha_inicio,
    fecha_fin,
    moneda,
    tipo_tarifa,
    tarifa,
    modalidad,
    incluye_motor,
    incluye_operador,
    horas_incluidas,
    condiciones_especiales,
    estado,
    creado_por
) VALUES (
    22, -- MOT-001 (CAT 140M)
    'CONT-2025-016',
    'CONTRATO',
    '2025-01-30',
    '2025-02-20',
    '2025-12-20',
    'PEN',
    'MES',
    48000.00,
    'MAQUINA_SERVIDA_OPERADA',
    true,
    true,
    200, -- 200 hours included
    'Incluye operador especializado, combustible y mantenimiento. 200 horas/mes.',
    'VIGENTE',
    1
);

-- =====================================================
-- VERIFICATION QUERIES (commented out - run manually)
-- =====================================================

-- Total contracts count
-- SELECT COUNT(*) as total_contracts FROM equipo.contrato_adenda;
-- Expected: 19 (4 original + 15 new)

-- Contracts by pricing model
-- SELECT tipo_tarifa, COUNT(*) as total
-- FROM equipo.contrato_adenda
-- GROUP BY tipo_tarifa
-- ORDER BY total DESC;

-- Contracts by status
-- SELECT estado, COUNT(*) as total
-- FROM equipo.contrato_adenda
-- GROUP BY estado
-- ORDER BY total DESC;

-- Equipment with contracts
-- SELECT 
--   e.codigo_equipo,
--   e.marca,
--   e.modelo,
--   COUNT(c.id) as contract_count
-- FROM equipo.equipo e
-- LEFT JOIN equipo.contrato_adenda c ON e.id = c.equipo_id
-- GROUP BY e.id, e.codigo_equipo, e.marca, e.modelo
-- ORDER BY contract_count DESC, e.codigo_equipo;

-- Active contracts with equipment details
-- SELECT 
--   c.numero_contrato,
--   e.codigo_equipo,
--   e.marca,
--   e.modelo,
--   c.tipo_tarifa,
--   c.tarifa,
--   c.modalidad,
--   c.fecha_inicio,
--   c.fecha_fin
-- FROM equipo.contrato_adenda c
-- JOIN equipo.equipo e ON c.equipo_id = e.id
-- WHERE c.estado = 'VIGENTE'
-- ORDER BY c.fecha_inicio DESC;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- To rollback this migration:
-- DELETE FROM equipo.contrato_adenda WHERE numero_contrato IN (
--   'CONT-2025-004', 'CONT-2025-005', 'CONT-2025-006', 'CONT-2025-007',
--   'CONT-2025-008', 'CONT-2025-009', 'CONT-2025-010', 'CONT-2025-011',
--   'CONT-2025-012', 'CONT-2024-095', 'CONT-2025-013', 'CONT-2025-014',
--   'CONT-2025-015', 'CONT-2025-016', 'CONT-2024-087'
-- );
