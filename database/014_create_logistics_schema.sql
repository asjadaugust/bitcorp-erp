-- ============================================
-- Migration: 014_create_logistics_schema.sql
-- Description: Create logistics schema with inventory movements and products
-- Date: 2026-01-18
-- Related Issues: Logistics movements endpoint returning 500 error
-- ============================================

-- Create logistics schema
CREATE SCHEMA IF NOT EXISTS logistica;

-- ============================================
-- PRODUCTOS (Products/Inventory Items)
-- ============================================
CREATE TABLE IF NOT EXISTS logistica.producto (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  unidad_medida VARCHAR(20),
  stock_actual DECIMAL(12,3) DEFAULT 0 NOT NULL,
  stock_minimo DECIMAL(12,3),
  precio_unitario DECIMAL(12,2),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- MOVIMIENTOS (Inventory Movements)
-- ============================================
CREATE TABLE IF NOT EXISTS logistica.movimiento (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  proyecto_id INTEGER REFERENCES public.projects(id),
  fecha DATE NOT NULL,
  tipo_movimiento VARCHAR(50) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'transferencia', 'ajuste')),
  numero_documento VARCHAR(50),
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'completado')),
  creado_por INTEGER REFERENCES public.users(id),
  aprobado_por INTEGER REFERENCES public.users(id),
  aprobado_en TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- DETALLE_MOVIMIENTO (Movement Details)
-- ============================================
CREATE TABLE IF NOT EXISTS logistica.detalle_movimiento (
  id SERIAL PRIMARY KEY,
  movimiento_id INTEGER NOT NULL REFERENCES logistica.movimiento(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES logistica.producto(id),
  cantidad DECIMAL(12,3) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  monto_total DECIMAL(15,2),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Producto indexes
CREATE INDEX IF NOT EXISTS idx_producto_codigo ON logistica.producto(codigo);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON logistica.producto(categoria);

-- Movimiento indexes
CREATE INDEX IF NOT EXISTS idx_movements_project ON logistica.movimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movements_fecha ON logistica.movimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_movements_tipo ON logistica.movimiento(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movements_status ON logistica.movimiento(estado);
CREATE INDEX IF NOT EXISTS idx_movements_created_by ON logistica.movimiento(creado_por);

-- Detalle_movimiento indexes
CREATE INDEX IF NOT EXISTS idx_movement_details_movement ON logistica.detalle_movimiento(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_movement_details_product ON logistica.detalle_movimiento(producto_id);

-- ============================================
-- TRIGGERS (Auto-update updated_at)
-- ============================================

CREATE OR REPLACE FUNCTION logistica.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_producto_updated_at
  BEFORE UPDATE ON logistica.producto
  FOR EACH ROW
  EXECUTE FUNCTION logistica.update_updated_at_column();

CREATE TRIGGER update_movimiento_updated_at
  BEFORE UPDATE ON logistica.movimiento
  FOR EACH ROW
  EXECUTE FUNCTION logistica.update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON SCHEMA logistica IS 'Logistics and inventory management schema';
COMMENT ON TABLE logistica.producto IS 'Products and inventory items (materials, tools, consumables)';
COMMENT ON TABLE logistica.movimiento IS 'Inventory movements (entries, exits, transfers, adjustments)';
COMMENT ON TABLE logistica.detalle_movimiento IS 'Movement line items with product quantities and prices';

COMMENT ON COLUMN logistica.movimiento.tipo_movimiento IS 'entrada=stock in, salida=stock out, transferencia=transfer between projects, ajuste=inventory adjustment';
COMMENT ON COLUMN logistica.movimiento.estado IS 'pendiente=pending approval, aprobado=approved, rechazado=rejected, completado=completed';
