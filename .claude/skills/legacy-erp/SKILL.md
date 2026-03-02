---
name: legacy-erp
description: Navigate the legacy JCA ERP VB.NET codebase to find field names, dropdown values, business rules, and SQL queries for feature parity
---

# Legacy ERP Navigation Map

**Codebase root**: `~/Drive/JCA ERP 20220120/`

## Module Prefix Map

| Code                 | Module    | Description                                     |
| -------------------- | --------- | ----------------------------------------------- |
| `000_Global`         | Shared    | Permissions, variables, utility functions       |
| `302_SST`            | Safety    | Inspections, incidents                          |
| `304_Administracion` | Admin     | Cost centers, accounts                          |
| `305_RRHH`           | HR        | Workers, operators                              |
| `306_Logistica`      | Logistics | Inventory, movements                            |
| `307_Proveedor`      | Suppliers | Provider management                             |
| `308_GEM`            | Equipment | Contracts, daily reports, valuations, equipment |

## File Naming Conventions

- **Forms**: `Frm_XXX_NNN_EntityName.vb` (code-behind) + `.Designer.vb` (layout/controls)
- **Modules**: `Mod_NNN_Name.vb` (shared utility modules)
- **Typed DataSets**: `dbAramsa_XXX_DataSet.Designer.vb` + TableAdapters

## Key 308_GEM Forms (Equipment Module)

| Form            | Entity           | What to look for                                                 |
| --------------- | ---------------- | ---------------------------------------------------------------- |
| `Frm_308_001_*` | Equipo           | Equipment master data, ComboBox items for categories             |
| `Frm_308_002_*` | Lista Equipos    | Equipment list, DataGridView columns, filters                    |
| `Frm_308_003_*` | Contrato/Adenda  | **Contract form** — modalidad, tipo_tarifa, minimo_por dropdowns |
| `Frm_308_005_*` | Parte Diario     | Daily report form, hour fields, event types                      |
| `Frm_308_006_*` | Valorización     | Valuation form, calculation rules, discount logic                |
| `Frm_308_007_*` | Vale Combustible | Fuel voucher, combustible types                                  |

## Global References

| File                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `Mod_002_Permiso.vb`   | Permission checks, role definitions                   |
| `Mod_000_Variables.vb` | Global variables, connection strings                  |
| `Mod_001_Funciones.vb` | Utility functions, date formatting, number formatting |

## Database Table Naming

- Pattern: `tbl_CMMXXX` where `MM` = module code, `XXX` = sequential
- Equipment tables: `tbl_C08001` (equipo), `tbl_C08003` (contrato), `tbl_C08005` (parte_diario), etc.
- Look in DataSet `.Designer.vb` files for full column definitions

## How to Use This Skill

1. **Find dropdown values**: Read the `.Designer.vb` file for the form — look for `ComboBox.Items.AddRange` or `DataSource` bindings
2. **Find field names**: Read the `.Designer.vb` for `DataGridView` column definitions or form control names
3. **Find business logic**: Read the `.vb` code-behind for button click handlers, validation, SQL queries
4. **Find SQL queries**: Search for `SELECT`, `INSERT`, `UPDATE` in `.vb` files — queries are inline strings
5. **Find stored procedures**: Search for `EXEC` or `sp_` patterns

## Common Patterns

- ComboBox items are typically hardcoded via `Items.AddRange(New Object() {...})`
- DataGridView columns are defined in `.Designer.vb` with column names matching DB fields
- SQL queries use `SqlCommand` with parameterized `@param` syntax
- Connection to DB via `SqlConnection` in `Mod_000_Variables`

## Quick Search Examples

```bash
# Find all dropdown values in the contract form
grep -r "Items.AddRange\|ComboBox" "~/Drive/JCA ERP 20220120/" --include="*308_003*"

# Find SQL queries for contracts
grep -r "tbl_C08003\|contrato" "~/Drive/JCA ERP 20220120/" --include="*.vb"

# Find field definitions in contract DataSet
grep -r "ColumnName\|DataColumn" "~/Drive/JCA ERP 20220120/" --include="*308*DataSet*"
```
