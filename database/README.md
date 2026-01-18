# BitCorp ERP - Database Migrations

## Overview

This directory contains SQL migration scripts for the BitCorp ERP database schema and seed data.

**Database**: `bitcorp_dev` (PostgreSQL 15.x)  
**Docker Container**: `bitcorp-postgres-dev`  
**Connection**: `bitcorp:dev_password_change_me@localhost:3440`

---

## Migration Files

### Schema Migrations

| File                                    | Version | Description                                                      | Status     |
| --------------------------------------- | ------- | ---------------------------------------------------------------- | ---------- |
| `001_init_schema.sql`                   | 1.0     | Initial database schema (all modules)                            | ✅ Applied |
| `002_seed.sql`                          | 5.0     | Comprehensive seed data (system, projects, equipment, operators) | ✅ Applied |
| `003_seed_additional_providers.sql`     | 1.0     | Additional realistic Peruvian provider data                      | ✅ Applied |
| `004_seed_additional_equipment.sql`     | 1.0     | Additional construction equipment across all categories          | ✅ Applied |
| `005_seed_additional_contracts.sql`     | 1.0     | Comprehensive equipment contracts with various pricing models    | ✅ Applied |
| `006_seed_additional_daily_reports.sql` | 1.0     | Comprehensive daily reports (partes diarios) for usage tracking  | ✅ Applied |
| `007_seed_january_2026_valuations.sql`  | 1.0     | Monthly valuations for January 2026 based on daily reports       | ✅ Applied |
| `012_add_user_project_assignments.sql`  | N/A     | User-project assignments (WIP - not applied)                     | ⏸️ Pending |

---

## Migration 006: Additional Daily Reports Seed Data

**Date**: 2026-01-18  
**Purpose**: Add comprehensive daily reports (partes diarios) covering all contracted equipment for the last 30 days

### Daily Reports Added (73 new reports)

#### Report Distribution Overview

```sql
Total Daily Reports: 79 (6 original + 73 new)
Date Range: 2025-12-17 to 2026-01-18 (32 days)
Equipment Coverage: 18/18 contracted equipment items (100%)

Reports by Status:
├── APROBADO (Approved): 56 reports (70.89%)
├── ENVIADO (Submitted): 15 reports (18.99%)
└── BORRADOR (Draft): 8 reports (10.13%)

Reports by Equipment Category:
├── Excavators: 32 reports (6 equipment items)
├── Loaders: 14 reports (3 equipment items)
├── Trucks: 14 reports (4 equipment items)
├── Tractors: 11 reports (3 equipment items)
├── Compactor: 4 reports (1 equipment item)
└── Grader: 4 reports (1 equipment item)
```

#### Equipment Report Counts

| Equipment Code | Category       | Contract      | Reports | Avg Hours | Avg Fuel |
| -------------- | -------------- | ------------- | ------- | --------- | -------- |
| EXC-002        | Excavadora     | CONT-2025-004 | 7       | 10.0      | 48.6 L   |
| EXC-004        | Excavadora     | CONT-2025-006 | 7       | 9.9       | 47.6 L   |
| EXC-003        | Excavadora     | CONT-2025-005 | 6       | 9.3       | 45.1 L   |
| EXC-006        | Excavadora     | CONT-2025-007 | 6       | 9.4       | 49.7 L   |
| CAR-001        | Cargador       | CONT-2025-008 | 5       | 10.1      | 53.4 L   |
| CAR-002        | Cargador       | CONT-2025-009 | 5       | 9.8       | 50.8 L   |
| TRA-002        | Tractor        | CONT-2025-013 | 5       | 10.2      | 56.6 L   |
| VOL-002        | Volquete       | CONT-2025-011 | 5       | 10.1      | 71.0 L   |
| VOL-003        | Volquete       | CONT-2025-012 | 5       | 9.8       | 72.2 L   |
| CAR-003        | Cargador       | CONT-2025-010 | 4       | 10.3      | 50.5 L   |
| COM-001        | Compactador    | CONT-2025-015 | 4       | 9.9       | 37.8 L   |
| MOT-001        | Motoniveladora | CONT-2025-016 | 4       | 10.3      | 46.3 L   |
| TRA-003        | Tractor        | CONT-2025-014 | 4       | 10.1      | 59.0 L   |
| EXC-001        | Excavadora     | CONT-2025-001 | 3       | 9.5       | 46.5 L   |
| EXC-005        | Excavadora     | CONT-2024-087 | 3       | 9.8       | 46.7 L   |
| VOL-004        | Volquete       | CONT-2024-095 | 3       | 9.5       | 70.3 L   |
| TRA-001        | Tractor        | CONT-2025-002 | 2       | 10.8      | 56.5 L   |
| VOL-001        | Volquete       | CONT-2025-003 | 1       | 8.0       | 68.0 L   |

