-- ============================================================================
-- BitCorp ERP - Additional Provider Seed Data
-- Version: 1.0
-- Date: 2026-01-18
-- Description: Realistic Peruvian construction equipment providers for testing
-- ============================================================================

-- Insert additional providers (realistic Peruvian companies)
INSERT INTO proveedores.proveedor (
  legacy_id, 
  ruc, 
  razon_social, 
  nombre_comercial, 
  tipo_proveedor, 
  direccion, 
  telefono, 
  correo_electronico, 
  is_active
) VALUES
-- Heavy Equipment Rental Providers
(
  'PROV003',
  '20514738291',
  'FERREYROS S.A.A.',
  'Ferreyros',
  'equipment',
  'Av. Cristóbal de Peralta Norte 820, Monterrico, Santiago de Surco, Lima',
  '+51 1 626-4000',
  'ventas@ferreyros.com.pe',
  true
),
(
  'PROV004',
  '20100053807',
  'UNIMAQ S.A.',
  'Unimaq',
  'equipment',
  'Av. República de Panamá 3635, San Isidro, Lima',
  '+51 1 411-7100',
  'alquiler@unimaq.com.pe',
  true
),
(
  'PROV005',
  '20513094972',
  'MAQUINARIAS U&C S.A.C.',
  'Maquinarias U&C',
  'equipment',
  'Av. Angamos Este 2405, Surquillo, Lima',
  '+51 1 344-5566',
  'ventas@maquinariasuc.pe',
  true
),
(
  'PROV006',
  '20450089593',
  'DERCO PERÚ S.A.',
  'Derco',
  'equipment',
  'Av. Separadora Industrial 1531, Ate, Lima',
  '+51 1 317-8000',
  'corporativo@derco.com.pe',
  true
),
(
  'PROV007',
  '20100029937',
  'MOTORES DIESEL ANDINOS S.A.',
  'Modasa',
  'equipment',
  'Av. Industrial 1470, San Juan de Lurigancho, Lima',
  '+51 1 327-9400',
  'contacto@modasa.pe',
  true
),
(
  'PROV008',
  '20545692371',
  'EQUIMAC S.A.C.',
  'Equimac',
  'equipment',
  'Calle Los Talladores 268, Urb. El Artesano, Ate, Lima',
  '+51 1 349-1212',
  'alquiler@equimac.com.pe',
  true
),

-- Labor/Operator Providers
(
  'PROV009',
  '20520147893',
  'SERVICIOS Y OPERADORES DEL PERÚ S.A.C.',
  'ServiOper',
  'labor',
  'Jr. Mariano Santos 215, Cercado de Lima, Lima',
  '+51 1 426-7788',
  'rrhh@servioper.pe',
  true
),
(
  'PROV010',
  '20487234566',
  'OPERADORES ESPECIALIZADOS MINEROS S.R.L.',
  'OEM Peru',
  'labor',
  'Av. Javier Prado Este 5268, La Molina, Lima',
  '+51 1 437-1100',
  'contacto@oemperu.com',
  true
),

-- Parts and Service Providers
(
  'PROV011',
  '20412890456',
  'REPUESTOS CATERPILLAR DEL PERÚ S.A.C.',
  'Repuestos CAT',
  'parts',
  'Av. Argentina 3093, Carmen de la Legua, Callao',
  '+51 1 451-2424',
  'ventas@repuestoscat.pe',
  true
),
(
  'PROV012',
  '20503876192',
  'KOMATSU REPUESTOS Y SERVICIOS S.A.',
  'Komatsu Service',
  'parts',
  'Av. Nicolás Ayllón 2920, Ate, Lima',
  '+51 1 713-0909',
  'servicios@komatsu.pe',
  true
),

-- Fuel and Lubricant Providers
(
  'PROV013',
  '20100002994',
  'PETROPERÚ S.A.',
  'Petroperú',
  'fuel',
  'Av. Enrique Canaval Moreyra 150, San Isidro, Lima',
  '+51 1 614-5000',
  'ventas.corporativas@petroperu.com.pe',
  true
),
(
  'PROV014',
  '20332266951',
  'REPSOL COMERCIAL SAC',
  'Repsol',
  'fuel',
  'Av. Víctor Andrés Belaúnde 147, San Isidro, Lima',
  '+51 1 441-2828',
  'clientes.industriales@repsol.pe',
  true
),
(
  'PROV015',
  '20100073093',
  'PRIMAX S.A.',
  'Primax',
  'fuel',
  'Av. El Derby 254, Santiago de Surco, Lima',
  '+51 1 208-1800',
  'ventas.corporativas@primax.pe',
  true
);

-- Display success message
SELECT '✅ Additional provider seed data loaded successfully!' AS status,
       COUNT(*) AS total_providers_added
FROM proveedores.proveedor
WHERE legacy_id IN (
  'PROV003', 'PROV004', 'PROV005', 'PROV006', 'PROV007', 'PROV008',
  'PROV009', 'PROV010', 'PROV011', 'PROV012', 'PROV013', 'PROV014', 'PROV015'
);

-- Display provider summary by type
SELECT 
  tipo_proveedor AS provider_type,
  COUNT(*) AS count
FROM proveedores.proveedor
WHERE is_active = true
GROUP BY tipo_proveedor
ORDER BY tipo_proveedor;

-- Display all active providers
SELECT 
  id,
  ruc,
  razon_social,
  nombre_comercial,
  tipo_proveedor,
  telefono
FROM proveedores.proveedor
WHERE is_active = true
ORDER BY tipo_proveedor, razon_social;
