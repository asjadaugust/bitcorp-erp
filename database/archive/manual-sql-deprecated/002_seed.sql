-- ============================================================================
-- Bitcorp ERP - Comprehensive Seed Data (FULLY CORRECTED)
-- Version: 5.0 (Matches Actual Schema 100%)
-- Date: 2025-12-27
-- Description: Seed data with exact column names from database schema
-- ============================================================================

-- Clear existing data (in reverse dependency order)
TRUNCATE TABLE 
  equipo.equipo_combustible,
  equipo.valorizacion_equipo,
  equipo.parte_diario,
  equipo.contrato_adenda,
  equipo.equipo_edt,
  equipo.equipo,
  equipo.tipo_equipo,
  rrhh.detalle_tareo,
  rrhh.tareo,
  rrhh.documento_trabajador,
  rrhh.disponibilidad_trabajador,
  rrhh.trabajador,
  logistica.detalle_movimiento,
  logistica.movimiento,
  logistica.producto,
  administracion.detalle_programacion_pago,
  administracion.programacion_pago,
  administracion.cuenta_por_pagar,
  administracion.centro_costo,
  proveedores.proveedor,
  proyectos.edt,
  sistema.usuario_rol,
  sistema.rol_permiso,
  sistema.permiso,
  sistema.usuario,
  sistema.rol,
  sistema.modulo,
  sistema.unidad_operativa,
  sistema.empresa
RESTART IDENTITY CASCADE;

-- ============================================================================
-- SCHEMA: SISTEMA (System/Administration)
-- ============================================================================

-- Companies
INSERT INTO sistema.empresa (legacy_id, ruc, razon_social, nombre_comercial, direccion, telefono, correo_electronico) VALUES
('COMP001', '20123456789', 'BITCORP S.A.C.', 'Bitcorp', 'Av. Los Conquistadores 123, San Isidro, Lima', '(01) 234-5678', 'contacto@bitcorp.pe'),
('COMP002', '20987654321', 'CONSTRUCTORA ARAMAX S.A.', 'Aramax', 'Jr. Las Begonias 456, San Borja, Lima', '(01) 876-5432', 'info@aramax.pe');

-- Operating Units
INSERT INTO sistema.unidad_operativa (legacy_id, codigo, nombre, descripcion, ubicacion) VALUES
('UO001', 'UO-001', 'Unidad Lima Norte', 'Oficina Principal Lima Norte', 'Lima'),
('UO002', 'UO-002', 'Unidad Lima Sur', 'Oficina Principal Lima Sur', 'Lima'),
('UO003', 'UO-003', 'Unidad Arequipa', 'Oficina Regional Arequipa', 'Arequipa');

-- Modules
INSERT INTO sistema.modulo (legacy_id, codigo, nombre, descripcion, icono, ruta, modulo_padre_id, orden_visualizacion) VALUES
-- Level 1: SIG
('MOD_SIG', 'SIG', 'Sistema Integrado de Gestión', 'Módulo principal de gestión integrada', 'business', '/sig', NULL, 1),
('MOD_ISO9001', 'ISO9001', 'ISO 9001 - Calidad', 'Gestión de Calidad', 'verified', '/sig/iso9001', 1, 1),
('MOD_ISO14001', 'ISO14001', 'ISO 14001 - Medio Ambiente', 'Gestión Ambiental', 'eco', '/sig/iso14001', 1, 2),
('MOD_ISO45001', 'ISO45001', 'ISO 45001 - Seguridad', 'Seguridad y Salud Ocupacional', 'health_and_safety', '/sig/iso45001', 1, 3),
-- Level 2: Operational
('MOD_LIC', 'C01', 'Licitaciones', 'Gestión de Licitaciones', 'gavel', '/licitaciones', NULL, 2),
('MOD_OPE', 'OPE', 'Operaciones', 'Gestión Operacional', 'settings', '/operaciones', NULL, 3),
-- Level 3: Departmental
('MOD_SST', 'C02', 'SST', 'Seguridad y Salud en el Trabajo', 'security', '/sst', NULL, 4),
('MOD_ADM', 'C04', 'Administración', 'Gestión Administrativa', 'account_balance', '/administracion', NULL, 5),
('MOD_RRHH', 'C05', 'Recursos Humanos', 'Gestión de Personal', 'people', '/rrhh', NULL, 6),
('MOD_LOG', 'C06', 'Logística', 'Gestión Logística', 'local_shipping', '/logistica', NULL, 7),
('MOD_PROV', 'C07', 'Proveedores', 'Gestión de Proveedores', 'store', '/proveedores', NULL, 8),
('MOD_EQUIP', 'C08', 'Equipo Mecánico', 'Gestión de Equipos', 'construction', '/equipment', NULL, 9);