#### Report Characteristics

**Work Hours Distribution**:

- Typical shift: 8-12 hours/day
- Average hours worked: 9.82 hours/day
- Range: 6.0 hours (standby day) to 11.0 hours (overtime)

**Fuel Consumption by Category**:

- Excavators: 47.6 L/day average (range: 30-58 L)
- Loaders: 51.6 L/day average (range: 46-58 L)
- Tractors: 57.5 L/day average (range: 52-64 L)
- Trucks: 71.1 L/day average (range: 65-78 L)
- Compactors: 37.8 L/day average (range: 35-40 L)
- Graders: 46.3 L/day average (range: 42-50 L)

**Horometer/Odometer Progression**:

- Excavators: Progressive horometer tracking (e.g., EXC-002: 8500→8569 hrs)
- Loaders: Progressive horometer tracking (e.g., CAR-001: 4800→4851 hrs)
- Trucks: Progressive odometer tracking (e.g., VOL-002: 145000→146380 km)
- Tractors: Progressive horometer tracking (e.g., TRA-002: 7800→7851 hrs)

**Special Scenarios Included**:

- ✅ Standby days (reduced hours due to weather)
- ✅ Maintenance days (partial work hours)
- ✅ Overtime shifts (11+ hours)
- ✅ Historical data (finalized contracts: EXC-005, VOL-004)
- ✅ Various work shifts (morning/afternoon)

### How to Apply This Migration

```bash
# From project root directory
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/006_seed_additional_daily_reports.sql
```

### Verification Queries

```sql
-- Total daily reports count
SELECT COUNT(*) as total_reports FROM equipo.parte_diario;
-- Expected: 79

-- Reports by equipment
SELECT e.codigo_equipo, e.categoria, COUNT(pd.id) as report_count
FROM equipo.equipo e
LEFT JOIN equipo.parte_diario pd ON e.id = pd.equipo_id
WHERE e.id IN (SELECT equipo_id FROM equipo.contrato_adenda WHERE estado IN ('ACTIVO', 'FINALIZADO'))
GROUP BY e.codigo_equipo, e.categoria
ORDER BY report_count DESC, e.codigo_equipo;

-- Reports by status
SELECT estado, COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipo.parte_diario), 2) as percentage
FROM equipo.parte_diario
GROUP BY estado
ORDER BY count DESC;

-- Reports by date range (weekly)
SELECT DATE_TRUNC('week', fecha)::date as week_start, COUNT(*) as reports
FROM equipo.parte_diario
GROUP BY week_start
ORDER BY week_start DESC;

-- Average hours and fuel by equipment category
SELECT e.categoria,
       ROUND(AVG(pd.horas_trabajadas)::numeric, 2) as avg_hours,
       ROUND(AVG(pd.combustible_consumido)::numeric, 2) as avg_fuel
FROM equipo.parte_diario pd
JOIN equipo.equipo e ON pd.equipo_id = e.id
WHERE pd.horas_trabajadas IS NOT NULL
GROUP BY e.categoria
ORDER BY e.categoria;

-- Equipment without reports (should be empty after migration)
SELECT e.codigo_equipo, e.categoria, ca.numero_contrato
FROM equipo.equipo e
INNER JOIN equipo.contrato_adenda ca ON e.id = ca.equipo_id
LEFT JOIN equipo.parte_diario pd ON e.id = pd.equipo_id
WHERE ca.estado IN ('ACTIVO', 'FINALIZADO')
  AND pd.id IS NULL
GROUP BY e.codigo_equipo, e.categoria, ca.numero_contrato;
-- Expected: 0 rows
```

### Rollback Instructions

```sql
-- Remove all daily reports added in migration 006
-- (Keep original 6 reports: IDs 1-6)
DELETE FROM equipo.parte_diario WHERE id > 6;

-- Or safer rollback based on date range:
DELETE FROM equipo.parte_diario
WHERE fecha BETWEEN '2025-12-17' AND '2026-01-18'
  AND id NOT IN (1, 2, 3, 4, 5, 6);

-- Verify rollback
SELECT COUNT(*) FROM equipo.parte_diario;
-- Should return 6 (original reports)
```

### Impact on Valuation System

This migration enables:

