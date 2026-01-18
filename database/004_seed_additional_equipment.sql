-- =====================================================
-- Migration: 004_seed_additional_equipment.sql
-- Description: Add realistic construction equipment seed data
-- Date: 2026-01-18
-- Author: BitCorp ERP Development Team
-- =====================================================
-- This migration adds 20 equipment items across different categories
-- representing a typical Peruvian construction company fleet:
--   - Excavators (5)
--   - Loaders (3)
--   - Trucks/Volquetes (4)
--   - Tractors (3)
--   - Compactors (2)
--   - Graders (2)
--   - Crane (1)
--
-- Equipment is assigned to major providers:
--   - FERREYROS (Caterpillar dealer) - CAT equipment
--   - UNIMAQ (Komatsu dealer) - Komatsu equipment
--   - DERCO PERÚ - Volvo equipment
--   - MAQUINARIAS U&C - Mixed brands
-- =====================================================

-- =====================================================
-- SECTION 1: EXCAVADORAS (Excavators)
-- =====================================================

-- CAT 336 - Large excavator (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'EXC-002',
    3, -- FERREYROS
    'equipment',
    'EXCAVADORA',
    NULL,
    'Caterpillar',
    '336',
    'CAT0336EAQM12345',
    'CAT0336ENG98765',
    2019,
    268.00, -- HP
    'Diesel C9.3',
    'horometro',
    'disponible',
    true
);

-- Komatsu PC200 - Medium excavator (UNIMAQ)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'EXC-003',
    4, -- UNIMAQ
    'equipment',
    'EXCAVADORA',
    NULL,
    'Komatsu',
    'PC200-8',
    'KMTPC20045678',
    'KMTPC200ENG34567',
    2020,
    148.00, -- HP
    'Diesel SAA4D107E-1',
    'horometro',
    'disponible',
    true
);

-- CAT 320 - Medium excavator (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'EXC-004',
    3, -- FERREYROS
    'equipment',
    'EXCAVADORA',
    NULL,
    'Caterpillar',
    '320D2',
    'CAT0320DWXH56789',
    'CAT0320ENG11223',
    2021,
    158.00, -- HP
    'Diesel C4.4',
    'horometro',
    'disponible',
    true
);

-- Hyundai R210 - Medium excavator (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'EXC-005',
    5, -- MAQUINARIAS U&C
    'equipment',
    'EXCAVADORA',
    NULL,
    'Hyundai',
    'R210LC-9',
    'HYUR210LC12345',
    'HYUR210ENG67890',
    2018,
    161.00, -- HP
    'Diesel Cummins QSB6.7',
    'horometro',
    'disponible',
    true
);

-- Komatsu PC300 - Large excavator (UNIMAQ)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'EXC-006',
    4, -- UNIMAQ
    'equipment',
    'EXCAVADORA',
    NULL,
    'Komatsu',
    'PC300-8',
    'KMTPC30098765',
    'KMTPC300ENG44556',
    2019,
    215.00, -- HP
    'Diesel SAA6D114E-3',
    'horometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 2: CARGADORES FRONTALES (Loaders)
-- =====================================================

-- CAT 950 - Wheel loader (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'CAR-001',
    3, -- FERREYROS
    'equipment',
    'CARGADOR_FRONTAL',
    NULL,
    'Caterpillar',
    '950GC',
    'CAT0950GCAA11223',
    'CAT0950ENG77889',
    2020,
    189.00, -- HP
    'Diesel C7.1',
    'horometro',
    'disponible',
    true
);

-- Komatsu WA380 - Wheel loader (UNIMAQ)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'CAR-002',
    4, -- UNIMAQ
    'equipment',
    'CARGADOR_FRONTAL',
    NULL,
    'Komatsu',
    'WA380-8',
    'KMTWA38033445',
    'KMTWA380ENG55667',
    2021,
    196.00, -- HP
    'Diesel SAA4D107E-3',
    'horometro',
    'disponible',
    true
);