-- Roles
INSERT INTO sistema.rol (legacy_id, nombre, codigo, descripcion, nivel) VALUES
('ROL001', 'Director General', 'director_general', 'Acceso completo al sistema', 1),
('ROL002', 'Director de Proyecto', 'director_proyecto', 'Acceso a proyectos asignados', 2),
('ROL003', 'Jefe de Equipo', 'jefe_equipo', 'Acceso a módulos departamentales', 3),
('ROL004', 'Operador', 'operador', 'Acceso solo a app móvil', 4),
('ROL005', 'Administrador', 'administrador', 'Gestión administrativa', 3);

-- Permissions
INSERT INTO sistema.permiso (legacy_id, modulo_id, nombre, codigo, descripcion) VALUES
-- Equipment Module (module_id=12)
('PERM_EQ_READ', 12, 'Ver Equipos', 'equipment:read', 'Visualizar lista de equipos'),
('PERM_EQ_CREATE', 12, 'Crear Equipo', 'equipment:create', 'Registrar nuevos equipos'),
('PERM_EQ_UPDATE', 12, 'Editar Equipo', 'equipment:update', 'Modificar datos de equipos'),
('PERM_EQ_DELETE', 12, 'Eliminar Equipo', 'equipment:delete', 'Eliminar equipos'),
-- Provider Module
('PERM_PROV_READ', 11, 'Ver Proveedores', 'providers:read', 'Visualizar lista de proveedores'),
('PERM_PROV_CREATE', 11, 'Crear Proveedor', 'providers:create', 'Registrar nuevos proveedores'),
-- Operator Module
('PERM_OP_READ', 9, 'Ver Operadores', 'operators:read', 'Visualizar lista de operadores'),
('PERM_OP_CREATE', 9, 'Crear Operador', 'operators:create', 'Registrar nuevos operadores'),
-- Project Module
('PERM_PROJ_READ', 1, 'Ver Proyectos', 'projects:read', 'Visualizar proyectos'),
('PERM_PROJ_CREATE', 1, 'Crear Proyecto', 'projects:create', 'Crear nuevos proyectos'),
-- Admin Module
('PERM_ADMIN_FULL', 8, 'Acceso Completo Admin', 'admin:full', 'Acceso completo administración'),
('PERM_COST_READ', 8, 'Ver Costos', 'costs:read', 'Visualizar centros de costo');

-- Role Permissions
INSERT INTO sistema.rol_permiso (rol_id, permiso_id) VALUES
-- Director General: All permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12),
-- Director de Proyecto
(2, 1), (2, 5), (2, 7), (2, 9), (2, 12),
-- Jefe de Equipo
(3, 1), (3, 2), (3, 3), (3, 7), (3, 8),
-- Administrador
(5, 11), (5, 12);

-- Users (passwords all hash to 'Admin@123')
INSERT INTO sistema.usuario (legacy_id, nombre_usuario, contrasena, nombres, apellidos, correo_electronico, telefono, rol_id, unidad_operativa_id) VALUES
('USR001', 'admin', '$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6', 'Admin', 'Sistema', 'admin@bitcorp.pe', '999000111', 1, 1),
('USR002', 'director', '$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6', 'Carlos', 'Ramírez', 'cramirez@bitcorp.pe', '999000222', 2, 1),
('USR003', 'jefe_equipo', '$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6', 'Ana', 'Torres', 'atorres@bitcorp.pe', '999000333', 3, 1),
('USR004', 'operador1', '$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6', 'Juan', 'Pérez', 'jperez@bitcorp.pe', '999111222', 4, 1),
('USR005', 'admin_fin', '$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6', 'María', 'Gonzales', 'mgonzales@bitcorp.pe', '999000444', 5, 1);

-- User Roles
INSERT INTO sistema.usuario_rol (usuario_id, rol_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5);