- ✅ **Monthly Valuation Calculations**: Sufficient data for January 2026 valorization
- ✅ **Equipment Usage Analysis**: Track actual vs contracted hours
- ✅ **Fuel Cost Tracking**: Monitor fuel consumption patterns
- ✅ **Billing Preparation**: Generate invoices based on hourly usage
- ✅ **Historical Reporting**: Compare current vs previous month performance
- ✅ **Operator Performance**: Track equipment productivity by operator

### Next Steps

With daily reports in place, the system can now:

1. Calculate monthly equipment valuations (valorizaciones)
2. Generate equipment utilization reports
3. Track fuel efficiency metrics
4. Compare budgeted vs actual equipment costs
5. Prepare client billing based on actual usage

---

## Migration 005: Additional Contract Seed Data

**Date**: 2026-01-18  
**Purpose**: Add comprehensive equipment contract seed data covering various pricing models and scenarios

### Contracts Added (15 new contracts)

#### Contract Distribution by Equipment Category

```sql
Total Contracts: 19 items (4 original + 15 new)
├── Excavators: 7 contracts (37%)
├── Loaders: 3 contracts (16%)
├── Trucks: 4 contracts (21%)
├── Tractors/Bulldozers: 3 contracts (16%)
├── Compactors: 1 contract (5%)
└── Motor Graders: 1 contract (5%)
```

#### Contracts by Pricing Model

| Pricing Model          | Count | Percentage | Typical Use Case                    |
| ---------------------- | ----- | ---------- | ----------------------------------- |
| POR_HORA (Hourly Rate) | 11    | 58%        | Standard equipment rental           |
| TARIFA_FIJA_MENSUAL    | 6     | 32%        | Long-term projects with predictable |
| (Monthly Flat Rate)    |       |            | usage                               |
| POR_DIA (Daily Rate)   | 2     | 10%        | Trucks and transport equipment      |

#### Contracts by Status

| Status         | Count | Description                           |
| -------------- | ----- | ------------------------------------- |
| **ACTIVO**     | 17    | Active contracts in effect            |
| **FINALIZADO** | 2     | Completed contracts (historical data) |

#### Contracts by Modality

| Modality                            | Count | Description                                |
| ----------------------------------- | ----- | ------------------------------------------ |
| ALQUILER CON OPERADOR               | 10    | Equipment with certified operator          |
| ALQUILER CON OPERADOR Y COMBUSTIBLE | 6     | Full service (equipment + operator + fuel) |
| ALQUILER SOLO EQUIPO                | 3     | Equipment only (client provides operator)  |

### Detailed Contract Listing

#### Excavator Contracts (5 new)

1. **CONT-2025-004** - CAT 336 (EXC-002)
   - Type: POR_HORA (S/ 280/hour)
   - Duration: 2025-02-01 to 2025-12-31 (11 months)
   - Modality: With operator
   - Status: ACTIVO

2. **CONT-2025-005** - Komatsu PC200-8 (EXC-003)
   - Type: POR_HORA (S/ 220/hour)
   - Duration: 2025-03-01 to 2025-08-31 (6 months)
   - Modality: Equipment only (no operator)
   - Status: ACTIVO

3. **CONT-2025-006** - CAT 320D2 (EXC-004)
   - Type: TARIFA_FIJA_MENSUAL (S/ 45,000/month)
   - Duration: 2025-02-15 to 2025-07-15 (5 months)
   - Includes: 200 hours/month, operator, fuel, maintenance
   - Status: ACTIVO

4. **CONT-2024-087** - Hyundai R210LC-9 (EXC-005)
   - Type: POR_HORA (S/ 240/hour)
   - Duration: 2024-09-01 to 2024-12-31 (completed)
   - Status: FINALIZADO

5. **CONT-2025-007** - Komatsu PC300-8 (EXC-006)
   - Type: POR_HORA (S/ 300/hour + S/ 50/hour fuel)
   - Duration: 2025-02-10 to 2025-11-10 (9 months)
   - Status: ACTIVO

#### Loader Contracts (3 new)

6. **CONT-2025-008** - CAT 950GC (CAR-001)
   - Type: POR_HORA (S/ 260/hour)
   - Duration: 2025-01-20 to 2025-12-20 (11 months)
   - Status: ACTIVO

7. **CONT-2025-009** - Komatsu WA380-8 (CAR-002)
   - Type: TARIFA_FIJA_MENSUAL (S/ 38,000/month)
   - Includes: 180 hours/month, S/ 75/hour penalty for excess
   - Duration: 2025-02-20 to 2025-08-20 (6 months)
   - Modality: Equipment only
   - Status: ACTIVO

