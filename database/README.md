# BitCorp ERP - Database Migrations

## Overview

This directory contains SQL migration scripts for the BitCorp ERP database schema and seed data.

**Database**: `bitcorp_dev` (PostgreSQL 15.x)  
**Docker Container**: `bitcorp-postgres-dev`  
**Connection**: `bitcorp:dev_password_change_me@localhost:3440`

---

## Migration Files

### Schema Migrations

| File                                   | Version | Description                                                      | Status     |
| -------------------------------------- | ------- | ---------------------------------------------------------------- | ---------- |
| `001_init_schema.sql`                  | 1.0     | Initial database schema (all modules)                            | ✅ Applied |
| `002_seed.sql`                         | 5.0     | Comprehensive seed data (system, projects, equipment, operators) | ✅ Applied |
| `003_seed_additional_providers.sql`    | 1.0     | Additional realistic Peruvian provider data                      | ✅ Applied |
| `012_add_user_project_assignments.sql` | N/A     | User-project assignments (WIP - not applied)                     | ⏸️ Pending |

---

## Migration 003: Additional Provider Seed Data

**Date**: 2026-01-18  
**Purpose**: Add realistic Peruvian construction equipment providers for testing

### Providers Added (13 new providers)

#### Equipment Rental Providers (6)

1. **FERREYROS S.A.A.** - `RUC: 20514738291`
   - Leading Caterpillar dealer in Peru
   - Phone: +51 1 626-4000
   - Address: Av. Cristóbal de Peralta Norte 820, Monterrico, Lima

2. **UNIMAQ S.A.** - `RUC: 20100053807`
   - Komatsu authorized dealer
   - Phone: +51 1 411-7100
   - Address: Av. República de Panamá 3635, San Isidro, Lima

3. **MAQUINARIAS U&C S.A.C.** - `RUC: 20513094972`
   - Heavy equipment rental and sales
   - Phone: +51 1 344-5566
   - Address: Av. Angamos Este 2405, Surquillo, Lima

4. **DERCO PERÚ S.A.** - `RUC: 20450089593`
   - Multi-brand equipment provider
   - Phone: +51 1 317-8000
   - Address: Av. Separadora Industrial 1531, Ate, Lima

5. **MOTORES DIESEL ANDINOS S.A.** (Modasa) - `RUC: 20100029937`
   - Diesel engines and heavy machinery
   - Phone: +51 1 327-9400
   - Address: Av. Industrial 1470, San Juan de Lurigancho, Lima

6. **EQUIMAC S.A.C.** - `RUC: 20545692371`
   - Equipment rental and maintenance
   - Phone: +51 1 349-1212
   - Address: Calle Los Talladores 268, Ate, Lima

#### Labor/Operator Providers (2)

7. **SERVICIOS Y OPERADORES DEL PERÚ S.A.C.** (ServiOper) - `RUC: 20520147893`
   - Specialized operators and labor
   - Phone: +51 1 426-7788
   - Address: Jr. Mariano Santos 215, Cercado de Lima

8. **OPERADORES ESPECIALIZADOS MINEROS S.R.L.** (OEM Peru) - `RUC: 20487234566`
   - Mining and construction operators
   - Phone: +51 1 437-1100
   - Address: Av. Javier Prado Este 5268, La Molina, Lima

#### Parts and Service Providers (2)

9. **REPUESTOS CATERPILLAR DEL PERÚ S.A.C.** - `RUC: 20412890456`
   - Caterpillar genuine parts
   - Phone: +51 1 451-2424
   - Address: Av. Argentina 3093, Carmen de la Legua, Callao

10. **KOMATSU REPUESTOS Y SERVICIOS S.A.** - `RUC: 20503876192`
    - Komatsu parts and service
    - Phone: +51 1 713-0909
    - Address: Av. Nicolás Ayllón 2920, Ate, Lima

#### Fuel and Lubricant Providers (3)

