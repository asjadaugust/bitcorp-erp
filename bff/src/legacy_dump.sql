--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tbl_g00001_unidadoperativa; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00001_unidadoperativa (id, codigo, nombre, direccion, telefono, email, estado, fecha_creacion, fecha_modificacion) VALUES (33, 'UO001', 'Oficina Principal', 'Av. Javier Prado 123, San Isidro, Lima', '01-2345678', 'principal@aramsa.com', true, '2025-07-05 01:21:50.51039', '2025-07-05 01:21:50.51039');
INSERT INTO public.tbl_g00001_unidadoperativa (id, codigo, nombre, direccion, telefono, email, estado, fecha_creacion, fecha_modificacion) VALUES (34, 'UO002', 'Sucursal Norte', 'Jr. Independencia 456, Los Olivos, Lima', '01-3456789', 'norte@aramsa.com', true, '2025-07-05 01:21:50.51039', '2025-07-05 01:21:50.51039');
INSERT INTO public.tbl_g00001_unidadoperativa (id, codigo, nombre, direccion, telefono, email, estado, fecha_creacion, fecha_modificacion) VALUES (35, 'UO003', 'Sucursal Sur', 'Av. Aviación 789, San Borja, Lima', '01-4567890', 'sur@aramsa.com', true, '2025-07-05 01:21:50.51039', '2025-07-05 01:21:50.51039');
INSERT INTO public.tbl_g00001_unidadoperativa (id, codigo, nombre, direccion, telefono, email, estado, fecha_creacion, fecha_modificacion) VALUES (36, 'UO004', 'Almacén Central', 'Av. Argentina 321, Callao', '01-5678901', 'almacen@aramsa.com', true, '2025-07-05 01:21:50.51039', '2025-07-05 01:21:50.51039');