-- ============================================================================
-- SCHEMA: PROYECTOS (Projects)
-- ============================================================================

-- Projects (CORRECTED: codigo NOT code, nombre NOT name, etc.)
INSERT INTO proyectos.edt (legacy_id, codigo, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, presupuesto, estado, empresa_id, unidad_operativa_id) VALUES
('PRJ001', 'CARRETERA-001', 'Carretera Panamericana Norte - Tramo 1', 'Rehabilitación y mejoramiento de carretera', 'Ancash', '2024-01-01', '2024-12-31', 5000000.00, 'ACTIVO', 1, 1),
('PRJ002', 'CARRETERA-002', 'Carretera Longitudinal de la Sierra - Tramo 2', 'Construcción de carretera', 'Ayacucho', '2024-03-01', '2025-02-28', 8000000.00, 'ACTIVO', 1, 1),
('PRJ003', 'MANTENIMIENTO-001', 'Mantenimiento Rutinario Lima-Callao', 'Mantenimiento periódico de vías', 'Lima', '2024-02-01', '2024-08-31', 1500000.00, 'ACTIVO', 1, 1);

-- ============================================================================
-- SCHEMA: ADMINISTRACION (Administration)
-- ============================================================================

-- Cost Centers (CORRECTED: codigo NOT code, nombre NOT name)
INSERT INTO administracion.centro_costo (legacy_id, codigo, nombre, descripcion, proyecto_id, presupuesto) VALUES
('CC001', 'CC-PRJ001-01', 'Movimiento de Tierras', 'Centro de costo para movimiento de tierras', 1, 1500000.00),
('CC002', 'CC-PRJ001-02', 'Pavimentación', 'Centro de costo para pavimentación', 1, 2000000.00),
('CC003', 'CC-PRJ002-01', 'Obras de Arte', 'Centro de costo para puentes y obras especiales', 2, 3000000.00),
('CC004', 'CC-PRJ003-01', 'Bacheo', 'Centro de costo para bacheo y reparaciones', 3, 500000.00);

-- ============================================================================
-- SCHEMA: PROVEEDORES (Providers)
-- ============================================================================

-- Providers
INSERT INTO proveedores.proveedor (legacy_id, ruc, razon_social, nombre_comercial, tipo_proveedor, direccion, telefono, correo_electronico) VALUES
('PROV001', '20111222333', 'CONSTRUCTORA MAQUINARIAS S.A.C.', 'Maquinarias SAC', 'EQUIPO_PESADO', 'Av. Industrial 123, Lima', '(01) 555-1111', 'ventas@maquinarias.pe'),
('PROV002', '20444555666', 'EQUIPOS Y SERVICIOS DEL PERÚ S.A.', 'Equipos Perú', 'EQUIPO_PESADO', 'Jr. Los Pinos 456, Lima', '(01) 555-2222', 'contacto@equiposperu.pe'),
('PROV003', '20777888999', 'ALQUILER DE MAQUINARIA HEAVY S.A.C.', 'Heavy Equipment', 'EQUIPO_PESADO', 'Av. Argentina 789, Callao', '(01) 555-3333', 'info@heavyequipment.pe'),
('PROV004', '20123987456', 'OPERADORES ESPECIALIZADOS S.R.L.', 'OpEspe', 'OPERADOR', 'Jr. Comercio 321, Lima', '(01) 555-4444', 'rrhh@opespe.pe');

-- ============================================================================
-- SCHEMA: RRHH (Human Resources)
-- ============================================================================