11. **PETROPERÚ S.A.** - `RUC: 20100002994`
    - State-owned petroleum company
    - Phone: +51 1 614-5000
    - Address: Av. Enrique Canaval Moreyra 150, San Isidro, Lima

12. **REPSOL COMERCIAL SAC** - `RUC: 20332266951`
    - Fuel and lubricants
    - Phone: +51 1 441-2828
    - Address: Av. Víctor Andrés Belaúnde 147, San Isidro, Lima

13. **PRIMAX S.A.** - `RUC: 20100073093`
    - Leading fuel distributor
    - Phone: +51 1 208-1800
    - Address: Av. El Derby 254, Santiago de Surco, Lima

### Database Statistics After Migration

```sql
Total Providers: 15
├── Equipment Providers: 8 (53%)
├── Fuel Providers: 3 (20%)
├── Labor Providers: 2 (13%)
└── Parts Providers: 2 (13%)
```

### How to Apply This Migration

```bash
# From project root directory
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/003_seed_additional_providers.sql
```

### Verification Queries

```sql
-- Count providers by type
SELECT
  tipo_proveedor AS provider_type,
  COUNT(*) AS count
FROM proveedores.proveedor
WHERE is_active = true
GROUP BY tipo_proveedor
ORDER BY tipo_proveedor;

-- List all active providers
SELECT
  id,
  ruc,
  razon_social,
  tipo_proveedor,
  telefono
FROM proveedores.proveedor
WHERE is_active = true
ORDER BY razon_social;

-- Check provider in equipment dropdown
SELECT
  p.id,
  p.razon_social,
  p.nombre_comercial,
  COUNT(e.id) AS equipment_count
FROM proveedores.proveedor p
LEFT JOIN equipo.equipo e ON e.proveedor_id = p.id
WHERE p.tipo_proveedor = 'equipment'
GROUP BY p.id, p.razon_social, p.nombre_comercial
ORDER BY equipment_count DESC, p.razon_social;
```

---

## RUC (Peruvian Tax ID) Format

All RUC numbers in seed data follow the official Peruvian format:

- **Format**: 11 digits
- **Structure**: `20XXXXXXXXX` (companies start with 20)
- **Example**: `20514738291` (Ferreyros S.A.A.)

All RUCs in this seed data are realistic and follow SUNAT (Peruvian tax authority) formatting rules.

---

## Migration Best Practices

1. **Always backup before migrations**:

   ```bash
   docker exec bitcorp-postgres-dev pg_dump -U bitcorp bitcorp_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations on development first**:
   - Apply to `bitcorp_dev` database first
   - Verify data integrity
   - Test affected frontend components
   - Check backend API responses

3. **Verify after migration**:
   - Run verification queries
   - Check foreign key constraints
   - Test API endpoints
   - Verify frontend displays correctly

4. **Document changes**:
   - Update this README
   - Add migration file with clear comments
   - Include rollback instructions if applicable

---

## Rollback Instructions

### Migration 003 Rollback

```sql
-- Remove providers added in migration 003
DELETE FROM proveedores.proveedor
WHERE legacy_id IN (
  'PROV003', 'PROV004', 'PROV005', 'PROV006', 'PROV007', 'PROV008',
  'PROV009', 'PROV010', 'PROV011', 'PROV012', 'PROV013', 'PROV014', 'PROV015'
);

-- Verify rollback
SELECT COUNT(*) FROM proveedores.proveedor WHERE is_active = true;
-- Should return 2 (original providers)
```

---

## Next Migrations (Planned)

- `004_add_equipment_gps_tracking.sql` - GPS location tracking for equipment
- `005_add_user_project_assignments.sql` - User-project many-to-many relationships
- `006_add_daily_reports_api.sql` - Daily reports API support
- `007_add_audit_triggers.sql` - Automatic audit logging

---

## Contact

For migration issues or questions, contact the development team.

**Last Updated**: 2026-01-18  
**Migration Version**: 003  
**Status**: ✅ All migrations applied successfully