8. **CONT-2025-010** - John Deere 544K (CAR-003)
   - Type: POR_HORA (S/ 250/hour)
   - Duration: 2025-03-15 to 2025-09-15 (6 months)
   - Status: ACTIVO

#### Truck Contracts (3 new)

9. **CONT-2025-011** - Volvo FM440 (VOL-002)
   - Type: POR_DIA (S/ 1,200/day)
   - Includes: Driver, fuel, max 200 km/day (S/ 3/km excess)
   - Duration: 2025-02-01 to 2025-07-31 (6 months)
   - Status: ACTIVO

10. **CONT-2025-012** - Mercedes-Benz Actros (VOL-003)
    - Type: TARIFA_FIJA_MENSUAL (S/ 32,000/month)
    - Includes: Driver, fuel, maintenance, 22 days/month
    - Duration: 2025-03-01 to 2025-12-31 (10 months)
    - Status: ACTIVO

11. **CONT-2024-095** - Scania P410B (VOL-004)
    - Type: POR_DIA (S/ 1,100/day)
    - Duration: 2024-10-01 to 2024-12-31 (completed)
    - Status: FINALIZADO

#### Tractor Contracts (2 new)

12. **CONT-2025-013** - CAT D6T XL (TRA-002)
    - Type: POR_HORA (S/ 320/hour)
    - Duration: 2025-02-15 to 2025-11-15 (9 months)
    - Status: ACTIVO

13. **CONT-2025-014** - Komatsu D85EX-18 (TRA-003)
    - Type: TARIFA_FIJA_MENSUAL (S/ 52,000/month)
    - Includes: 220 hours/month, operator, fuel, maintenance
    - Duration: 2025-02-25 to 2025-08-25 (6 months)
    - Status: ACTIVO

#### Compactor Contract (1 new)

14. **CONT-2025-015** - CAT CS54B (COM-001)
    - Type: POR_HORA (S/ 180/hour)
    - Modality: Equipment only
    - Duration: 2025-03-01 to 2025-09-30 (7 months)
    - Status: ACTIVO

#### Motor Grader Contract (1 new)

15. **CONT-2025-016** - CAT 140M (MOT-001)
    - Type: TARIFA_FIJA_MENSUAL (S/ 48,000/month)
    - Includes: 200 hours/month, specialized operator, fuel, maintenance
    - Duration: 2025-02-20 to 2025-12-20 (10 months)
    - Status: ACTIVO

### Database Statistics After Migration

```sql
Total Contracts: 19 (4 original + 15 new)
├── Active Contracts: 17 (89%)
└── Finalized Contracts: 2 (11%)

Equipment with Contracts: 16 items (70% of fleet)
Equipment without Contracts: 7 items (30% of fleet)

Pricing Models:
├── Hourly (POR_HORA): 11 contracts (58%)
├── Monthly Flat (TARIFA_FIJA_MENSUAL): 6 contracts (32%)
└── Daily (POR_DIA): 2 contracts (10%)

Average Hourly Rate: S/ 264/hour
Average Monthly Rate: S/ 43,000/month
Average Daily Rate: S/ 1,150/day
```

### How to Apply This Migration

```bash
# From project root directory
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/005_seed_additional_contracts.sql
```

### Verification Queries

```sql
-- Count contracts by pricing model
SELECT tipo_tarifa, COUNT(*) as total
FROM equipo.contrato_adenda
GROUP BY tipo_tarifa
ORDER BY total DESC;

-- Count contracts by status
SELECT estado, COUNT(*) as total
FROM equipo.contrato_adenda
GROUP BY estado
ORDER BY total DESC;

-- Equipment with contract counts
SELECT
  e.codigo_equipo,
  e.marca,
  e.modelo,
  COUNT(c.id) as contract_count
FROM equipo.equipo e
LEFT JOIN equipo.contrato_adenda c ON e.id = c.equipo_id
GROUP BY e.id, e.codigo_equipo, e.marca, e.modelo
ORDER BY contract_count DESC, e.codigo_equipo;

-- Active contracts with details
SELECT
  c.numero_contrato,
  e.codigo_equipo,
  e.marca,
  e.modelo,
  c.tipo_tarifa,
  c.tarifa,
  c.modalidad,
  c.fecha_inicio,
  c.fecha_fin
FROM equipo.contrato_adenda c
JOIN equipo.equipo e ON c.equipo_id = e.id
WHERE c.estado = 'ACTIVO'
ORDER BY c.fecha_inicio DESC;

-- Equipment without contracts (available for new contracts)
SELECT
  e.codigo_equipo,
  e.marca,
  e.modelo,
  e.categoria,
  e.estado
FROM equipo.equipo e
LEFT JOIN equipo.contrato_adenda c ON e.id = c.equipo_id
WHERE c.id IS NULL
  AND e.is_active = true
ORDER BY e.categoria, e.codigo_equipo;
```