-- Workers/Operators (CORRECTED: removed codigo_trabajador, using actual columns)
INSERT INTO rrhh.trabajador (legacy_id, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, telefono, correo_electronico, cargo, especialidad, licencia_conducir, tipo_contrato, fecha_ingreso, unidad_operativa_id) VALUES
('OPR001', '12345678', 'Juan Carlos', 'Pérez', 'Gonzales', '1985-03-15', '987654321', 'jperez@operator.pe', 'Operador de Excavadora', 'Excavadora Hidráulica', 'A-III', 'CONTRATO', '2023-01-10', 1),
('OPR002', '23456789', 'María Elena', 'Torres', 'Ramírez', '1990-07-22', '987654322', 'mtorres@operator.pe', 'Operador de Cargador Frontal', 'Cargador Frontal', 'A-IIIb', 'CONTRATO', '2023-02-15', 1),
('OPR003', '34567890', 'Luis Alberto', 'Sánchez', 'Vargas', '1988-11-30', '987654323', 'lsanchez@operator.pe', 'Operador de Rodillo', 'Rodillo Compactador', 'A-IIc', 'CONTRATO', '2023-03-20', 1),
('OPR004', '45678901', 'Ana Patricia', 'Rojas', 'Mendoza', '1992-05-18', '987654324', 'arojas@operator.pe', 'Operador de Motoniveladora', 'Motoniveladora', 'A-IIIc', 'CONTRATO', '2023-04-25', 1),
('OPR005', '56789012', 'Carlos Enrique', 'Mendoza', 'Silva', '1987-09-08', '987654325', 'cmendoza@operator.pe', 'Operador de Volquete', 'Volquete', 'A-IIIc', 'CONTRATO', '2023-05-30', 1);

-- ============================================================================
-- SCHEMA: EQUIPO (Equipment)
-- ============================================================================

-- Equipment Types (CORRECTED: codigo NOT code, nombre NOT name)
INSERT INTO equipo.tipo_equipo (legacy_id, codigo, nombre, descripcion, categoria) VALUES
('ET001', 'EXC-HID', 'Excavadora Hidráulica', 'Excavadora sobre orugas', 'MOVIMIENTO_TIERRAS'),
('ET002', 'CARG-FRONT', 'Cargador Frontal', 'Cargador frontal sobre llantas', 'MOVIMIENTO_TIERRAS'),
('ET003', 'ROD-COMP', 'Rodillo Compactador', 'Rodillo liso vibratorio', 'COMPACTACION'),
('ET004', 'MOTONIV', 'Motoniveladora', 'Motoniveladora para nivelación', 'NIVELACION'),
('ET005', 'VOLQ', 'Volquete', 'Volquete 15m3', 'TRANSPORTE');

-- Equipment (CORRECTED: numero_serie_equipo NOT numero_serie, codigo_equipo, etc.)
INSERT INTO equipo.equipo (
  legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id, tipo_proveedor, categoria,
  placa, marca, modelo, numero_serie_equipo, anio_fabricacion, tipo_motor, medidor_uso, estado
) VALUES
('EQ001', 'EXC-001', 1, 1, 'ALQUILADO', 'MOVIMIENTO_TIERRAS', 'ABC-123', 'Caterpillar', '320D', 'CAT320D12345', 2020, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ002', 'EXC-002', 1, 1, 'ALQUILADO', 'MOVIMIENTO_TIERRAS', 'ABC-124', 'Komatsu', 'PC200', 'KOM200PC67890', 2021, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ003', 'CARG-001', 2, 2, 'ALQUILADO', 'MOVIMIENTO_TIERRAS', 'DEF-456', 'Caterpillar', '950M', 'CAT950M11111', 2019, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ004', 'CARG-002', 2, 2, 'PROPIO', 'MOVIMIENTO_TIERRAS', 'DEF-457', 'John Deere', '644K', 'JD644K22222', 2022, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ005', 'ROD-001', 3, 3, 'ALQUILADO', 'COMPACTACION', 'GHI-789', 'Dynapac', 'CA250', 'DYN250CA33333', 2021, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ006', 'MOTONIV-001', 1, 4, 'ALQUILADO', 'NIVELACION', 'JKL-012', 'Caterpillar', '140M', 'CAT140M44444', 2020, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ007', 'VOLQ-001', 3, 5, 'ALQUILADO', 'TRANSPORTE', 'MNO-345', 'Volvo', 'FM440', 'VOLVOFM55555', 2019, 'DIESEL', 'ODOMETRO', 'DISPONIBLE'),
('EQ008', 'VOLQ-002', 3, 5, 'PROPIO', 'TRANSPORTE', 'MNO-346', 'Scania', 'R450', 'SCANR66666', 2021, 'DIESEL', 'ODOMETRO', 'DISPONIBLE'),
('EQ009', 'EXC-003', 2, 1, 'ALQUILADO', 'MOVIMIENTO_TIERRAS', 'PQR-678', 'Hyundai', 'HX220L', 'HYU220L77777', 2022, 'DIESEL', 'HOROMETRO', 'DISPONIBLE'),
('EQ010', 'CARG-003', 1, 2, 'ALQUILADO', 'MOVIMIENTO_TIERRAS', 'STU-901', 'Case', '621G', 'CASE621G88888', 2020, 'DIESEL', 'HOROMETRO', 'DISPONIBLE');