--
-- Data for Name: tbl_g00002_usuario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (57, 'admin', 'admin123', 'Administrador', 'Sistema', 'admin@aramsa.com', '999888777', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (58, 'gerente', 'gerente123', 'Carlos', 'Mendoza', 'gerente@aramsa.com', '999888776', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (59, 'contador', 'contador123', 'María', 'González', 'contador@aramsa.com', '999888775', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (60, 'rrhh01', 'rrhh123', 'Ana', 'Rodríguez', 'rrhh@aramsa.com', '999888774', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (61, 'sst01', 'sst123', 'Luis', 'Torres', 'sst@aramsa.com', '999888773', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (62, 'logistica01', 'logistica123', 'Pedro', 'Sánchez', 'logistica@aramsa.com', '999888772', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');
INSERT INTO public.tbl_g00002_usuario (id, usuario, "contraseña", nombres, apellidos, email, telefono, estado, ultimo_login, fecha_creacion, fecha_modificacion) VALUES (63, 'usuario01', 'usuario123', 'Carmen', 'López', 'usuario01@aramsa.com', '999888771', true, NULL, '2025-07-05 01:21:50.600803', '2025-07-05 01:21:50.600803');


--
-- Data for Name: tbl_302_105_inspeccionsst; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_302_105_inspeccionsst (id, codigo, fecha_inspeccion, area_inspeccionada, inspector, tipo_inspeccion, estado, observaciones, accion_correctiva, fecha_cierre, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (5, 'INS-2024-001', '2024-06-01', 'Área de Producción', 'Luis Torres Castro', 'Rutinaria', 'Cerrado', 'Inspección mensual de equipos de protección personal', NULL, NULL, 33, 61, '2025-07-05 01:21:50.607719', '2025-07-05 01:21:50.607719');
INSERT INTO public.tbl_302_105_inspeccionsst (id, codigo, fecha_inspeccion, area_inspeccionada, inspector, tipo_inspeccion, estado, observaciones, accion_correctiva, fecha_cierre, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (6, 'INS-2024-002', '2024-06-05', 'Almacén Principal', 'Luis Torres Castro', 'Especial', 'Pendiente', 'Revisión de señalización de emergencia', NULL, NULL, 36, 61, '2025-07-05 01:21:50.607719', '2025-07-05 01:21:50.607719');
INSERT INTO public.tbl_302_105_inspeccionsst (id, codigo, fecha_inspeccion, area_inspeccionada, inspector, tipo_inspeccion, estado, observaciones, accion_correctiva, fecha_cierre, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (7, 'INS-2024-003', '2024-06-10', 'Oficinas Administrativas', 'Luis Torres Castro', 'Rutinaria', 'En Proceso', 'Evaluación ergonómica de puestos de trabajo', NULL, NULL, 33, 61, '2025-07-05 01:21:50.607719', '2025-07-05 01:21:50.607719');
INSERT INTO public.tbl_302_105_inspeccionsst (id, codigo, fecha_inspeccion, area_inspeccionada, inspector, tipo_inspeccion, estado, observaciones, accion_correctiva, fecha_cierre, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (8, 'INS-2024-004', '2024-06-15', 'Área de Mantenimiento', 'Luis Torres Castro', 'Especial', 'Pendiente', 'Inspección de herramientas y equipos', NULL, NULL, 34, 61, '2025-07-05 01:21:50.607719', '2025-07-05 01:21:50.607719');


--
-- Data for Name: tbl_304_002_cuentaporpagar; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_304_002_cuentaporpagar (id, numero_factura, proveedor, monto, fecha_emision, fecha_vencimiento, estado, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (6, 'F001-00001', 'Distribuidora Industrial SAC', 15750.00, '2024-06-01', '2024-07-01', 'Pendiente', 33, 59, '2025-07-05 01:21:50.6061', '2025-07-05 01:21:50.6061');
INSERT INTO public.tbl_304_002_cuentaporpagar (id, numero_factura, proveedor, monto, fecha_emision, fecha_vencimiento, estado, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (7, 'F002-00025', 'Servicios Técnicos Perú EIRL', 8200.00, '2024-06-05', '2024-07-05', 'Pendiente', 34, 59, '2025-07-05 01:21:50.6061', '2025-07-05 01:21:50.6061');
INSERT INTO public.tbl_304_002_cuentaporpagar (id, numero_factura, proveedor, monto, fecha_emision, fecha_vencimiento, estado, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (8, 'F003-00187', 'Suministros Generales Lima', 5600.00, '2024-06-10', '2024-07-10', 'Pagado', 33, 59, '2025-07-05 01:21:50.6061', '2025-07-05 01:21:50.6061');
INSERT INTO public.tbl_304_002_cuentaporpagar (id, numero_factura, proveedor, monto, fecha_emision, fecha_vencimiento, estado, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (9, 'F004-00092', 'Consultora Empresarial ABC', 12300.00, '2024-06-15', '2024-07-15', 'Pendiente', 35, 59, '2025-07-05 01:21:50.6061', '2025-07-05 01:21:50.6061');
INSERT INTO public.tbl_304_002_cuentaporpagar (id, numero_factura, proveedor, monto, fecha_emision, fecha_vencimiento, estado, unidad_operativa_id, usuario_creacion_id, fecha_creacion, fecha_modificacion) VALUES (10, 'F001-00002', 'Distribuidora Industrial SAC', 22100.00, '2024-06-20', '2024-07-20', 'Vencido', 36, 59, '2025-07-05 01:21:50.6061', '2025-07-05 01:21:50.6061');


--
-- Data for Name: tbl_304_003_programacionpagos; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tbl_305_001_empleado; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_305_001_empleado (id, codigo, nombres, apellidos, documento_identidad, fecha_nacimiento, telefono, email, direccion, fecha_ingreso, cargo, salario, estado, unidad_operativa_id, fecha_creacion, fecha_modificacion) VALUES (36, 'EMP001', 'Carlos', 'Mendoza Ruiz', '12345678', '1985-03-15', '999888777', 'carlos.mendoza@aramsa.com', 'Jr. Las Flores 123', '2020-01-15', 'Gerente General', 8000.00, 'Activo', 33, '2025-07-05 01:21:50.601774', '2025-07-05 01:21:50.601774');
INSERT INTO public.tbl_305_001_empleado (id, codigo, nombres, apellidos, documento_identidad, fecha_nacimiento, telefono, email, direccion, fecha_ingreso, cargo, salario, estado, unidad_operativa_id, fecha_creacion, fecha_modificacion) VALUES (37, 'EMP002', 'María', 'González Silva', '23456789', '1988-07-22', '999888776', 'maria.gonzalez@aramsa.com', 'Av. Primavera 456', '2020-02-01', 'Contador Principal', 5500.00, 'Activo', 33, '2025-07-05 01:21:50.601774', '2025-07-05 01:21:50.601774');
INSERT INTO public.tbl_305_001_empleado (id, codigo, nombres, apellidos, documento_identidad, fecha_nacimiento, telefono, email, direccion, fecha_ingreso, cargo, salario, estado, unidad_operativa_id, fecha_creacion, fecha_modificacion) VALUES (38, 'EMP003', 'Ana', 'Rodríguez Vega', '34567890', '1990-11-10', '999888775', 'ana.rodriguez@aramsa.com', 'Jr. Los Rosales 789', '2020-03-01', 'Jefe de RRHH', 4500.00, 'Activo', 33, '2025-07-05 01:21:50.601774', '2025-07-05 01:21:50.601774');
INSERT INTO public.tbl_305_001_empleado (id, codigo, nombres, apellidos, documento_identidad, fecha_nacimiento, telefono, email, direccion, fecha_ingreso, cargo, salario, estado, unidad_operativa_id, fecha_creacion, fecha_modificacion) VALUES (39, 'EMP004', 'Luis', 'Torres Castro', '45678901', '1987-05-18', '999888774', 'luis.torres@aramsa.com', 'Av. Industrial 321', '2020-04-15', 'Especialista SST', 4000.00, 'Activo', 34, '2025-07-05 01:21:50.601774', '2025-07-05 01:21:50.601774');
INSERT INTO public.tbl_305_001_empleado (id, codigo, nombres, apellidos, documento_identidad, fecha_nacimiento, telefono, email, direccion, fecha_ingreso, cargo, salario, estado, unidad_operativa_id, fecha_creacion, fecha_modificacion) VALUES (40, 'EMP005', 'Pedro', 'Sánchez Herrera', '56789012', '1992-09-03', '999888773', 'pedro.sanchez@aramsa.com', 'Jr. Comercio 654', '2020-05-01', 'Jefe de Logística', 4200.00, 'Activo', 36, '2025-07-05 01:21:50.601774', '2025-07-05 01:21:50.601774');


--
-- Data for Name: tbl_307_001_proveedor; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_307_001_proveedor (id, codigo, razon_social, ruc, direccion, telefono, email, contacto_principal, estado, fecha_creacion, fecha_modificacion) VALUES (13, 'PROV001', 'Distribuidora Industrial SAC', '20123456789', 'Av. Industrial 1000, Villa El Salvador', '01-2876543', 'ventas@distind.com.pe', 'Roberto Campos', 'Activo', '2025-07-05 01:21:50.605047', '2025-07-05 01:21:50.605047');
INSERT INTO public.tbl_307_001_proveedor (id, codigo, razon_social, ruc, direccion, telefono, email, contacto_principal, estado, fecha_creacion, fecha_modificacion) VALUES (14, 'PROV002', 'Servicios Técnicos Perú EIRL', '20234567890', 'Jr. Tecnología 200, San Juan de Lurigancho', '01-3987654', 'contacto@servtecperu.com', 'Patricia Vásquez', 'Activo', '2025-07-05 01:21:50.605047', '2025-07-05 01:21:50.605047');
INSERT INTO public.tbl_307_001_proveedor (id, codigo, razon_social, ruc, direccion, telefono, email, contacto_principal, estado, fecha_creacion, fecha_modificacion) VALUES (15, 'PROV003', 'Suministros Generales Lima', '20345678901', 'Av. República 500, La Victoria', '01-4098765', 'compras@sumgeneral.pe', 'Miguel Ríos', 'Activo', '2025-07-05 01:21:50.605047', '2025-07-05 01:21:50.605047');
INSERT INTO public.tbl_307_001_proveedor (id, codigo, razon_social, ruc, direccion, telefono, email, contacto_principal, estado, fecha_creacion, fecha_modificacion) VALUES (16, 'PROV004', 'Consultora Empresarial ABC', '20456789012', 'Jr. Consultoría 150, Miraflores', '01-5109876', 'info@consultoraabc.com', 'Sandra Morales', 'Activo', '2025-07-05 01:21:50.605047', '2025-07-05 01:21:50.605047');


--
-- Data for Name: tbl_g00004_rol; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (57, 'Administrador', 'Acceso completo al sistema', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (58, 'Gerente', 'Acceso a módulos de gestión y reportes', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (59, 'Contador', 'Acceso a módulos contables y financieros', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (60, 'RRHH', 'Acceso a módulo de recursos humanos', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (61, 'SST', 'Acceso a módulo de seguridad y salud en el trabajo', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (62, 'Logística', 'Acceso a módulo de logística y almacén', true, '2025-07-05 01:21:50.598623');
INSERT INTO public.tbl_g00004_rol (id, nombre, descripcion, estado, fecha_creacion) VALUES (63, 'Usuario', 'Acceso básico de consulta', true, '2025-07-05 01:21:50.598623');


--
-- Data for Name: tbl_g00005_usuariorol; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (8, 57, 57, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (9, 58, 58, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (10, 59, 59, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (11, 60, 60, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (12, 61, 61, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (13, 62, 62, '2025-07-05 01:21:50.609241');
INSERT INTO public.tbl_g00005_usuariorol (id, usuario_id, rol_id, fecha_asignacion) VALUES (14, 63, 63, '2025-07-05 01:21:50.609241');


--
-- Data for Name: tbl_g00006_permiso; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (81, 'admin.full', 'Acceso completo administrativo', 'Global', 'ALL', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (82, 'contabilidad.read', 'Consultar información contable', 'Contabilidad', 'READ', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (83, 'contabilidad.write', 'Modificar información contable', 'Contabilidad', 'WRITE', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (84, 'rrhh.read', 'Consultar información de RRHH', 'RRHH', 'READ', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (85, 'rrhh.write', 'Modificar información de RRHH', 'RRHH', 'WRITE', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (86, 'sst.read', 'Consultar información de SST', 'SST', 'READ', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (87, 'sst.write', 'Modificar información de SST', 'SST', 'WRITE', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (88, 'logistica.read', 'Consultar información de logística', 'Logística', 'READ', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (89, 'logistica.write', 'Modificar información de logística', 'Logística', 'WRITE', true, '2025-07-05 01:21:50.599817');
INSERT INTO public.tbl_g00006_permiso (id, nombre, descripcion, modulo, accion, estado, fecha_creacion) VALUES (90, 'reportes.generate', 'Generar reportes', 'Reportes', 'GENERATE', true, '2025-07-05 01:21:50.599817');


--
-- Data for Name: tbl_g00007_rolpermiso; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (1, 57, 81, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (2, 58, 82, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (3, 59, 82, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (4, 63, 82, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (5, 58, 83, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (6, 59, 83, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (7, 60, 84, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (8, 63, 84, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (9, 60, 85, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (10, 61, 86, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (11, 63, 86, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (12, 61, 87, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (13, 62, 88, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (14, 63, 88, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (15, 62, 89, '2025-07-05 01:21:50.610945');
INSERT INTO public.tbl_g00007_rolpermiso (id, rol_id, permiso_id, fecha_asignacion) VALUES (16, 58, 90, '2025-07-05 01:21:50.610945');


--
-- Name: tbl_302_105_inspeccionsst_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_302_105_inspeccionsst_id_seq', 8, true);


--
-- Name: tbl_304_002_cuentaporpagar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_304_002_cuentaporpagar_id_seq', 10, true);


--
-- Name: tbl_304_003_programacionpagos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_304_003_programacionpagos_id_seq', 1, false);


--
-- Name: tbl_305_001_empleado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_305_001_empleado_id_seq', 40, true);


--
-- Name: tbl_307_001_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_307_001_proveedor_id_seq', 16, true);


--
-- Name: tbl_g00001_unidadoperativa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00001_unidadoperativa_id_seq', 36, true);


--
-- Name: tbl_g00002_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00002_usuario_id_seq', 63, true);


--
-- Name: tbl_g00004_rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00004_rol_id_seq', 63, true);


--
-- Name: tbl_g00005_usuariorol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00005_usuariorol_id_seq', 14, true);


--
-- Name: tbl_g00006_permiso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00006_permiso_id_seq', 90, true);


--
-- Name: tbl_g00007_rolpermiso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tbl_g00007_rolpermiso_id_seq', 16, true);


--
-- PostgreSQL database dump complete
--