### Rollback Instructions

```sql
-- Remove contracts added in migration 005
DELETE FROM equipo.contrato_adenda WHERE numero_contrato IN (
  'CONT-2025-004', 'CONT-2025-005', 'CONT-2025-006', 'CONT-2025-007',
  'CONT-2025-008', 'CONT-2025-009', 'CONT-2025-010', 'CONT-2025-011',
  'CONT-2025-012', 'CONT-2024-095', 'CONT-2025-013', 'CONT-2025-014',
  'CONT-2025-015', 'CONT-2025-016', 'CONT-2024-087'
);

-- Verify rollback
SELECT COUNT(*) FROM equipo.contrato_adenda;
-- Should return 4 (original contracts)
```

### Contract Features Included

All contracts include realistic features:

- ✅ **Multiple Pricing Models**: Hourly, daily, and monthly flat rates
- ✅ **Various Modalities**: With/without operator, with/without fuel
- ✅ **Realistic Rates**: Based on actual Peruvian market rates (2025)
- ✅ **Special Conditions**: Included hours, penalty rates, minimum charges
- ✅ **Contract Duration**: Short-term (3-6 months) and long-term (10-12 months)
- ✅ **Historical Data**: 2 finalized contracts for testing reports
- ✅ **Additional Costs**: Fuel surcharges, excess hour penalties

---

## Migration 004: Additional Equipment Seed Data

**Date**: 2026-01-18  
**Purpose**: Add realistic construction equipment fleet for comprehensive testing

### Equipment Added (20 new items)

#### Equipment Distribution by Category

```sql
Total Equipment: 23 items (3 original + 20 new)
├── Excavators (EXCAVADORA): 6 items
├── Loaders (CARGADOR_FRONTAL): 3 items
├── Dump Trucks (VOLQUETE): 5 items
├── Bulldozers (TRACTOR): 4 items
├── Compactors (COMPACTADOR): 2 items
├── Motor Graders (MOTONIVELADORA): 2 items
└── Crane (GRUA): 1 item
```

#### Equipment by Provider

| Provider               | Equipment Count | Brands                   |
| ---------------------- | --------------- | ------------------------ |
| FERREYROS S.A.A.       | 7 items         | Caterpillar (all CAT)    |
| MAQUINARIAS U&C S.A.C. | 6 items         | Mixed (Hyundai, JD, etc) |
| UNIMAQ S.A.            | 5 items         | Komatsu (all)            |
| DERCO PERÚ S.A.        | 2 items         | Volvo trucks             |

#### Excavators (6 items)

1. **EXC-002** - Caterpillar 336 (268 HP, 2019) - FERREYROS
2. **EXC-003** - Komatsu PC200-8 (148 HP, 2020) - UNIMAQ
3. **EXC-004** - Caterpillar 320D2 (158 HP, 2021) - FERREYROS
4. **EXC-005** - Hyundai R210LC-9 (161 HP, 2018) - MAQUINARIAS U&C
5. **EXC-006** - Komatsu PC300-8 (215 HP, 2019) - UNIMAQ

#### Loaders (3 items)

6. **CAR-001** - Caterpillar 950GC (189 HP, 2020) - FERREYROS
7. **CAR-002** - Komatsu WA380-8 (196 HP, 2021) - UNIMAQ
8. **CAR-003** - John Deere 544K (164 HP, 2019) - MAQUINARIAS U&C

#### Dump Trucks (4 items)

9. **VOL-002** - Volvo FM440 (440 HP, Placa AYU-823, 2020) - DERCO
10. **VOL-003** - Mercedes-Benz Actros 4144K (435 HP, Placa BRT-941, 2019) - MAQUINARIAS U&C
11. **VOL-004** - Scania P410B8x4 (410 HP, Placa CWM-752, 2021) - MAQUINARIAS U&C
12. **VOL-005** - Volvo FMX500 (500 HP, Placa DLT-368, 2022) - DERCO

#### Bulldozers/Tractors (3 items)