-- Equipment Assignments (CORRECTED: removed legacy_id, using actual columns)
INSERT INTO equipo.equipo_edt (equipo_id, proyecto_id, fecha_asignacion, observaciones) VALUES
(1, 1, '2024-01-15', 'Asignado para movimiento de tierras'),
(2, 1, '2024-01-15', 'Asignado para excavación'),
(3, 1, '2024-01-20', 'Asignado para carga de material'),
(4, 2, '2024-03-10', 'Asignado para carga'),
(5, 2, '2024-03-15', 'Asignado para compactación'),
(6, 2, '2024-03-20', 'Asignado para nivelación'),
(7, 1, '2024-02-01', 'Asignado para transporte'),
(8, 3, '2024-02-05', 'Asignado para transporte local'),
(9, 2, '2024-04-01', 'Asignado para excavación profunda'),
(10, 3, '2024-02-10', 'Asignado para carga ligera');

-- Contracts (CORRECTED: removed proveedor_id, removed incluye_combustible)
INSERT INTO equipo.contrato_adenda (
  legacy_id, equipo_id, numero_contrato, tipo, fecha_contrato, fecha_inicio, fecha_fin,
  moneda, tipo_tarifa, tarifa, incluye_motor, incluye_operador, horas_incluidas, estado
) VALUES
('CON001', 1, 'CON-2024-001', 'CONTRATO', '2023-12-15', '2024-01-01', '2024-12-31', 'PEN', 'HORARIA', 150.00, FALSE, FALSE, 200, 'ACTIVO'),
('CON002', 2, 'CON-2024-002', 'CONTRATO', '2023-12-20', '2024-01-01', '2024-12-31', 'PEN', 'HORARIA', 145.00, FALSE, FALSE, 200, 'ACTIVO'),
('CON003', 3, 'CON-2024-003', 'CONTRATO', '2024-01-05', '2024-02-01', '2025-01-31', 'PEN', 'HORARIA', 130.00, TRUE, FALSE, 200, 'ACTIVO'),
('CON004', 5, 'CON-2024-004', 'CONTRATO', '2024-02-01', '2024-03-01', '2025-02-28', 'PEN', 'HORARIA', 120.00, FALSE, FALSE, 180, 'ACTIVO'),
('CON005', 6, 'CON-2024-005', 'CONTRATO', '2024-01-10', '2024-02-01', '2024-12-31', 'USD', 'HORARIA', 40.00, FALSE, FALSE, 200, 'ACTIVO'),
('CON006', 7, 'CON-2024-006', 'CONTRATO', '2024-01-15', '2024-02-01', '2025-01-31', 'PEN', 'DIARIA', 800.00, TRUE, TRUE, 0, 'ACTIVO');

-- Daily Reports (CORRECTED: fecha NOT fecha_reporte)
INSERT INTO equipo.parte_diario (
  legacy_id, equipo_id, trabajador_id, proyecto_id, fecha,
  hora_inicio, hora_fin, horometro_inicial, horometro_final,
  horas_trabajadas, combustible_consumido, observaciones, estado
) VALUES
('DR001', 1, 1, 1, '2024-01-15', '08:00', '17:00', 1000.0, 1008.0, 8.0, 45.5, 'Trabajo normal', 'APROBADO'),
('DR002', 2, 2, 1, '2024-01-15', '08:00', '17:00', 500.0, 508.0, 8.0, 42.0, 'Trabajo normal', 'APROBADO'),
('DR003', 3, 3, 1, '2024-01-20', '08:00', '17:00', 2000.0, 2008.0, 8.0, 38.0, 'Carga continua', 'APROBADO'),
('DR004', 1, 1, 1, '2024-01-16', '08:00', '17:00', 1008.0, 1016.0, 8.0, 44.0, 'Trabajo normal', 'APROBADO'),
('DR005', 2, 2, 1, '2024-01-16', '08:00', '16:00', 508.0, 515.0, 7.0, 40.0, 'Salida anticipada', 'APROBADO'),
('DR006', 4, 4, 2, '2024-03-10', '08:00', '17:00', 100.0, 108.0, 8.0, 50.0, 'Inicio en proyecto 2', 'APROBADO'),
('DR007', 5, 5, 2, '2024-03-15', '08:00', '18:00', 300.0, 309.0, 9.0, 55.0, 'Compactación intensiva', 'APROBADO'),
('DR008', 7, 5, 1, '2024-02-01', '07:00', '16:00', 15000.0, 15200.0, 9.0, 120.0, 'Transporte de material', 'APROBADO'),
('DR009', 8, 4, 3, '2024-02-05', '08:00', '17:00', 8000.0, 8180.0, 9.0, 110.0, 'Transporte local', 'APROBADO'),
('DR010', 9, 1, 2, '2024-04-01', '08:00', '17:00', 50.0, 58.0, 8.0, 48.0, 'Excavación inicial', 'APROBADO');