-- John Deere 544 - Wheel loader (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'CAR-003',
    5, -- MAQUINARIAS U&C
    'equipment',
    'CARGADOR_FRONTAL',
    NULL,
    'John Deere',
    '544K',
    'JD544K998877',
    'JD544KENG223344',
    2019,
    164.00, -- HP
    'Diesel PowerTech 6.8L',
    'horometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 3: VOLQUETES (Dump Trucks)
-- =====================================================

-- Volvo FM440 - Heavy dump truck (DERCO)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_chasis,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'VOL-002',
    6, -- DERCO
    'equipment',
    'VOLQUETE',
    'AYU-823',
    'Volvo',
    'FM440',
    'VOLVOFM44012345',
    'VOLVOCH44098765',
    'VOLVOENG440ABC123',
    2020,
    440.00, -- HP
    'Diesel D13K 440',
    'odometro',
    'disponible',
    true
);

-- Mercedes-Benz Actros 4144 (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_chasis,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'VOL-003',
    5, -- MAQUINARIAS U&C
    'equipment',
    'VOLQUETE',
    'BRT-941',
    'Mercedes-Benz',
    'Actros 4144K',
    'MB414456789',
    'MBCH4144AABC123',
    'MBENG4144XYZ789',
    2019,
    435.00, -- HP
    'Diesel OM 502 LA',
    'odometro',
    'disponible',
    true
);

-- Scania P410 (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_chasis,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'VOL-004',
    5, -- MAQUINARIAS U&C
    'equipment',
    'VOLQUETE',
    'CWM-752',
    'Scania',
    'P410B8x4',
    'SCANP41078901',
    'SCANCH410JKL456',
    'SCANENG410MNO789',
    2021,
    410.00, -- HP
    'Diesel DC13 163',
    'odometro',
    'disponible',
    true
);

-- Volvo FMX500 (DERCO)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_chasis,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'VOL-005',
    6, -- DERCO
    'equipment',
    'VOLQUETE',
    'DLT-368',
    'Volvo',
    'FMX500',
    'VOLVOFMX50034567',
    'VOLVOCH500QRS123',
    'VOLVOENG500TUV456',
    2022,
    500.00, -- HP
    'Diesel D13K 500',
    'odometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 4: TRACTORES (Bulldozers)
-- =====================================================

-- CAT D6T - Medium bulldozer (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'TRA-002',
    3, -- FERREYROS
    'equipment',
    'TRACTOR',
    NULL,
    'Caterpillar',
    'D6T XL',
    'CATD6TXL88990',
    'CATD6TENG11223',
    2020,
    215.00, -- HP
    'Diesel C9',
    'horometro',
    'disponible',
    true
);

-- Komatsu D85 - Medium bulldozer (UNIMAQ)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'TRA-003',
    4, -- UNIMAQ
    'equipment',
    'TRACTOR',
    NULL,
    'Komatsu',
    'D85EX-18',
    'KMTD85EX44556',
    'KMTD85ENG77889',
    2021,
    264.00, -- HP
    'Diesel SAA6D114E-6',
    'horometro',
    'disponible',
    true
);