13. **TRA-002** - Caterpillar D6T XL (215 HP, 2020) - FERREYROS
14. **TRA-003** - Komatsu D85EX-18 (264 HP, 2021) - UNIMAQ
15. **TRA-004** - Caterpillar D8T (310 HP, 2019) - FERREYROS

#### Compactors (2 items)

16. **COM-001** - Caterpillar CS54B (130 HP, 2020) - FERREYROS
17. **COM-002** - Dynapac CA2500D (99 HP, 2019) - MAQUINARIAS U&C

#### Motor Graders (2 items)

18. **MOT-001** - Caterpillar 140M (190 HP, 2020) - FERREYROS
19. **MOT-002** - Komatsu GD655-6 (197 HP, 2021) - UNIMAQ

#### Crane (1 item)

20. **GRU-001** - Liebherr LTM 1100-5.2 (536 HP, Placa FRM-489, 2018) - MAQUINARIAS U&C

### Database Statistics After Migration

```sql
Total Equipment: 23 items (3 original seed + 20 new)
Equipment by Estado: 23 DISPONIBLE (100%)
Equipment Years: 2018-2022 (realistic fleet age)
Equipment with Placas: 8 items (trucks, crane)
Equipment with Providers: 20 items (87%)
```

### How to Apply This Migration

```bash
# From project root directory
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/004_seed_additional_equipment.sql
```

### Verification Queries

```sql
-- Count equipment by category
SELECT categoria, COUNT(*) as total
FROM equipo.equipo
WHERE is_active = true
GROUP BY categoria
ORDER BY categoria;

-- List all equipment with provider names
SELECT
    e.codigo_equipo,
    e.categoria,
    e.marca,
    e.modelo,
    e.anio_fabricacion,
    p.razon_social as proveedor,
    e.estado
FROM equipo.equipo e
LEFT JOIN proveedores.proveedor p ON e.proveedor_id = p.id
WHERE e.is_active = true
ORDER BY e.categoria, e.codigo_equipo;

-- Count equipment by provider
SELECT
    p.razon_social,
    COUNT(*) as total_equipos
FROM equipo.equipo e
INNER JOIN proveedores.proveedor p ON e.proveedor_id = p.id
WHERE e.is_active = true
GROUP BY p.razon_social
ORDER BY total_equipos DESC;

-- Check equipment years distribution
SELECT
    anio_fabricacion,
    COUNT(*) as count
FROM equipo.equipo
WHERE is_active = true AND anio_fabricacion IS NOT NULL
GROUP BY anio_fabricacion
ORDER BY anio_fabricacion DESC;
```

### Equipment Technical Details

All equipment includes:

- ✅ Realistic serial numbers (format: `BRAND+MODEL+SERIAL`)
- ✅ Engine specifications (modelo, potencia_neta, tipo_motor)
- ✅ Manufacturing years (2018-2022 range)
- ✅ Proper categorization (categoria field)
- ✅ Provider assignment (FERREYROS→CAT, UNIMAQ→Komatsu, etc.)
- ✅ Measurement type (horometro for heavy equipment, odometro for trucks)

### Rollback Instructions

```sql
-- Remove equipment added in migration 004
DELETE FROM equipo.equipo
WHERE codigo_equipo IN (
    'EXC-002', 'EXC-003', 'EXC-004', 'EXC-005', 'EXC-006',
    'CAR-001', 'CAR-002', 'CAR-003',
    'VOL-002', 'VOL-003', 'VOL-004', 'VOL-005',
    'TRA-002', 'TRA-003', 'TRA-004',
    'COM-001', 'COM-002',
    'MOT-001', 'MOT-002',
    'GRU-001'
);

-- Verify rollback
SELECT COUNT(*) FROM equipo.equipo WHERE is_active = true;
-- Should return 3 (original equipment)
```

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

## Migration 007: January 2026 Monthly Valuations Seed Data

**Date**: 2026-01-18  
**Purpose**: Create monthly valuation records (valorizaciones) for January 2026 based on daily reports (partes diarios)

### Valuations Added (16 new valuations)

#### Valuation Distribution Overview

```sql
Total Valuations: 19 (3 existing + 16 new)
Period: January 2026 ('2026-01')
Equipment Coverage: 16/18 contracted equipment (88.89%)

Valuations by Status:
├── APROBADO (Approved): 12 valuations (75.00%)
├── PENDIENTE (Pending): 3 valuations (18.75%)
└── EN_REVISION (Under Review): 1 valuation (6.25%)

Valuations by Contract Type:
├── Hourly (POR_HORA): 10 valuations
├── Monthly Flat Rate (TARIFA_FIJA_MENSUAL): 5 valuations
└── Daily Rate (POR_DIA): 1 valuation
```