-- ============================================================================
-- SCHEMA: LOGISTICA (Logistics)
-- ============================================================================

-- Products (CORRECTED: matches actual logistica.producto schema)
INSERT INTO logistica.producto (legacy_id, codigo, nombre, descripcion, categoria, unidad_medida, stock_actual, stock_minimo, precio_unitario) VALUES
('PROD001', 'COMB-001', 'Diesel', 'Combustible Diesel B5', 'COMBUSTIBLE', 'GAL', 5000.00, 1000.00, 15.50),
('PROD002', 'ACEITE-001', 'Aceite Motor 15W40', 'Aceite para motor diesel', 'LUBRICANTE', 'GAL', 50.00, 10.00, 120.00),
('PROD003', 'FILTRO-001', 'Filtro de Aceite', 'Filtro de aceite para maquinaria pesada', 'REPUESTO', 'UND', 20.00, 5.00, 85.00),
('PROD004', 'LLANTA-001', 'Llanta 29.5R25', 'Llanta para cargador frontal', 'REPUESTO', 'UND', 8.00, 2.00, 4500.00),
('PROD005', 'GRAS-001', 'Grasa Multiuso', 'Grasa para lubricación general', 'LUBRICANTE', 'KG', 100.00, 20.00, 25.00);

-- Movements (Logistics) - CORRECTED: removed origen, destino; renamed columns
INSERT INTO logistica.movimiento (proyecto_id, fecha, tipo_movimiento, observaciones, estado, creado_por) VALUES
(1, '2024-01-15', 'entrada', 'Recepción de combustible mensual - Proveedor PECSA a Almacén Central', 'completado', 1),
(1, '2024-01-20', 'salida', 'Distribución de combustible a proyecto - Almacén Central a Proyecto Carretera Ancash', 'completado', 1),
(2, '2024-02-05', 'entrada', 'Recepción de repuestos - Proveedor Repuestos Lima a Almacén Central', 'completado', 2),
(1, '2024-02-10', 'salida', 'Distribución de lubricantes - Almacén Central a Proyecto Carretera Ancash', 'completado', 1),
(3, '2024-03-01', 'transferencia', 'Transferencia de filtros - Proyecto Carretera Ancash a Proyecto Lima Norte', 'completado', 3);

-- Movement Details - CORRECTED: renamed columns, removed lote (not in schema)
INSERT INTO logistica.detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario, observaciones) VALUES
(1, 1, 2000.00, 15.50, 'Diesel B5 recepción enero - LOT-2024-001'),
(2, 1, 500.00, 15.50, 'Distribución a proyecto - LOT-2024-001'),
(3, 3, 10.00, 85.00, 'Filtros recibidos - LOT-FILT-001'),
(4, 2, 20.00, 120.00, 'Aceite para mantenimiento - LOT-ACE-001'),
(5, 3, 3.00, 85.00, 'Filtros transferidos - LOT-FILT-001');

-- ============================================================================
-- SCHEMA: SST (Safety)
-- ============================================================================