-- CAT D8T - Large bulldozer (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'TRA-004',
    3, -- FERREYROS
    'equipment',
    'TRACTOR',
    NULL,
    'Caterpillar',
    'D8T',
    'CATD8T556677',
    'CATD8TENG998877',
    2019,
    310.00, -- HP
    'Diesel C15',
    'horometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 5: COMPACTADORES (Compactors)
-- =====================================================

-- CAT CS54B - Vibratory compactor (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'COM-001',
    3, -- FERREYROS
    'equipment',
    'COMPACTADOR',
    NULL,
    'Caterpillar',
    'CS54B',
    'CATCS54B223344',
    'CATCS54BENG556677',
    2020,
    130.00, -- HP
    'Diesel C4.4',
    'horometro',
    'disponible',
    true
);

-- Dynapac CA2500D - Compactor (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'COM-002',
    5, -- MAQUINARIAS U&C
    'equipment',
    'COMPACTADOR',
    NULL,
    'Dynapac',
    'CA2500D',
    'DYNCA2500D88990',
    'DYNCA2500ENG112233',
    2019,
    99.00, -- HP
    'Diesel Cummins B4.5',
    'horometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 6: MOTONIVELADORAS (Motor Graders)
-- =====================================================

-- CAT 140M - Motor grader (FERREYROS)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'MOT-001',
    3, -- FERREYROS
    'equipment',
    'MOTONIVELADORA',
    NULL,
    'Caterpillar',
    '140M',
    'CAT140M445566',
    'CAT140MENG778899',
    2020,
    190.00, -- HP
    'Diesel C9',
    'horometro',
    'disponible',
    true
);

-- Komatsu GD655 - Motor grader (UNIMAQ)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'MOT-002',
    4, -- UNIMAQ
    'equipment',
    'MOTONIVELADORA',
    NULL,
    'Komatsu',
    'GD655-6',
    'KMTGD65599887',
    'KMTGD655ENG334455',
    2021,
    197.00, -- HP
    'Diesel SAA6D114E-5',
    'horometro',
    'disponible',
    true
);

-- =====================================================
-- SECTION 7: GRÚA (Crane)
-- =====================================================

-- Liebherr LTM 1100 - Mobile crane (MAQUINARIAS U&C)
INSERT INTO equipo.equipo (
    codigo_equipo,
    proveedor_id,
    tipo_proveedor,
    categoria,
    placa,
    marca,
    modelo,
    numero_serie_equipo,
    numero_chasis,
    numero_serie_motor,
    anio_fabricacion,
    potencia_neta,
    tipo_motor,
    medidor_uso,
    estado,
    is_active
) VALUES (
    'GRU-001',
    5, -- MAQUINARIAS U&C
    'equipment',
    'GRUA',
    'FRM-489',
    'Liebherr',
    'LTM 1100-5.2',
    'LIEBLTM1100667788',
    'LIEBCH1100AABB11',
    'LIEBENG1100CCDD22',
    2018,
    536.00, -- HP
    'Diesel Liebherr D946',
    'odometro',
    'disponible',
    true
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries after migration to verify data:

-- Count equipment by category
-- SELECT categoria, COUNT(*) as total
-- FROM equipo.equipo
-- WHERE is_active = true
-- GROUP BY categoria
-- ORDER BY categoria;

-- List all equipment with provider names
-- SELECT 
--     e.codigo_equipo,
--     e.categoria,
--     e.marca,
--     e.modelo,
--     e.anio_fabricacion,
--     p.razon_social as proveedor,
--     e.estado
-- FROM equipo.equipo e
-- LEFT JOIN proveedores.proveedor p ON e.proveedor_id = p.id
-- WHERE e.is_active = true
-- ORDER BY e.categoria, e.codigo_equipo;

-- Count equipment by provider
-- SELECT 
--     p.razon_social,
--     COUNT(*) as total_equipos
-- FROM equipo.equipo e
-- INNER JOIN proveedores.proveedor p ON e.proveedor_id = p.id
-- WHERE e.is_active = true
-- GROUP BY p.razon_social
-- ORDER BY total_equipos DESC;

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration, run:
-- DELETE FROM equipo.equipo 
-- WHERE codigo_equipo IN (
--     'EXC-002', 'EXC-003', 'EXC-004', 'EXC-005', 'EXC-006',
--     'CAR-001', 'CAR-002', 'CAR-003',
--     'VOL-002', 'VOL-003', 'VOL-004', 'VOL-005',
--     'TRA-002', 'TRA-003', 'TRA-004',
--     'COM-001', 'COM-002',
--     'MOT-001', 'MOT-002',
--     'GRU-001'
-- );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
