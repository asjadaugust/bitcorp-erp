-- ============================================================================
-- Bitcorp ERP - Consolidated Database Schema Migration
-- Version: 3.0 (Spanish Names + Proper Schemas)
-- Date: 2025-12-22
-- Description: Complete schema with Spanish table names organized by schemas
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Create Schemas
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sistema;        -- System/Administration (G00)
CREATE SCHEMA IF NOT EXISTS proyectos;      -- Projects (A02)
CREATE SCHEMA IF NOT EXISTS proveedores;    -- Providers (C07)
CREATE SCHEMA IF NOT EXISTS administracion; -- Finance/Admin (C04)
CREATE SCHEMA IF NOT EXISTS rrhh;           -- Human Resources (C05)
CREATE SCHEMA IF NOT EXISTS logistica;      -- Logistics/Inventory (C06)
CREATE SCHEMA IF NOT EXISTS equipo;         -- Equipment (C08)
CREATE SCHEMA IF NOT EXISTS sst;            -- Safety & Health (C02)
CREATE SCHEMA IF NOT EXISTS sig;            -- Integrated Management System

COMMENT ON SCHEMA sistema IS 'Sistema: Users, roles, permissions, operating units';
COMMENT ON SCHEMA proyectos IS 'Proyectos: Projects and EDT management';
COMMENT ON SCHEMA proveedores IS 'Proveedores: Equipment and service providers';
COMMENT ON SCHEMA administracion IS 'Administración: Finance, cost centers, payments';
COMMENT ON SCHEMA rrhh IS 'Recursos Humanos: Operators, timesheets, payroll';
COMMENT ON SCHEMA logistica IS 'Logística: Inventory, products, movements';
COMMENT ON SCHEMA equipo IS 'Equipo: Heavy equipment management';
COMMENT ON SCHEMA sst IS 'Seguridad y Salud: Safety and occupational health';
COMMENT ON SCHEMA sig IS 'SIG: ISO management documents';

-- ============================================================================
-- SCHEMA: SISTEMA (System/Administration)
-- ============================================================================