-- Safety Incidents
INSERT INTO sst.incidente (legacy_id, fecha_incidente, tipo_incidente, severidad, ubicacion, descripcion, acciones_tomadas, proyecto_id, reportado_por, estado) VALUES
('INC001', '2024-01-25 10:30:00', 'CASI_ACCIDENTE', 'LEVE', 'Frente de trabajo - Km 45', 'Operador casi pierde estabilidad al bajar de excavadora', 'Capacitación sobre uso de puntos de apoyo al subir/bajar de equipo', 1, 1, 'CERRADO'),
('INC002', '2024-02-10 14:15:00', 'INCIDENTE_AMBIENTAL', 'MODERADO', 'Zona de abastecimiento', 'Derrame menor de combustible durante abastecimiento (5 galones)', 'Contención inmediata con kit antiderrames. Limpieza de área. Capacitación al personal.', 1, 2, 'CERRADO'),
('INC003', '2024-02-18 09:00:00', 'ACCIDENTE_LEVE', 'LEVE', 'Taller de mantenimiento', 'Técnico sufrió corte menor en mano durante cambio de filtro', 'Primeros auxilios. Uso obligatorio de guantes de protección.', 1, 3, 'CERRADO'),
('INC004', '2024-03-05 16:45:00', 'CASI_ACCIDENTE', 'MODERADO', 'Acceso principal obra', 'Vehículo liviano casi colisiona con volquete por falta de señalización', 'Instalación de señales de tránsito adicionales. Vigía permanente.', 2, 4, 'ABIERTO'),
('INC005', '2024-03-20 11:00:00', 'OBSERVACION', 'LEVE', 'Área de carga', 'Personal sin casco en zona de operaciones', 'Amonestación verbal. Reforzamiento de normas de seguridad.', 2, 5, 'EN_INVESTIGACION');

-- ============================================================================
-- SCHEMA: LICITACIONES (Tenders)
-- ============================================================================

-- Tenders (Public Schema)
INSERT INTO licitaciones (legacy_id, codigo, nombre, entidad_convocante, monto_referencial, fecha_convocatoria, fecha_presentacion, estado, observaciones) VALUES
('LIC001', 'LIC-2024-001', 'Mejoramiento de Carretera Tramo Huaraz-Recuay', 'Gobierno Regional de Ancash', 45000000.00, '2024-01-10', '2024-02-15', 'ADJUDICADO', 'Buena Pro otorgada a favor'),
('LIC002', 'LIC-2024-002', 'Construcción de Puente Vehicular sobre el Río Santa', 'MTC', 28000000.00, '2024-02-01', '2024-03-10', 'EVALUACION', 'Propuesta técnica presentada'),
('LIC003', 'LIC-2024-003', 'Mantenimiento Rutinario Red Vial Nacional Sector Lima Norte', 'Provias Nacional', 12000000.00, '2024-03-01', '2024-04-05', 'PUBLICADO', 'En proceso de elaboración de propuesta'),
('LIC004', 'LIC-2024-004', 'Rehabilitación de Vía Urbana Av. Los Próceres', 'Municipalidad de Lima', 8500000.00, '2024-03-15', '2024-04-20', 'PUBLICADO', 'Pendiente decisión de participación'),
('LIC005', 'LIC-2024-005', 'Construcción de Pavimento en Vía de Evitamiento Arequipa', 'GR Arequipa', 35000000.00, '2023-11-01', '2023-12-15', 'DESIERTO', 'Proceso declarado desierto por falta de postores');

-- ============================================================================
-- SCHEMA: EQUIPO - Valuations
-- ============================================================================

-- Equipment Valuations
INSERT INTO equipo.valorizacion_equipo (legacy_id, equipo_id, contrato_id, proyecto_id, periodo, fecha_inicio, fecha_fin, dias_trabajados, horas_trabajadas, combustible_consumido, costo_base, costo_combustible, total_valorizado, estado, observaciones, creado_por) VALUES
('VAL001', 1, 1, 1, '2024-01', '2024-01-01', '2024-01-31', 22, 176.0, 890.0, 26400.00, 13795.00, 40195.00, 'APROBADO', 'Valorización enero aprobada', 1),
('VAL002', 2, 2, 1, '2024-01', '2024-01-01', '2024-01-31', 22, 170.0, 850.0, 24650.00, 13175.00, 37825.00, 'APROBADO', 'Valorización enero aprobada', 1),
('VAL003', 3, 3, 1, '2024-01', '2024-01-01', '2024-01-31', 20, 160.0, 760.0, 20800.00, 11780.00, 32580.00, 'APROBADO', 'Valorización enero aprobada', 1),
('VAL004', 1, 1, 1, '2024-02', '2024-02-01', '2024-02-29', 23, 184.0, 920.0, 27600.00, 14260.00, 41860.00, 'PENDIENTE', 'Valorización febrero en revisión', 1),
('VAL005', 5, 4, 2, '2024-03', '2024-03-01', '2024-03-31', 21, 189.0, 1050.0, 22680.00, 16275.00, 38955.00, 'PENDIENTE', 'Valorización marzo pendiente', 2);