#### Financial Summary

| Metric                  | Value        | Details                                |
| ----------------------- | ------------ | -------------------------------------- |
| **Total Hours Worked**  | 477.00 hours | Across 16 equipment items              |
| **Total Fuel Consumed** | 2,553.50 L   | Diesel fuel for equipment operations   |
| **Base Cost**           | PEN 307,030  | Equipment rental charges               |
| **Fuel Cost**           | PEN 38,303   | Fuel reimbursement @ PEN 15/liter      |
| **Total Valorized**     | PEN 345,333  | Base + Fuel costs                      |
| **IGV (18%)**           | PEN 62,160   | Peruvian sales tax                     |
| **Total with Tax**      | PEN 407,492  | Final billable amount for January 2026 |

#### Valuations by Equipment

| Equipment Code | Valuation Number | Contract Type | Hours | Total Cost | Status      |
| -------------- | ---------------- | ------------- | ----- | ---------- | ----------- |
| EXC-001        | VAL-2026-01-001  | Hourly        | 28.5  | 12,923     | APROBADO    |
| TRA-001        | VAL-2026-01-002  | Hourly        | 21.5  | 10,725     | APROBADO    |
| EXC-002        | VAL-2026-01-003  | Hourly        | 38.5  | 13,645     | APROBADO    |
| EXC-003        | VAL-2026-01-004  | Hourly        | 30.5  | 8,938      | APROBADO    |
| EXC-006        | VAL-2026-01-005  | Hourly        | 37.5  | 14,220     | APROBADO    |
| CAR-001        | VAL-2026-01-006  | Hourly        | 31.5  | 10,665     | PENDIENTE   |
| CAR-003        | VAL-2026-01-007  | Hourly        | 31.0  | 10,060     | APROBADO    |
| TRA-002        | VAL-2026-01-008  | Hourly        | 31.5  | 12,720     | APROBADO    |
| COM-001        | VAL-2026-01-009  | Hourly        | 29.5  | 7,005      | APROBADO    |
| VOL-001        | VAL-2026-01-010  | Monthly       | 8.0   | 9,520      | APROBADO    |
| EXC-004        | VAL-2026-01-011  | Monthly       | 37.5  | 47,753     | APROBADO    |
| CAR-002        | VAL-2026-01-012  | Monthly       | 28.5  | 40,250     | PENDIENTE   |
| VOL-003        | VAL-2026-01-013  | Monthly       | 30.0  | 35,270     | APROBADO    |
| TRA-003        | VAL-2026-01-014  | Monthly       | 30.5  | 54,670     | APROBADO    |
| MOT-001        | VAL-2026-01-015  | Monthly       | 31.0  | 50,100     | EN_REVISION |
| VOL-002        | VAL-2026-01-016  | Daily         | 31.5  | 6,870      | PENDIENTE   |

#### Daily Reports Linkage

- **Total Daily Reports**: 79 reports
- **Linked to Valuations**: 48 reports (60.76%)
- **Unlinked**: 31 reports (39.24%)
  - 27 reports from December 2025 (no valuations yet)
  - 4 reports from equipment without January valuations

### Cost Calculation Logic

#### Hourly Contracts (POR_HORA)

```
Formula: hours_worked × hourly_rate
Example (EXC-001): 28.5 hours × PEN 380/hour = PEN 10,830
Fuel: 139.5 liters × PEN 15/liter = PEN 2,093
Total: PEN 12,923
```

#### Monthly Flat Rate (TARIFA_FIJA_MENSUAL)

```
Formula: monthly_flat_rate (regardless of hours if within limit)
Example (EXC-004): PEN 45,000/month (200 hours included)
  Actual hours: 37.5 (within limit)
  Base cost: PEN 45,000
  Fuel: 183.5 liters × PEN 15/liter = PEN 2,753
  Total: PEN 47,753
```

#### Daily Rate (POR_DIA)

```
Formula: days_worked × daily_rate
Example (VOL-002): 3 days × PEN 1,200/day = PEN 3,600
Fuel: 218 liters × PEN 15/liter = PEN 3,270
Total: PEN 6,870
```

### How to Apply Migration 007

```bash
# Apply migration
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/007_seed_january_2026_valuations.sql

# Verify application
docker exec bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev -c "SELECT COUNT(*) FROM equipo.valorizacion_equipo WHERE periodo = '2026-01';"
# Expected: 16
```