-- Companies
CREATE TABLE sistema.empresa (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  ruc VARCHAR(11) UNIQUE NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  direccion TEXT,
  telefono VARCHAR(20),
  correo_electronico VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_empresa_ruc ON sistema.empresa(ruc);
CREATE INDEX idx_empresa_legacy_id ON sistema.empresa(legacy_id);

-- Operating Units (Unidades Operativas)
CREATE TABLE sistema.unidad_operativa (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unidad_operativa_codigo ON sistema.unidad_operativa(codigo);

-- Modules
CREATE TABLE sistema.modulo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  ruta VARCHAR(255),
  modulo_padre_id INTEGER REFERENCES sistema.modulo(id) ON DELETE SET NULL,
  orden_visualizacion INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modulo_codigo ON sistema.modulo(codigo);
CREATE INDEX idx_modulo_parent ON sistema.modulo(modulo_padre_id);

-- Roles
CREATE TABLE sistema.rol (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  descripcion TEXT,
  nivel INTEGER DEFAULT 3 CHECK (nivel BETWEEN 1 AND 4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rol_codigo ON sistema.rol(codigo);
CREATE INDEX idx_rol_nombre ON sistema.rol(nombre);

-- Permissions
CREATE TABLE sistema.permiso (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  modulo_id INTEGER REFERENCES sistema.modulo(id) ON DELETE CASCADE,
  codigo VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  recurso VARCHAR(100),
  accion VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permiso_codigo ON sistema.permiso(codigo);
CREATE INDEX idx_permiso_modulo ON sistema.permiso(modulo_id);

-- Users
CREATE TABLE sistema.usuario (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  correo_electronico VARCHAR(255) UNIQUE NOT NULL,
  nombres VARCHAR(100),
  apellidos VARCHAR(100),
  dni VARCHAR(20),
  telefono VARCHAR(20),
  rol_id INTEGER REFERENCES sistema.rol(id),
  unidad_operativa_id INTEGER REFERENCES sistema.unidad_operativa(id),
  is_active BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuario_nombre_usuario ON sistema.usuario(nombre_usuario);
CREATE INDEX idx_usuario_correo_electronico ON sistema.usuario(correo_electronico);
CREATE INDEX idx_usuario_dni ON sistema.usuario(dni);
CREATE INDEX idx_usuario_rol ON sistema.usuario(rol_id);
CREATE INDEX idx_usuario_unidad_operativa ON sistema.usuario(unidad_operativa_id);

-- User Roles (Many-to-Many)
CREATE TABLE sistema.usuario_rol (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES sistema.usuario(id) ON DELETE CASCADE,
  rol_id INTEGER NOT NULL REFERENCES sistema.rol(id) ON DELETE CASCADE,
  asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asignado_por INTEGER REFERENCES sistema.usuario(id),
  UNIQUE(usuario_id, rol_id)
);

CREATE INDEX idx_usuario_rol_usuario ON sistema.usuario_rol(usuario_id);
CREATE INDEX idx_usuario_rol_rol ON sistema.usuario_rol(rol_id);

-- Role Permissions (Many-to-Many)
CREATE TABLE sistema.rol_permiso (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER NOT NULL REFERENCES sistema.rol(id) ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES sistema.permiso(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rol_id, permiso_id)
);

CREATE INDEX idx_rol_permiso_rol ON sistema.rol_permiso(rol_id);
CREATE INDEX idx_rol_permiso_permiso ON sistema.rol_permiso(permiso_id);

-- ============================================================================
-- SCHEMA: PROYECTOS (Projects/EDT)
-- ============================================================================

CREATE TABLE proyectos.edt (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(255),
  fecha_inicio DATE,
  fecha_fin DATE,
  presupuesto DECIMAL(15,2),
  estado VARCHAR(50) DEFAULT 'PLANIFICACION',
  empresa_id INTEGER REFERENCES sistema.empresa(id),
  unidad_operativa_id INTEGER REFERENCES sistema.unidad_operativa(id),
  cliente VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  actualizado_por INTEGER REFERENCES sistema.usuario(id)
);

CREATE INDEX idx_edt_codigo ON proyectos.edt(codigo);
CREATE INDEX idx_edt_estado ON proyectos.edt(estado);
CREATE INDEX idx_edt_empresa ON proyectos.edt(empresa_id);
CREATE INDEX idx_edt_unidad_operativa ON proyectos.edt(unidad_operativa_id);
CREATE INDEX idx_edt_fecha_inicio ON proyectos.edt(fecha_inicio);
CREATE INDEX idx_edt_fecha_fin ON proyectos.edt(fecha_fin);

-- ============================================================================
-- SCHEMA: PROVEEDORES (Providers)
-- ============================================================================

CREATE TABLE proveedores.proveedor (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  ruc VARCHAR(11) UNIQUE NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  tipo_proveedor VARCHAR(50),
  direccion TEXT,
  telefono VARCHAR(20),
  correo_electronico VARCHAR(255),
  contacto_nombre VARCHAR(100),
  contacto_telefono VARCHAR(20),
  contacto_correo_electronico VARCHAR(255),
  cuenta_bancaria VARCHAR(50),
  banco VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proveedor_ruc ON proveedores.proveedor(ruc);
CREATE INDEX idx_proveedor_razon_social ON proveedores.proveedor(razon_social);
CREATE INDEX idx_proveedor_tipo ON proveedores.proveedor(tipo_proveedor);

-- ============================================================================
-- SCHEMA: ADMINISTRACION (Finance/Admin)
-- ============================================================================

-- Cost Centers
CREATE TABLE administracion.centro_costo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  presupuesto DECIMAL(15,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_centro_costo_codigo ON administracion.centro_costo(codigo);
CREATE INDEX idx_centro_costo_proyecto ON administracion.centro_costo(proyecto_id);

-- Accounts Payable
CREATE TABLE administracion.cuenta_por_pagar (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores.proveedor(id),
  numero_factura VARCHAR(50),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  monto_total DECIMAL(15,2) NOT NULL,
  monto_pagado DECIMAL(15,2) DEFAULT 0,
  saldo DECIMAL(15,2),
  moneda VARCHAR(3) DEFAULT 'PEN',
  estado VARCHAR(50) DEFAULT 'PENDIENTE',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuenta_por_pagar_proveedor ON administracion.cuenta_por_pagar(proveedor_id);
CREATE INDEX idx_cuenta_por_pagar_estado ON administracion.cuenta_por_pagar(estado);
CREATE INDEX idx_cuenta_por_pagar_fecha_vencimiento ON administracion.cuenta_por_pagar(fecha_vencimiento);

-- Payment Schedules
CREATE TABLE administracion.programacion_pago (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores.proveedor(id),
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  periodo VARCHAR(7) NOT NULL,
  fecha_programada DATE,
  monto_total DECIMAL(15,2),
  estado VARCHAR(50) DEFAULT 'PROGRAMADO',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_programacion_pago_proveedor ON administracion.programacion_pago(proveedor_id);
CREATE INDEX idx_programacion_pago_proyecto ON administracion.programacion_pago(proyecto_id);
CREATE INDEX idx_programacion_pago_periodo ON administracion.programacion_pago(periodo);

-- Payment Schedule Details
CREATE TABLE administracion.detalle_programacion_pago (
  id SERIAL PRIMARY KEY,
  programacion_pago_id INTEGER NOT NULL REFERENCES administracion.programacion_pago(id) ON DELETE CASCADE,
  valorizacion_id INTEGER,
  concepto VARCHAR(255),
  monto DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detalle_programacion_pago_programacion ON administracion.detalle_programacion_pago(programacion_pago_id);
CREATE INDEX idx_detalle_programacion_pago_valorizacion ON administracion.detalle_programacion_pago(valorizacion_id);

-- ============================================================================
-- SCHEMA: RRHH (Human Resources/Operators)
-- ============================================================================

CREATE TABLE rrhh.trabajador (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  dni VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  correo_electronico VARCHAR(255),
  direccion TEXT,
  tipo_contrato VARCHAR(50),
  fecha_ingreso DATE,
  fecha_cese DATE,
  cargo VARCHAR(100),
  especialidad VARCHAR(100),
  licencia_conducir VARCHAR(50),
  unidad_operativa_id INTEGER REFERENCES sistema.unidad_operativa(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trabajador_dni ON rrhh.trabajador(dni);
CREATE INDEX idx_trabajador_apellido ON rrhh.trabajador(apellido_paterno);
CREATE INDEX idx_trabajador_cargo ON rrhh.trabajador(cargo);
CREATE INDEX idx_trabajador_unidad_operativa ON rrhh.trabajador(unidad_operativa_id);

-- Operator Documents
CREATE TABLE rrhh.documento_trabajador (
  id SERIAL PRIMARY KEY,
  trabajador_id INTEGER NOT NULL REFERENCES rrhh.trabajador(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(50) NOT NULL,
  numero_documento VARCHAR(100),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  archivo_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documento_trabajador_trabajador ON rrhh.documento_trabajador(trabajador_id);
CREATE INDEX idx_documento_trabajador_tipo ON rrhh.documento_trabajador(tipo_documento);
CREATE INDEX idx_documento_trabajador_vencimiento ON rrhh.documento_trabajador(fecha_vencimiento);

-- Operator Availability
CREATE TABLE rrhh.disponibilidad_trabajador (
  id SERIAL PRIMARY KEY,
  trabajador_id INTEGER NOT NULL REFERENCES rrhh.trabajador(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  disponible BOOLEAN DEFAULT TRUE,
  motivo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disponibilidad_trabajador_trabajador ON rrhh.disponibilidad_trabajador(trabajador_id);
CREATE INDEX idx_disponibilidad_trabajador_fecha ON rrhh.disponibilidad_trabajador(fecha_inicio, fecha_fin);

-- Timesheets (Tareo)
CREATE TABLE rrhh.tareo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  trabajador_id INTEGER NOT NULL REFERENCES rrhh.trabajador(id),
  periodo VARCHAR(7) NOT NULL,
  total_dias_trabajados INTEGER DEFAULT 0,
  total_horas DECIMAL(8,2) DEFAULT 0,
  monto_calculado DECIMAL(12,2),
  estado VARCHAR(50) DEFAULT 'BORRADOR',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_en TIMESTAMP
);

CREATE INDEX idx_tareo_trabajador ON rrhh.tareo(trabajador_id);
CREATE INDEX idx_tareo_periodo ON rrhh.tareo(periodo);
CREATE INDEX idx_tareo_estado ON rrhh.tareo(estado);

-- Timesheet Details
CREATE TABLE rrhh.detalle_tareo (
  id SERIAL PRIMARY KEY,
  tareo_id INTEGER NOT NULL REFERENCES rrhh.tareo(id) ON DELETE CASCADE,
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  fecha DATE NOT NULL,
  horas_trabajadas DECIMAL(5,2),
  tarifa_hora DECIMAL(10,2),
  monto DECIMAL(12,2),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detalle_tareo_tareo ON rrhh.detalle_tareo(tareo_id);
CREATE INDEX idx_detalle_tareo_proyecto ON rrhh.detalle_tareo(proyecto_id);
CREATE INDEX idx_detalle_tareo_fecha ON rrhh.detalle_tareo(fecha);

-- ============================================================================
-- SCHEMA: LOGISTICA (Logistics/Inventory)
-- ============================================================================

CREATE TABLE logistica.producto (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  unidad_medida VARCHAR(20),
  stock_actual DECIMAL(12,3) DEFAULT 0,
  stock_minimo DECIMAL(12,3),
  precio_unitario DECIMAL(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_producto_codigo ON logistica.producto(codigo);
CREATE INDEX idx_producto_nombre ON logistica.producto(nombre);
CREATE INDEX idx_producto_categoria ON logistica.producto(categoria);

-- Inventory Movements
CREATE TABLE logistica.movimiento (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  tipo_movimiento VARCHAR(50) NOT NULL,
  numero_documento VARCHAR(50),
  fecha DATE NOT NULL,
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'BORRADOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_en TIMESTAMP
);

CREATE INDEX idx_movimiento_tipo ON logistica.movimiento(tipo_movimiento);
CREATE INDEX idx_movimiento_fecha ON logistica.movimiento(fecha);
CREATE INDEX idx_movimiento_proyecto ON logistica.movimiento(proyecto_id);
CREATE INDEX idx_movimiento_estado ON logistica.movimiento(estado);

-- Movement Details
CREATE TABLE logistica.detalle_movimiento (
  id SERIAL PRIMARY KEY,
  movimiento_id INTEGER NOT NULL REFERENCES logistica.movimiento(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES logistica.producto(id),
  cantidad DECIMAL(12,3) NOT NULL,
  precio_unitario DECIMAL(12,2),
  monto_total DECIMAL(15,2),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detalle_movimiento_movimiento ON logistica.detalle_movimiento(movimiento_id);
CREATE INDEX idx_detalle_movimiento_producto ON logistica.detalle_movimiento(producto_id);

-- ============================================================================
-- SCHEMA: EQUIPO (Equipment Management)
-- ============================================================================

-- Equipment Types
CREATE TABLE equipo.tipo_equipo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tipo_equipo_codigo ON equipo.tipo_equipo(codigo);
CREATE INDEX idx_tipo_equipo_categoria ON equipo.tipo_equipo(categoria);

-- Equipment
CREATE TABLE equipo.equipo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo_equipo VARCHAR(50) UNIQUE NOT NULL,
  proveedor_id INTEGER REFERENCES proveedores.proveedor(id),
  tipo_equipo_id INTEGER REFERENCES equipo.tipo_equipo(id),
  tipo_proveedor VARCHAR(50),
  categoria VARCHAR(100),
  placa VARCHAR(20),
  documento_acreditacion VARCHAR(100),
  fecha_acreditacion DATE,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  numero_serie_equipo VARCHAR(100),
  numero_chasis VARCHAR(100),
  numero_serie_motor VARCHAR(100),
  potencia_neta DECIMAL(10,2),
  anio_fabricacion INTEGER,
  codigo_externo VARCHAR(50),
  tipo_motor VARCHAR(50),
  medidor_uso VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'DISPONIBLE',
  fecha_venc_poliza DATE,
  fecha_venc_soat DATE,
  fecha_venc_citv DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  actualizado_por INTEGER REFERENCES sistema.usuario(id)
);

CREATE INDEX idx_equipo_codigo ON equipo.equipo(codigo_equipo);
CREATE INDEX idx_equipo_placa ON equipo.equipo(placa);
CREATE INDEX idx_equipo_proveedor ON equipo.equipo(proveedor_id);
CREATE INDEX idx_equipo_tipo ON equipo.equipo(tipo_equipo_id);
CREATE INDEX idx_equipo_estado ON equipo.equipo(estado);

-- Equipment Assignments (Equipment-Project relationship)
CREATE TABLE equipo.equipo_edt (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id) ON DELETE CASCADE,
  proyecto_id INTEGER NOT NULL REFERENCES proyectos.edt(id) ON DELETE CASCADE,
  fecha_asignacion DATE NOT NULL,
  fecha_liberacion DATE,
  is_active BOOLEAN DEFAULT TRUE,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipo_edt_equipo ON equipo.equipo_edt(equipo_id);
CREATE INDEX idx_equipo_edt_proyecto ON equipo.equipo_edt(proyecto_id);
CREATE INDEX idx_equipo_edt_active ON equipo.equipo_edt(is_active);

-- Contracts and Addendums
CREATE TABLE equipo.contrato_adenda (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id),
  numero_contrato VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(50) DEFAULT 'CONTRATO',
  contrato_padre_id INTEGER REFERENCES equipo.contrato_adenda(id),
  fecha_contrato DATE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  moneda VARCHAR(3) DEFAULT 'PEN',
  tipo_tarifa VARCHAR(50),
  tarifa DECIMAL(12,2),
  incluye_motor BOOLEAN DEFAULT FALSE,
  incluye_operador BOOLEAN DEFAULT FALSE,
  costo_adicional_motor DECIMAL(12,2),
  horas_incluidas INTEGER,
  penalidad_exceso DECIMAL(12,2),
  condiciones_especiales TEXT,
  documento_url TEXT,
  estado VARCHAR(50) DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id)
);

CREATE INDEX idx_contrato_adenda_equipo ON equipo.contrato_adenda(equipo_id);
CREATE INDEX idx_contrato_adenda_numero ON equipo.contrato_adenda(numero_contrato);
CREATE INDEX idx_contrato_adenda_padre ON equipo.contrato_adenda(contrato_padre_id);
CREATE INDEX idx_contrato_adenda_estado ON equipo.contrato_adenda(estado);
CREATE INDEX idx_contrato_adenda_fecha_fin ON equipo.contrato_adenda(fecha_fin);

-- Equipment Valuations
CREATE TABLE equipo.valorizacion_equipo (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id),
  contrato_id INTEGER REFERENCES equipo.contrato_adenda(id),
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  periodo VARCHAR(7) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_trabajados INTEGER,
  horas_trabajadas DECIMAL(10,2),
  combustible_consumido DECIMAL(10,2),
  costo_base DECIMAL(15,2),
  costo_combustible DECIMAL(15,2),
  cargos_adicionales DECIMAL(15,2),
  total_valorizado DECIMAL(15,2),
  estado VARCHAR(50) DEFAULT 'PENDIENTE',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_en TIMESTAMP
);

CREATE INDEX idx_valorizacion_equipo_equipo ON equipo.valorizacion_equipo(equipo_id);
CREATE INDEX idx_valorizacion_equipo_contrato ON equipo.valorizacion_equipo(contrato_id);
CREATE INDEX idx_valorizacion_equipo_proyecto ON equipo.valorizacion_equipo(proyecto_id);
CREATE INDEX idx_valorizacion_equipo_periodo ON equipo.valorizacion_equipo(periodo);
CREATE INDEX idx_valorizacion_equipo_estado ON equipo.valorizacion_equipo(estado);

-- Daily Reports (Parte Diario)
CREATE TABLE equipo.parte_diario (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id),
  trabajador_id INTEGER REFERENCES rrhh.trabajador(id),
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  valorizacion_id INTEGER REFERENCES equipo.valorizacion_equipo(id),
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  horometro_inicial DECIMAL(10,2),
  horometro_final DECIMAL(10,2),
  odometro_inicial DECIMAL(10,2),
  odometro_final DECIMAL(10,2),
  horas_trabajadas DECIMAL(5,2),
  km_recorridos DECIMAL(10,2),
  combustible_inicial DECIMAL(10,2),
  combustible_consumido DECIMAL(10,2),
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'BORRADOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_por INTEGER REFERENCES sistema.usuario(id),
  aprobado_en TIMESTAMP
);

CREATE INDEX idx_parte_diario_equipo ON equipo.parte_diario(equipo_id);
CREATE INDEX idx_parte_diario_trabajador ON equipo.parte_diario(trabajador_id);
CREATE INDEX idx_parte_diario_proyecto ON equipo.parte_diario(proyecto_id);
CREATE INDEX idx_parte_diario_valorizacion ON equipo.parte_diario(valorizacion_id);
CREATE INDEX idx_parte_diario_fecha ON equipo.parte_diario(fecha);
CREATE INDEX idx_parte_diario_estado ON equipo.parte_diario(estado);

-- Fuel Records
CREATE TABLE equipo.equipo_combustible (
  id SERIAL PRIMARY KEY,
  valorizacion_id INTEGER NOT NULL REFERENCES equipo.valorizacion_equipo(id),
  fecha DATE NOT NULL,
  cantidad DECIMAL(10,2),
  precio_unitario DECIMAL(10,2),
  monto_total DECIMAL(12,2),
  tipo_combustible VARCHAR(50),
  proveedor VARCHAR(100),
  numero_documento VARCHAR(50),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipo_combustible_valorizacion ON equipo.equipo_combustible(valorizacion_id);
CREATE INDEX idx_equipo_combustible_fecha ON equipo.equipo_combustible(fecha);

-- Maintenance Schedules
CREATE TABLE equipo.programa_mantenimiento (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER NOT NULL REFERENCES equipo.equipo(id),
  tipo_mantenimiento VARCHAR(50) NOT NULL,
  descripcion TEXT,
  fecha_programada DATE,
  fecha_realizada DATE,
  costo_estimado DECIMAL(12,2),
  costo_real DECIMAL(12,2),
  tecnico_responsable VARCHAR(100),
  estado VARCHAR(50) DEFAULT 'PROGRAMADO',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_programa_mantenimiento_equipo ON equipo.programa_mantenimiento(equipo_id);
CREATE INDEX idx_programa_mantenimiento_fecha_programada ON equipo.programa_mantenimiento(fecha_programada);
CREATE INDEX idx_programa_mantenimiento_estado ON equipo.programa_mantenimiento(estado);

-- Scheduled Tasks
CREATE TABLE equipo.tarea_programada (
  id SERIAL PRIMARY KEY,
  programa_mantenimiento_id INTEGER,
  equipo_id INTEGER REFERENCES equipo.equipo(id),
  trabajador_id INTEGER REFERENCES rrhh.trabajador(id),
  task_type VARCHAR(50) DEFAULT 'maintenance',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  recurrence VARCHAR(50),
  duration_minutes INTEGER DEFAULT 120,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  completion_date TIMESTAMP,
  completion_notes TEXT,
  maintenance_record_id INTEGER,
  creado_por INTEGER REFERENCES sistema.usuario(id),
  asignado_por INTEGER REFERENCES sistema.usuario(id),
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tarea_programada_equipo ON equipo.tarea_programada(equipo_id);
CREATE INDEX idx_tarea_programada_trabajador ON equipo.tarea_programada(trabajador_id);
CREATE INDEX idx_tarea_programada_proyecto ON equipo.tarea_programada(proyecto_id);
CREATE INDEX idx_tarea_programada_start_date ON equipo.tarea_programada(start_date);
CREATE INDEX idx_tarea_programada_status ON equipo.tarea_programada(status);

-- Configuración de manipuleo de combustible (PRD Anexo B)
CREATE TABLE equipo.configuracion_combustible (
  id SERIAL PRIMARY KEY,
  precio_manipuleo DECIMAL(10,2) NOT NULL DEFAULT 0.80,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by INTEGER REFERENCES sistema.usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SCHEMA: SST (Safety & Health)
-- ============================================================================

CREATE TABLE sst.incidente (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  fecha_incidente TIMESTAMP NOT NULL,
  tipo_incidente VARCHAR(100),
  severidad VARCHAR(50),
  ubicacion TEXT,
  descripcion TEXT,
  acciones_tomadas TEXT,
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  reportado_por INTEGER REFERENCES sistema.usuario(id),
  estado VARCHAR(50) DEFAULT 'ABIERTO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidente_fecha ON sst.incidente(fecha_incidente);
CREATE INDEX idx_incidente_tipo ON sst.incidente(tipo_incidente);
CREATE INDEX idx_incidente_proyecto ON sst.incidente(proyecto_id);
CREATE INDEX idx_incidente_estado ON sst.incidente(estado);

-- ============================================================================
-- SCHEMA: SIG (Integrated Management System)
-- ============================================================================

CREATE TABLE sig.documento (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(100),
  iso_standard VARCHAR(50),
  version VARCHAR(20),
  fecha_emision DATE,
  fecha_revision DATE,
  archivo_url TEXT,
  estado VARCHAR(50) DEFAULT 'VIGENTE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES sistema.usuario(id)
);

CREATE INDEX idx_documento_codigo ON sig.documento(codigo);
CREATE INDEX idx_documento_tipo ON sig.documento(tipo_documento);
CREATE INDEX idx_documento_iso_standard ON sig.documento(iso_standard);
CREATE INDEX idx_documento_estado ON sig.documento(estado);

-- ============================================================================
-- Additional Tables (kept in public schema for now)
-- ============================================================================

CREATE TABLE licitaciones (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  entidad_convocante VARCHAR(255),
  monto_referencial DECIMAL(15,2),
  fecha_convocatoria DATE,
  fecha_presentacion DATE,
  estado VARCHAR(50) DEFAULT 'PUBLICADO',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licitaciones_codigo ON licitaciones(codigo);
CREATE INDEX idx_licitaciones_estado ON licitaciones(estado);

CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES sistema.usuario(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50),
  leido BOOLEAN DEFAULT FALSE,
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leido ON notificaciones(leido);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA sistema TO bitcorp;
GRANT USAGE ON SCHEMA proyectos TO bitcorp;
GRANT USAGE ON SCHEMA proveedores TO bitcorp;
GRANT USAGE ON SCHEMA administracion TO bitcorp;
GRANT USAGE ON SCHEMA rrhh TO bitcorp;
GRANT USAGE ON SCHEMA logistica TO bitcorp;
GRANT USAGE ON SCHEMA equipo TO bitcorp;
GRANT USAGE ON SCHEMA sst TO bitcorp;
GRANT USAGE ON SCHEMA sig TO bitcorp;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sistema TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA proyectos TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA proveedores TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA administracion TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rrhh TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logistica TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA equipo TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sst TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sig TO bitcorp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bitcorp;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sistema TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA proyectos TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA proveedores TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA administracion TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA rrhh TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA logistica TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA equipo TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sst TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sig TO bitcorp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bitcorp;

-- ============================================================================
-- PUBLIC SCHEMA TABLES (Cross-cutting concerns)
-- ============================================================================

-- Notifications (System-wide notifications)
CREATE TABLE public.notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES sistema.usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  data JSONB,
  leido BOOLEAN DEFAULT FALSE,
  leido_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leido ON public.notificaciones(leido);
CREATE INDEX idx_notificaciones_created ON public.notificaciones(created_at DESC);

-- Audit Log (System-wide audit trail)
CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES sistema.usuario(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_usuario ON public.audit_log(usuario_id);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- System Settings
CREATE TABLE public.configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo_dato VARCHAR(20) DEFAULT 'string',
  descripcion TEXT,
  categoria VARCHAR(50),
  es_publico BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_por INTEGER REFERENCES sistema.usuario(id)
);

CREATE INDEX idx_configuracion_clave ON public.configuracion(clave);
CREATE INDEX idx_configuracion_categoria ON public.configuracion(categoria);

-- File Attachments (Generic file storage)
CREATE TABLE public.adjuntos (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tipo_mime VARCHAR(100),
  tamano_bytes BIGINT,
  descripcion TEXT,
  subido_por INTEGER REFERENCES sistema.usuario(id),
  subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adjuntos_entity ON public.adjuntos(entity_type, entity_id);
CREATE INDEX idx_adjuntos_subido_por ON public.adjuntos(subido_por);

-- ============================================================================
-- Migration Complete
-- ============================================================================
