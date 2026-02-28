# WS-27 Fuel Cleanup + Manipuleo Config Design

Date: 2026-02-28

## Story A: WS-27 — Retire Orphaned Fuel Records Module

### Problem
`RegistroCombustible` / `FuelRecord` entity (`equipo.equipo_combustible`) has no API routes, no service, no DTO, no controller. WS-23 (Vales Combustible) fully supersedes it.

### Changes
1. **Delete** `backend/src/models/fuel-record.model.ts`
2. **Remove** import + entity from `backend/src/config/database.config.ts` (lines 47, 142)
3. **Remove** seeder usage from `backend/src/database/seeders/006-logistics-seeder.ts` (lines 3, 254+)
4. **Keep** `equipo.equipo_combustible` DB table (may contain historical data)
5. **Keep** `ExcessFuel` model (actively used in valuations — different concept)

### Risk
None. No routes, no service, no business logic depends on this model.

---

## Story B: Configurable Manipuleo Rate (Option A)

### Problem
`precioManipuleoCombustible = 0.8` hardcoded in 3 places:
- `backend/src/utils/valuation-pdf-transformer.ts` lines 141, 252
- `backend/src/services/valuation.service.ts` line 1885

PRD says "S/. 0.80 por galón (sin IGV)" — a company standard rate, not per-contract.

### Design
Follow the `PrecalentamientoConfig` pattern: one global config row per tenant.

#### New Entity: `equipo.configuracion_combustible`
```sql
CREATE TABLE equipo.configuracion_combustible (
  id SERIAL PRIMARY KEY,
  precio_manipuleo DECIMAL(10,2) NOT NULL DEFAULT 0.80,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES sistema.usuarios(id)
);
```

#### Migration
Timestamp: `1771965700000` (next in sequence after WS-35's 1771965600000)

#### Backend Files
- **Model**: `backend/src/models/combustible-config.model.ts`
- **Service**: `backend/src/services/combustible-config.service.ts`
  - `getConfig(tenantId)` — returns config or creates default (0.80)
  - `updateConfig(tenantId, precio)` — ADMIN only
  - `getManipuleoRate(tenantId)` — lightweight getter, cached
- **Controller/Routes**: `backend/src/api/combustible-config/` — GET + PUT (ADMIN only)
- **DTO**: `backend/src/types/dto/combustible-config.dto.ts`

#### Update Hardcoded References
Replace `const precioManipuleoCombustible = 0.8` with config lookup in:
1. `valuation-pdf-transformer.ts` — accept rate as parameter
2. `valuation.service.ts` — fetch from CombustibleConfigService

#### Seed Data
Insert default row: `precio_manipuleo = 0.80`

#### Frontend (optional, low priority)
Admin settings page to view/edit the rate. Can defer to later if desired.

### Risk
Low. The rate changes infrequently. Default of 0.80 preserves current behavior.