### Verification Queries

#### Count Valuations

```sql
-- Total valuations
SELECT COUNT(*) as total_valuations FROM equipo.valorizacion_equipo;
-- Expected: 19 (3 existing + 16 new)

-- January 2026 only
SELECT COUNT(*) as january_valuations
FROM equipo.valorizacion_equipo
WHERE periodo = '2026-01';
-- Expected: 16
```

#### Valuation Status Distribution

```sql
SELECT estado, COUNT(*) as count
FROM equipo.valorizacion_equipo
WHERE periodo = '2026-01'
GROUP BY estado
ORDER BY estado;

-- Expected Results:
-- APROBADO: 12
-- EN_REVISION: 1
-- PENDIENTE: 3
```

#### Financial Totals

```sql
SELECT
  periodo,
  COUNT(DISTINCT equipo_id) as equipment_count,
  ROUND(SUM(horas_trabajadas), 2) as total_hours,
  ROUND(SUM(combustible_consumido), 2) as total_fuel,
  TO_CHAR(SUM(costo_base), 'FM999,999,999.00') as total_base_cost,
  TO_CHAR(SUM(costo_combustible), 'FM999,999.00') as total_fuel_cost,
  TO_CHAR(SUM(total_valorizado), 'FM999,999,999.00') as total_valorized,
  TO_CHAR(SUM(total_con_igv), 'FM999,999,999.00') as total_with_tax
FROM equipo.valorizacion_equipo
WHERE periodo = '2026-01'
GROUP BY periodo;

-- Expected: 16 equipment, 477 hours, 2,554 liters fuel
--           PEN 307,030 base cost, PEN 345,333 total
```

#### Daily Reports Linkage

```sql
SELECT
  COUNT(*) as total_reports,
  COUNT(valorizacion_id) as linked_reports,
  COUNT(*) - COUNT(valorizacion_id) as unlinked_reports
FROM equipo.parte_diario;

-- Expected: 79 total, 48 linked, 31 unlinked
```

#### Equipment Valuation Details

```sql
SELECT
  e.codigo_equipo,
  v.numero_valorizacion,
  v.horas_trabajadas,
  TO_CHAR(v.total_valorizado, 'FM999,999.00') as total_valorizado,
  v.estado
FROM equipo.equipo e
JOIN equipo.valorizacion_equipo v ON e.id = v.equipo_id
WHERE v.periodo = '2026-01'
ORDER BY e.codigo_equipo;
```

### Rollback Instructions

```sql
-- Remove valuation links from daily reports
UPDATE equipo.parte_diario
SET valorizacion_id = NULL
WHERE valorizacion_id IN (
  SELECT id FROM equipo.valorizacion_equipo WHERE periodo = '2026-01'
);

-- Delete January 2026 valuations
DELETE FROM equipo.valorizacion_equipo WHERE periodo = '2026-01';

-- Verify rollback
SELECT COUNT(*) FROM equipo.valorizacion_equipo WHERE periodo = '2026-01';
-- Expected: 0
```

### Impact on Business Operations

With January 2026 valuations added, the system can now:

1. **Monthly Billing**: Generate invoices for clients based on equipment usage
2. **Cost Analysis**: Track actual costs vs contracted rates
3. **Profit Margins**: Calculate profitability per equipment and contract
4. **Cash Flow**: Project monthly revenue from active contracts
5. **Financial Reports**:
   - Equipment utilization rates
   - Revenue by equipment category
   - Cost per hour/day comparisons
6. **Approval Workflow**: Test supervisor/finance approval processes
7. **Payment Tracking**: Monitor payment status per valuation

### Notes

- **Fuel Cost Assumption**: PEN 15/liter (market rate as of January 2026)
- **Exchange Rate**: USD 1 = PEN 3.75 (for contracts in dollars)
- **IGV Rate**: 18% (Peruvian sales tax)
- **Partial Month Handling**: Monthly contracts charge full rate even for partial usage (contract terms)
- **Equipment Not Valuated**: 2 equipment items (EXC-005, GRA-001) have no January reports yet

---

## Next Migrations (Planned)

- `008_seed_additional_operators.sql` - Operator certifications and licenses
- `009_add_equipment_maintenance_history.sql` - Maintenance records and schedules
- `010_add_audit_triggers.sql` - Automatic audit logging for sensitive tables

---

## Contact

For migration issues or questions, contact the development team.

**Last Updated**: 2026-01-18  
**Migration Version**: 007  
**Status**: ✅ All migrations applied successfully