-- ============================================================================
-- SCHEMA: EQUIPO - Scheduled Tasks
-- ============================================================================

-- Scheduled Tasks - CORRECTED: Translate English enum values to Spanish
INSERT INTO equipo.tarea_programada (equipo_id, tipo_tarea, titulo, descripcion, fecha_inicio, fecha_fin, prioridad, estado, creado_por, proyecto_id) VALUES
(1, 'mantenimiento', 'Cambio de aceite y filtros - EXC-001', 'Mantenimiento preventivo cada 250 horas', '2024-02-15', '2024-02-15', 'alta', 'completado', 1, 1),
(2, 'mantenimiento', 'Revisión de sistema hidráulico - EXC-002', 'Inspección de mangueras y conexiones', '2024-02-20', '2024-02-20', 'media', 'completado', 1, 1),
(3, 'inspeccion', 'Inspección pre-uso - CARG-001', 'Revisión de check-list diario', '2024-03-01', '2024-03-01', 'baja', 'completado', 2, 1),
(4, 'mantenimiento', 'Cambio de llanta trasera - VOLQ-001', 'Reemplazo por desgaste', '2024-03-10', '2024-03-10', 'alta', 'completado', 2, 2),
(5, 'mantenimiento', 'Mantenimiento rodillo compactador - COMP-001', 'Revisión de vibrador y motor', '2024-03-20', '2024-03-21', 'alta', 'en_progreso', 2, 2),
(6, 'inspeccion', 'Inspección anual CITV - MOTONIV-001', 'Certificación técnica vehicular', '2024-04-01', '2024-04-01', 'alta', 'pendiente', 3, 2),
(7, 'asignacion', 'Asignación volquete a Proyecto Lima', 'Traslado de equipo', '2024-04-05', '2024-04-05', 'media', 'pendiente', 1, 3),
(8, 'mantenimiento', 'Servicio mayor excavadora - EXC-003', 'Mantenimiento a las 1000 horas', '2024-04-10', '2024-04-12', 'alta', 'pendiente', 1, 2),
(9, 'inspeccion', 'Calibración de horómetros', 'Verificación de medidores de uso', '2024-04-15', '2024-04-15', 'baja', 'pendiente', 1, 1),
(10, 'mantenimiento', 'Cambio de neumáticos cargador - CARG-002', 'Reemplazo completo de llantas', '2024-04-20', '2024-04-21', 'alta', 'pendiente', 2, 3);

-- ============================================================================
-- SCHEMA: EQUIPO - Configuración Combustible
-- ============================================================================

-- Configuración de combustible (default PRD rate)
INSERT INTO equipo.configuracion_combustible (precio_manipuleo, activo)
VALUES (0.80, TRUE);

-- ============================================================================
-- SCHEMA: ADMINISTRACION - Cost Centers
-- ============================================================================

-- Cost Centers
INSERT INTO administracion.centro_costo (legacy_id, codigo, nombre, descripcion, proyecto_id, presupuesto) VALUES
('CC001', 'CC-001-EQ', 'Alquiler de Equipos', 'Centro de costo para alquiler de maquinaria', 1, 500000.00),
('CC002', 'CC-002-COMB', 'Combustible', 'Centro de costo para combustibles y lubricantes', 1, 150000.00),
('CC003', 'CC-003-MANT', 'Mantenimiento', 'Centro de costo para mantenimiento de equipos', 1, 80000.00),
('CC004', 'CC-004-MO', 'Mano de Obra', 'Centro de costo para personal operativo', 1, 300000.00),
('CC005', 'CC-005-MAT', 'Materiales', 'Centro de costo para materiales de construcción', 2, 200000.00);

-- Display success message
SELECT '✅ Seed data loaded successfully!' AS status;
