# Bitcorp ERP - Product Requirements Document (PRD) & Functional Requirements Document (FRD)

**Version**: 2.0  
**Date**: November 7, 2025  
**Based On**: Business Discovery Interview  
**Status**: Requirements Gathering Complete

---

## Table of Contents

1. [Product Requirements Document (PRD)](#product-requirements-document-prd)
2. [Functional Requirements Document (FRD)](#functional-requirements-document-frd)

---

# Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Vision
Bitcorp ERP is a comprehensive enterprise resource planning system designed for civil engineering and construction companies. The system manages equipment, operators, contracts, and provides real-time operational insights through integrated management systems aligned with ISO standards.

### 1.2 Business Context
The application serves construction companies managing multiple projects across different geographical locations, requiring:
- Centralized equipment management and tracking
- Operator daily report submissions
- Contract and addendum management
- Asset valuation and financial reporting
- Compliance with ISO standards (ISO 9001, ISO 14001, ISO 45001)

### 1.3 Target Users

| User Level | Role | Access Scope | Primary Functions |
|------------|------|--------------|-------------------|
| **Level 1** | Company Director | Full System Access | View all modules including SIG, operations across all projects |
| **Level 2** | Project Director | Project-Specific Access | View operational modules (Licensing, Operations) for assigned projects |
| **Level 3** | Department Users | Module-Specific Access | Access to specific operational modules (SST, Administration, HR, Logistics, Providers, Equipment) |
| **Field Level** | Equipment Operators | Mobile App Only | Submit daily reports (Parte Diario) in the field |

---

## 2. System Architecture Overview

### 2.1 Hierarchical control panel Structure

```
control panel (Post-Login)
├── Level 1: SIG (Sistema Integrado de Gestión) - Integrated Management System
│   ├── ISO 9001 - Quality Management
│   ├── ISO 14001 - Environmental Management
│   └── ISO 45001 - Occupational Health & Safety
│
├── Level 2: Operational Modules
│   ├── Licitaciones (Bidding/Tenders)
│   └── Operaciones (Operations)
│
└── Level 3: Departmental Modules
    ├── SST (Seguridad y Salud en el Trabajo) - Occupational Health & Safety
    ├── Administración - Administration
    ├── RRHH - Human Resources
    ├── Logística - Logistics
    ├── Gestión de Proveedores - Provider Management
    └── Gestión de Equipo Mecánico - Equipment Management ⭐ (Primary Focus)
```

### 2.2 Permission-Based Display
- **All modules visible** to all users on control panel 
- **Active modules**: Full color, clickable
- **Restricted modules**: Grayed out/shadowed to indicate unavailability
- **Purpose**: Display full system capabilities while enforcing access control

### 2.3 User Context Display
control panel  header must show:
- User full name
- User ID
- List of assigned projects (users can work on multiple projects)
- Current active project selector

---

## 3. Core Module: Equipment Management (Gestión de Equipo Mecánico)

### 3.1 Module Overview

The Equipment Management module is the primary focus area containing:

```
Gestión de Equipo Mecánico
├── Procedimiento (Process Documentation) - Future Phase
├── Equipo (Equipment Registry) ⭐ PRIORITY
├── Contrato y Adenda (Contracts & Addendums)
├── Ver Registro de Valorizaciones (Asset Valuation Records)
├── Registrar Parte Diario (Daily Report Registration) - Operator App
└── KPI (Key Performance Indicators) - Placeholder
```
Ref: [Equipment Registry Table](../../docs/images/CONCEPT-002/0003-Gestion_De_Equipo_Mecanico_Registration_Table.jpeg)
Ref: [Equipment Maintainance Form](../../docs/images/CONCEPT-002/0004-Gestion_De_Equipo_Mecanico_Maintenance_Form.jpeg)
---

## 4. Key Business Objectives

### 4.1 Primary Goals
1. **Centralized Equipment Tracking**: Maintain comprehensive registry of all construction equipment across projects
2. **Automated Valuation**: Calculate monthly equipment costs based on actual usage data
3. **Contract Management**: Track rental agreements, extensions, and payment obligations
4. **Operator Accountability**: Enable field operators to submit daily usage reports via mobile
5. **Financial Transparency**: Generate accurate monthly billing reports per equipment and provider

### 4.2 Success Metrics
- 100% equipment visibility across all projects
- 95%+ daily report submission rate from operators
- Automated monthly valuation reports within 2 days of month-end
- Contract renewal alerts 7+ days before expiration
- Audit trail for all equipment-related transactions

---

## 5. User Stories

### 5.1 Company Director (Level 1)
- As a Company Director, I want to see all modules across all projects so I can have complete oversight
- As a Company Director, I want to view consolidated KPIs from multiple projects so I can make strategic decisions

### 5.2 Project Director (Level 2)
- As a Project Director, I want to view all equipment in my assigned project(s) so I can manage resources effectively
- As a Project Director, I want to receive alerts about upcoming contract expirations so I can plan renewals
- As a Project Director, I want to review monthly equipment valuations so I can control project costs

### 5.3 Equipment Manager (Level 3)
- As an Equipment Manager, I want to register new equipment with all specifications so the system has complete records
- As an Equipment Manager, I want to track equipment maintenance schedules so I can prevent breakdowns
- As an Equipment Manager, I want to manage contracts and addendums so rental terms are always current
- As an Equipment Manager, I want to view equipment status (in-project, available, maintenance) so I can allocate resources
- As an Equipment Manager, I want to know who registered/updated equipment data so I can ensure accountability

### 5.4 Equipment Operator (Field Level)
- As an Operator, I want to submit daily reports from my mobile device so I don't need office access
- As an Operator, I want a simple form to record equipment usage hours so reporting is quick
- As an Operator, I want to log fuel consumption so costs are tracked accurately

### 5.5 Finance/Admin (Level 3)
- As a Finance user, I want to generate monthly equipment valuation reports so I can process provider payments
- As a Finance user, I want to see breakdowns by provider so I know how much to pay each vendor
- As a Finance user, I want PDF exports of valuation reports for official documentation

---

## 6. Key Features & Requirements

### 6.1 Authentication & Authorization
- Role-based access control (RBAC) with 4 user levels
- Multi-project assignment capability per user
- Session management with security audit logs
- Password policies aligned with security standards

### 6.2 Control Panel
- Module display with permission-based styling (active vs. disabled)
- User context display (name, ID, assigned projects)
- Project selector for multi-project users
- Quick navigation to frequently accessed modules

### 6.3 Equipment Management Module
See Functional Requirements Document for detailed specifications

### 6.4 Mobile Application for Operators
- Lightweight, responsive web application or native mobile app
- Daily Report (Parte Diario) submission form
- Offline capability with sync when connectivity available
- Simple, intuitive interface optimized for field use

---

## 7. Technical Constraints

### 7.1 Technology Stack
- **Frontend**: Angular 19+ with responsive/mobile-first design
- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL (migrated from SQL Server BACPAC)
- **Containerization**: Docker Compose for dev and production
- **Testing**: Playwright for E2E, Jest for unit tests

### 7.2 Data Migration
- Existing SQL Server database (BACPAC format)
- Must preserve all historical data during migration
- Data validation required post-migration

### 7.3 Integration Requirements
- PDF generation for valuation reports
- Notification system for alerts (contract expiry, maintenance due)
- Audit logging for all CRUD operations
- Multi-language support (Spanish primary, English secondary)

---

## 8. Assumptions

1. **Internet Connectivity**: Operators have mobile internet access for daily report submission
2. **Device Availability**: Operators have access to smartphones or tablets
3. **User Training**: All users will receive training on their respective modules
4. **Data Quality**: Legacy data is clean and complete for migration
5. **Provider Standardization**: Equipment rental terms can be standardized in the system

---

## 9. Out of Scope (Future Phases)

### Phase 2 (Not in Initial Release)
- Procedimiento (Process Documentation) module
- Advanced KPI dashboards with analytics
- Licitaciones (Bidding/Tenders) module
- Operaciones (Operations) module
- SST, RRHH, Logística, Gestión de Proveedores modules
- Integration with external accounting systems
- Mobile native application (start with responsive web)
- IoT integration for automatic equipment readings

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Poor mobile connectivity in field | High | Medium | Implement offline-first mobile app with sync |
| Operator resistance to digital reporting | High | Medium | Provide extensive training and simplified UX |
| Complex contract terms not fitting system | Medium | High | Build flexible contract template system |
| Data loss during migration | Critical | Low | Comprehensive backup and validation procedures |
| Equipment maintenance tracking complexity | Medium | Medium | Phased approach, start with basic tracking |

---

# Functional Requirements Document (FRD)

## 1. Module: Equipment Registry (Equipo)

### 1.1 Equipment List View

**Screen**: Equipment Registry Table

**Access**: Level 1, Level 2 (project-specific), Level 3 (Equipment Management)

**Layout**: Data table with toolbar and filtering capabilities

#### 1.1.1 Toolbar Functions

| Icon/Button | Function | Description |
|-------------|----------|-------------|
| ➕ Add | Create Equipment | Opens equipment registration form |
| 🗑️ Delete | Remove Equipment | Deletes selected equipment (with confirmation) |
| 🔍 Search | Search Equipment | Full-text search across equipment fields |
| 🔽 Filter | Filter Equipment | Filter by status, provider, category, etc. |
| 📥 Export | Export Data | Export table to Excel/CSV |
| 🔄 Refresh | Reload Data | Refresh table data from database |

#### 1.1.2 Table Columns

| Column | Data Type | Description | Sortable | Filterable |
|--------|-----------|-------------|----------|------------|
| Código Equipo | String | Equipment unique code | Yes | Yes |
| RUC Proveedor | String | Provider tax ID | Yes | Yes |
| Razón Social | String | Company name | Yes | Yes |
| Tipo de Proveedor | Enum | Provider type | Yes | Yes |
| Categoría | Enum | Equipment category | Yes | Yes |
| Placa | String | License plate | Yes | Yes |
| Marca | String | Make/Brand | Yes | Yes |
| Modelo | String | Model | Yes | Yes |
| Estado | Enum | Status (In Project, Available, Maintenance) | Yes | Yes |
| Tipo Motor | Enum | Fuel type (Diesel, Gasoline, Electric) | Yes | Yes |
| Fecha Registro | Date | Registration date | Yes | Yes |
| Registrado Por | String | Registered by (username) | No | Yes |

#### 1.1.3 Row Actions

**Primary Action**: Click on row → Opens Equipment Detail View

**Context Menu** (Right-click or action button):
- View Details
- Edit Equipment
- Create Maintenance Report
- View Contract
- View History
- Delete Equipment (with confirmation)

#### 1.1.4 Status Visual Indicators

| Status | Color Code | Icon | Meaning |
|--------|------------|------|---------|
| In Project | Green | ✓ | Currently assigned and operational |
| Available | Blue | ○ | Ready for assignment |
| In Maintenance | Orange | 🔧 | Under maintenance |
| Maintenance Due Soon | Yellow Background | ⚠️ | Maintenance required within 7 days |
| Maintenance Overdue | Red Background | ❗ | Maintenance overdue |

#### 1.1.5 Filtering Capabilities

**Quick Filters** (Toggle buttons above table):
- Show All
- In Project Only
- Available Only
- Maintenance Required
- My Registered Equipment

**Advanced Filters** (Filter panel):
- Status (multi-select)
- Provider (dropdown)
- Category (dropdown)
- Date Range (from-to date picker)
- Fuel Type (multi-select)
- Location/Project (dropdown)

---

### 1.2 Equipment Registration Form

**Screen**: Add/Edit Equipment

**Access**: Level 3 (Equipment Management) with write permissions

**Trigger**: Click ➕ Add button or Edit from context menu

#### 1.2.1 Form Sections

**Section 1: Basic Information** (Auto-filled if editing)

| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| Código Equipo | Text (Read-only) | No | No | N/A | Auto-generated or from legacy system |
| RUC Proveedor | Text (Read-only) | Yes | No | Valid RUC format | From provider database |
| Razón Social | Text (Read-only) | Yes | No | N/A | From provider database |

**Section 2: Equipment Classification**

| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| Tipo de Proveedor | Dropdown | Yes | Yes | Must select one | Options: Rental, Owned, Leased |
| Categoría de Equipo | Dropdown | Yes | Yes | Must select one | Heavy Machinery, Vehicles, Tools, etc. |
| Tipo de Motor | Dropdown | Yes | Yes | Must select one | Diesel, Gasoline, Electric, Hybrid |

**Section 3: Identification Details**

| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| Placa | Text | Conditional* | Yes | Valid plate format | *Required if vehicle |
| Documento de Acreditación | Text | No | Yes | N/A | Registration document number |
| Fecha de Acreditación | Date Picker | No | Yes | Valid date | Document issuance date |
| Marca | Text | Yes | Yes | Max 100 chars | Make/Brand |
| Modelo | Text | Yes | Yes | Max 100 chars | Model name |
| Número de Serie Equipo | Text | Yes | Yes | Alphanumeric | Equipment serial number |
| Número de Chasis | Text | Conditional* | Yes | Alphanumeric | *Required if vehicle |
| Número de Serie Motor | Text | No | Yes | Alphanumeric | Engine serial number |
| Potencia Neta | Number | No | Yes | Positive number | In HP or kW (specify unit) |
| Año de Fabricación | Number | Yes | Yes | 1900-current year | Year of manufacture |
| Código Externo | Text | No | Yes | Max 50 chars | External/alternative code |

**Section 4: Operational Parameters**

| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| Medidor de Uso | Dropdown | Yes | Yes | Must select | Options: Horómetro (Hour meter), Odómetro (Odometer), Ninguno (None) |
| Estado | Dropdown | Yes | Yes | Must select | Options: En Proyecto (In Project), Disponible (Available), En Mantenimiento (In Maintenance) |

**Section 5: Compliance & Expiration Dates**

| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| Fecha Venc. Póliza | Date Picker | No | Yes | Future date | Insurance policy expiration |
| Fecha Venc. SOAT | Date Picker | Conditional* | Yes | Future date | *Required if vehicle (Peruvian mandatory insurance) |
| Fecha Venc. CITV | Date Picker | Conditional* | Yes | Future date | *Required if vehicle (Technical inspection) |

**Section 6: System Metadata** (Read-only, auto-populated)

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| ID Unidad de Operación | Text | No | Operating unit identifier |
| Fecha de Registro | Datetime | No | Timestamp of creation |
| Registrado Por | Text | No | Username who created record |
| Fecha de Actualización | Datetime | No | Timestamp of last update |
| Actualizado Por | Text | No | Username who last updated |

#### 1.2.2 Form Validations

**Client-Side Validations**:
- All required fields must be filled
- Date formats must be valid
- Numeric fields must contain valid numbers
- RUC must follow Peru tax ID format (11 digits)
- Plate number must follow Peru format (ABC-123 or similar)
- Year of manufacture cannot be in the future
- Expiration dates must be in the future (warning if past)

**Server-Side Validations**:
- Equipment code must be unique (if manually entered)
- Provider RUC must exist in provider database
- Serial numbers should be unique (warning if duplicate)
- Equipment cannot be deleted if it has active contracts
- Equipment cannot be deleted if it has daily reports

#### 1.2.3 Form Actions

| Button | Action | Behavior |
|--------|--------|----------|
| 💾 Guardar (Save) | Submit Form | Validates and saves data, returns to equipment list with success message |
| 🔄 Guardar y Crear Nuevo (Save & New) | Submit and Reset | Saves current equipment and opens blank form for next entry |
| ❌ Cancelar (Cancel) | Discard Changes | Returns to equipment list (confirmation if form is dirty) |
| 🔄 Resetear (Reset) | Clear Form | Clears all fields to default values (confirmation required) |

#### 1.2.4 Post-Save Actions

**Success Scenario**:
1. Display success toast notification: "Equipo registrado exitosamente"
2. Return to equipment list with new equipment highlighted
3. Log activity: "[User] registered equipment [Code]"

**Error Scenario**:
1. Display error message inline with problematic fields
2. Keep form open with user data preserved
3. Log error for troubleshooting

---

### 1.3 Equipment Maintenance Management

**Screen**: Maintenance Tracking

**Access**: Level 3 (Equipment Management)

**Purpose**: Track equipment maintenance schedules and generate maintenance reports

#### 1.3.1 Maintenance Tracking in Equipment List

**Visual Indicators** (Background colors on equipment rows):

| Indicator | Color | Condition | Action Required |
|-----------|-------|-----------|-----------------|
| Normal | White | No maintenance due in next 30 days | None |
| Warning | Yellow | Maintenance due within 7-30 days | Plan maintenance |
| Alert | Orange | Maintenance due within 1-7 days | Schedule maintenance immediately |
| Critical | Red | Maintenance overdue | Urgent action required |

**Filter**: "Maintenance Required" quick filter shows only yellow/orange/red rows

#### 1.3.2 Maintenance Report Creation

**Trigger**: Right-click on equipment row → "Crear Reporte de Mantenimiento" or click maintenance icon

**Form**: Maintenance Report

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Código Equipo | Text (Read-only) | Yes | Pre-filled from selected equipment |
| Fecha de Mantenimiento | Date Picker | Yes | Scheduled maintenance date |
| Tipo de Mantenimiento | Dropdown | Yes | Options: Preventivo, Correctivo, Emergencia |
| Descripción | Textarea | Yes | Maintenance description/reason |
| Componentes a Revisar | Multi-select | No | List of parts: Filter, Oil, Brakes, etc. |
| Técnico Responsable | Dropdown | Yes | Technician assigned (from users) |
| Costo Estimado | Number | No | Estimated maintenance cost |
| Observaciones | Textarea | No | Additional notes |

**Actions**:
- Save → Equipment status changes to "En Mantenimiento"
- Cancel → Returns to equipment list without changes

#### 1.3.3 Maintenance History

**Screen**: Equipment Detail → Maintenance History Tab

**Display**: Table of all past maintenance records for the equipment

| Column | Data |
|--------|------|
| Fecha | Maintenance date |
| Tipo | Maintenance type |
| Descripción | Brief description |
| Técnico | Responsible technician |
| Costo Real | Actual cost incurred |
| Estado | Status (Completado, En Proceso, Cancelado) |

---

### 1.4 Equipment Detail View

**Screen**: Equipment Details & Tabs

**Access**: Click on equipment row in table

**Layout**: Header with equipment summary + Tabbed interface

#### 1.4.1 Header Section

Display key equipment information:
- Equipment Code (large, prominent)
- Equipment Name/Description
- Status badge with color indicator
- Provider name
- Current location/project

**Quick Actions** (Buttons):
- Edit Equipment
- Create Maintenance Report
- View Contract
- View Valuation Reports
- Deactivate Equipment

#### 1.4.2 Tabs

**Tab 1: General Information**
- Display all equipment fields in read-only format
- Organized in sections matching registration form
- Include system metadata with audit trail

**Tab 2: Maintenance History**
- Table of all maintenance records (see 1.3.3)
- Filter by date range, maintenance type
- Export to PDF/Excel

**Tab 3: Contract Information**
- Current active contract details (see Section 2)
- Contract history
- Link to contract management module

**Tab 4: Daily Reports**
- Summary of daily usage reports submitted by operators
- Aggregated hours/kilometers
- Fuel consumption trends
- Link to detailed daily reports

**Tab 5: Valuation History**
- Monthly valuation reports for this equipment
- Cost trends over time
- Chart visualization
- Export options

---

## 2. Module: Contracts & Addendums (Contrato y Adenda)

### 2.1 Contract Management Overview

**Purpose**: Manage rental agreements, terms, conditions, and extensions for equipment

**Key Concepts**:
- **Contrato (Contract)**: Initial rental agreement with provider
- **Adenda (Addendum)**: Extension of existing contract without re-entering all data

### 2.2 Contract List View

**Screen**: Contract Registry Table

**Access**: Level 1, Level 2 (project-specific), Level 3 (Equipment Management)

#### 2.2.1 Table Columns

| Column | Description |
|--------|-------------|
| Número de Contrato | Contract unique number |
| Equipo | Equipment code and name |
| Proveedor | Provider name |
| Fecha Inicio | Contract start date |
| Fecha Fin | Contract end date |
| Días Restantes | Days remaining (calculated) |
| Moneda | Currency (PEN or USD) |
| Monto Total | Total contract amount |
| Estado | Status (Activo, Próximo a Vencer, Vencido, Extendido) |

#### 2.2.2 Status Indicators

| Status | Color | Condition |
|--------|-------|-----------|
| Activo | Green | End date > 30 days away |
| Próximo a Vencer | Yellow | End date within 30 days |
| Vencido | Red | End date passed |
| Extendido | Blue | Has active addendum |

#### 2.2.3 Toolbar Functions

- ➕ New Contract
- 📄 Create Addendum (for selected contract)
- 🔔 Set Alert (notification before expiration)
- 🔍 Search/Filter
- 📥 Export

---

### 2.3 Contract Registration Form

**Screen**: New Contract

**Trigger**: Click ➕ New Contract button

#### 2.3.1 Form Sections

**Section 1: Contract Identification**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Número de Contrato | Text | Yes | Auto-generated or manual entry |
| Equipo | Dropdown/Search | Yes | Select from available equipment |
| Proveedor | Text (Read-only) | Yes | Auto-filled based on equipment |
| Fecha de Contrato | Date Picker | Yes | Contract signing date |

**Section 2: Contract Period**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Fecha Inicio | Date Picker | Yes | Contract start date |
| Fecha Fin | Date Picker | Yes | Contract end date |
| Duración (días) | Number (Read-only) | Yes | Auto-calculated from dates |

**Section 3: Financial Terms**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Moneda | Radio Button | Yes | Options: Soles (PEN), Dólares (USD) |
| Tipo de Tarifa | Dropdown | Yes | Hourly, Daily, Monthly, Fixed |
| Tarifa | Number | Yes | Rate amount |
| Incluye Motor | Checkbox | No | Whether engine/operator included in rate |
| Incluye Operador | Checkbox | No | Whether operator included |
| Costo Adicional Motor | Number | Conditional | Required if "Incluye Motor" = No |
| Horas Incluidas | Number | Conditional | If hourly rate, how many hours included |
| Penalidad por Exceso | Number | No | Penalty rate for exceeding included hours |

**Section 4: Terms & Conditions**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Condiciones Especiales | Textarea | No | Special terms, limitations, restrictions |
| Documento de Contrato | File Upload | No | Scanned contract PDF |

**Section 5: System Metadata** (Auto-populated)

- Creado Por / Fecha
- Actualizado Por / Fecha

#### 2.3.2 Contract Actions

- 💾 Guardar (Save)
- ❌ Cancelar (Cancel)
- 🖨️ Generar PDF (Generate PDF) - Creates printable contract

---

### 2.4 Addendum (Adenda) Creation

**Purpose**: Extend contract duration without re-entering all contract data

**Screen**: Create Addendum

**Trigger**: Select existing contract → Click "Crear Adenda" button

#### 2.4.1 Addendum Form

**Pre-filled Data** (Read-only from parent contract):
- Número de Contrato Original
- Equipo
- Proveedor
- Tarifas y Condiciones Originales

**Editable Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Número de Adenda | Text | Yes | Auto-generated: [Contract #]-AD-001 |
| Nueva Fecha Fin | Date Picker | Yes | Must be after current contract end date |
| Cambios en Tarifa | Checkbox | No | If checked, allow rate modification |
| Nueva Tarifa | Number | Conditional | If rate changes |
| Nueva Moneda | Radio Button | Conditional | If currency changes |
| Justificación | Textarea | Yes | Reason for extension |
| Documento de Adenda | File Upload | No | Signed addendum document |

#### 2.4.2 Addendum Business Rules

1. Addendum can only be created for active or soon-to-expire contracts
2. New end date must be after original contract end date
3. If rate changes, system logs original vs. new rate
4. Multiple addendums can exist for one contract (chained)
5. System shows full contract + addendum timeline

#### 2.4.3 Post-Addendum Actions

- Parent contract status → "Extendido"
- Equipment availability updated to new end date
- Notification sent to relevant users about extension
- Audit log: "[User] extended contract [#] with addendum [#]"

---

### 2.5 Contract Detail View

**Screen**: Contract Details & Timeline

**Layout**: Header + Timeline + Tabs

#### 2.5.1 Header

- Contract Number
- Equipment (clickable link)
- Provider
- Status badge
- Days remaining (countdown)

**Actions**:
- Edit Contract
- Create Addendum
- View PDF
- Close Contract (if needed)

#### 2.5.2 Timeline View

Visual timeline showing:
- Original contract period (bar)
- Addendum periods (extended bars with different color)
- Current date indicator (vertical line)
- End date marker

#### 2.5.3 Tabs

**Tab 1: Contract Details**
- All contract fields in read-only view
- Financial terms summary
- Documents (downloadable)

**Tab 2: Addendum History**
- Table of all addendums
- Each addendum's details, dates, rates
- Download addendum documents

**Tab 3: Financial Summary**
- Total contract value (original + addendums)
- Actual costs incurred (based on daily reports)
- Variance analysis
- Payment schedule

**Tab 4: Related Daily Reports**
- All operator daily reports linked to this contract/equipment
- Aggregated usage hours
- Fuel consumption

---

## 3. Module: Asset Valuation Records (Ver Registro de Valorizaciones)

### 3.1 Valuation Overview

**Purpose**: Calculate and report monthly equipment costs based on actual usage from daily operator reports

**Key Formula**:
```
Monthly Equipment Cost = (Base Rate × Hours/Days Used) + 
                         (Excess Hours × Penalty Rate) + 
                         (Fuel Consumed × Fuel Price) + 
                         (Additional Charges)
```

**Data Source**: Daily Reports (Parte Diario) submitted by operators

### 3.2 Valuation Dashboard

**Screen**: Monthly Valuation Summary

**Access**: Level 1, Level 2, Level 3 (Equipment Management, Finance)

#### 3.2.1 Dashboard Filters

| Filter | Type | Default |
|--------|------|---------|
| Mes | Month Picker | Current month |
| Año | Year Picker | Current year |
| Proyecto | Dropdown | All or specific |
| Proveedor | Dropdown | All or specific |
| Estado | Multi-select | All (Pendiente, En Revisión, Aprobado) |

#### 3.2.2 Summary Cards (Top of screen)

| Card | Value | Calculation |
|------|-------|-------------|
| Total a Pagar | $ XX,XXX.XX | Sum of all valuations for selected period |
| Equipos Valorizados | ## equipos | Count of equipment with valuations |
| Proveedores Involucrados | ## proveedores | Count of unique providers |
| Reportes Procesados | ## reportes | Count of daily reports used in calculations |

#### 3.2.3 Valuation Table

| Column | Description | Format |
|--------|-------------|--------|
| Código Equipo | Equipment code | Text |
| Descripción | Equipment description | Text |
| Proveedor | Provider name | Text |
| Días Trabajados | Days worked in month | Number |
| Horas Trabajadas | Hours worked in month | Number (decimal) |
| Combustible Consumido | Fuel consumed (gallons) | Number (decimal) |
| Costo Base | Base rental cost | Currency |
| Costo Combustible | Fuel cost | Currency |
| Cargos Adicionales | Additional charges | Currency |
| Total Valorizado | Total valuation | Currency (bold) |
| Estado | Status | Badge (color-coded) |
| Acciones | Actions | Icons (View, Download PDF, Approve) |

#### 3.2.4 Toolbar Functions

- 🔄 Generar Valorizaciones (Generate Valuations) - Recalculates for selected period
- 📥 Exportar a Excel (Export to Excel) - Full table export
- 📧 Enviar por Email (Email Report) - Send to provider/stakeholders
- ✓ Aprobar Seleccionados (Approve Selected) - Batch approval
- 🖨️ Generar PDFs (Generate PDFs) - Batch PDF generation for selected equipment

---

### 3.3 Individual Equipment Valuation Report

**Screen**: Detailed Valuation Report (PDF Format)

**Trigger**: Click "Ver Detalle" or "Descargar PDF" from valuation table

#### 3.3.1 PDF Report Structure

**Page 1: Equipment & Provider Information**

```
REPORTE DE VALORIZACIÓN DE EQUIPO
Mes: [Month] [Year]
Proyecto: [Project Name]

INFORMACIÓN DEL EQUIPO
├── Código de Equipo: [Code]
├── Descripción: [Equipment description]
├── Marca/Modelo: [Make/Model]
├── Placa: [License Plate]
└── Categoría: [Category]

INFORMACIÓN DEL PROVEEDOR
├── Razón Social: [Provider Name]
├── RUC: [Tax ID]
├── Tipo de Contrato: [Contract Type]
└── Número de Contrato: [Contract Number]

PERIODO DE VALORIZACIÓN
├── Fecha Inicio: [Start Date]
├── Fecha Fin: [End Date]
└── Días del Periodo: [Total Days]
```

**Page 2: Usage Summary**

```
RESUMEN DE USO DEL EQUIPO

Días Trabajados: [##] días
Horas Totales Trabajadas: [###.##] horas
Promedio Horas/Día: [##.##] horas

LECTURA DE MEDIDORES
├── Horómetro Inicial: [####] horas
├── Horómetro Final: [####] horas
└── Diferencia: [###] horas

CONSUMO DE COMBUSTIBLE
├── Combustible Total: [###.##] galones
├── Promedio por Hora: [#.##] gal/hora
└── Precio Promedio: S/ [#.##] por galón

OPERADORES ASIGNADOS
[Tabla con: Nombre Operador, Días Trabajados, Horas Trabajadas]
```

**Page 3: Daily Report Details**

```
DETALLE DE PARTES DIARIOS

[Tabla con columnas:]
Fecha | Operador | Hora Inicio | Hora Fin | Total Horas | Combustible | Observaciones

[Fila por cada día del mes]
```

**Page 4: Financial Calculation**

```
CÁLCULO DE VALORIZACIÓN

TARIFA BASE
├── Tipo de Tarifa: [Hourly/Daily/Monthly]
├── Tarifa Contratada: [Rate] por [unit]
├── Horas/Días Incluidos: [##]
└── Costo Base: S/ [X,XXX.XX]

HORAS ADICIONALES (si aplica)
├── Horas Excedidas: [##.##] horas
├── Tarifa por Exceso: S/ [XX.XX] por hora
└── Costo Adicional: S/ [XXX.XX]

COMBUSTIBLE
├── Combustible Consumido: [###.##] galones
├── Precio por Galón: S/ [#.##]
└── Costo Combustible: S/ [X,XXX.XX]

CARGOS ADICIONALES
├── Descripción: [Various items]
└── Subtotal: S/ [XXX.XX]

─────────────────────────────────
TOTAL A PAGAR: S/ [XX,XXX.XX]
═════════════════════════════════
```

**Page 5: Signatures & Approval**

```
APROBACIONES

Elaborado por:
Nombre: [User Name]
Cargo: [Position]
Fecha: [Date]
Firma: _______________

Revisado por:
Nombre: [Reviewer Name]
Cargo: [Position]
Fecha: [Date]
Firma: _______________

Aprobado por:
Nombre: [Approver Name]
Cargo: [Position]
Fecha: [Date]
Firma: _______________

OBSERVACIONES:
[Text area for notes]
```

#### 3.3.2 PDF Generation Requirements

**Technical Specifications**:
- Format: A4, Portrait orientation
- Font: Arial or similar, 10-12pt body, 14-16pt headers
- Logo: Company logo in header (top-left)
- Watermark: "BORRADOR" if status = Pendiente/En Revisión
- Footer: Page numbers, generation date/time, system info
- File naming: `VAL_[EquipCode]_[YYYYMM].pdf`

**Business Rules**:
- PDF generation only after month-end (after day 1 of next month)
- Must have at least 1 daily report for equipment in period
- All daily reports must be approved before PDF generation
- PDF saved in document repository linked to equipment record
- Email notification sent to provider and project manager

---

### 3.4 Valuation Workflow & States

**Valuation Status State Machine**:

```
Pendiente (Pending)
    ↓
    | [System calculates based on daily reports]
    ↓
En Revisión (Under Review)
    ↓
    | [Equipment Manager reviews and validates]
    ↓
Aprobado (Approved)
    ↓
    | [Finance processes payment]
    ↓
Pagado (Paid)
```

**Actions per Status**:

| Status | Available Actions | Who Can Perform |
|--------|-------------------|-----------------|
| Pendiente | - Recalcular<br>- Enviar a Revisión | System / Equipment Manager |
| En Revisión | - Aprobar<br>- Rechazar<br>- Solicitar Corrección | Finance / Project Manager |
| Aprobado | - Generar PDF<br>- Marcar como Pagado<br>- Reabrir | Finance |
| Pagado | - Ver Comprobante<br>- Generar Reporte Final | Finance / Admin |

---

### 3.5 Provider-Level Valuation Summary

**Screen**: Monthly Payment Summary by Provider

**Purpose**: Consolidated view of all equipment from one provider for monthly billing

**Trigger**: Click on provider name in valuation table

#### 3.5.1 Provider Summary Report

**Header Section**:
- Provider Name & RUC
- Month/Year
- Total Equipment Count
- Total Amount Payable

**Equipment Table**:

| Equipo | Días | Horas | Costo Base | Combustible | Adicionales | Total |
|--------|------|-------|------------|-------------|-------------|-------|
| [Code] | ## | ###.## | S/ X,XXX | S/ XXX | S/ XX | S/ X,XXX |
| ... | ... | ... | ... | ... | ... | ... |
| **TOTAL** | | | **S/ XX,XXX** | **S/ X,XXX** | **S/ XXX** | **S/ XX,XXX** |

**Actions**:
- 📥 Exportar a Excel
- 🖨️ Generar PDF Consolidado (Consolidated PDF for provider)
- 📧 Enviar por Email al Proveedor

---

### 3.6 Valuation Calculation Engine

**Backend Process**: Automated Monthly Valuation Generation

**Trigger**: 
- Manual: User clicks "Generar Valorizaciones"
- Scheduled: Automatic run on 1st day of each month at 2:00 AM

**Algorithm**:

```typescript
FOR each equipment with daily reports in period:
  
  1. Retrieve Contract Terms
     - Base rate & rate type (hourly/daily/monthly)
     - Included hours/days
     - Excess penalty rate
     - Currency
     - Fuel inclusion (yes/no)
  
  2. Aggregate Daily Reports
     - Total days worked
     - Total hours worked (sum of all daily reports)
     - Total fuel consumed
     - List of operators
     - Equipment readings (start/end hour meter or odometer)
  
  3. Calculate Base Cost
     IF rate_type = 'hourly':
       base_hours = MIN(total_hours, included_hours)
       base_cost = base_hours × hourly_rate
     
     ELSE IF rate_type = 'daily':
       base_days = MIN(days_worked, included_days)
       base_cost = base_days × daily_rate
     
     ELSE IF rate_type = 'monthly':
       base_cost = monthly_rate
  
  4. Calculate Excess Cost
     IF total_hours > included_hours:
       excess_hours = total_hours - included_hours
       excess_cost = excess_hours × penalty_rate
     ELSE:
       excess_cost = 0
  
  5. Calculate Fuel Cost
     IF fuel_included_in_contract = false:
       fuel_cost = total_fuel × average_fuel_price
     ELSE:
       fuel_cost = 0
  
  6. Calculate Additional Charges
     - Maintenance charges (if any)
     - Transportation fees
     - Special services
     additional_cost = SUM(all_additional_charges)
  
  7. Calculate Total
     total_valuation = base_cost + excess_cost + fuel_cost + additional_cost
  
  8. Create Valuation Record
     - Save to database
     - Status = 'Pendiente'
     - Link to equipment, contract, daily reports
  
  9. Notify Stakeholders
     - Equipment Manager
     - Project Manager
     - Finance Department

NEXT equipment
```

**Validation Rules**:
- Cannot generate valuation if daily reports incomplete (missing days with equipment usage)
- Warning if equipment hours/odometer readings show inconsistencies
- Alert if calculated cost exceeds contract budget threshold
- Flag if fuel consumption deviates >20% from expected rate

---

## 4. Module: Daily Report Registration (Registrar Parte Diario)

### 4.1 Mobile Application for Operators

**Platform**: Progressive Web App (PWA) or Native Mobile App

**Primary Users**: Equipment Operators (Field Level)

**Access**: Separate login/interface from admin web application

**Design Principles**:
- Mobile-first, touch-optimized
- Offline-capable with sync
- Minimal text entry
- Large, clear buttons
- Single-purpose screens

---

### 4.2 Operator Login & Control Panel

**Login Screen**:
- Username/Employee ID
- Password or PIN (4-6 digits for quick access)
- "Remember Me" option
- Biometric login (if supported: fingerprint, face)

Ref: [Login](../../docs/images/CONCEPT-002/0001-Login.jpeg)

**Operator Control Panel** (Post-Login):
Ref: [Control Panel](../../docs/images/CONCEPT-002/0002-Control_Panel.jpeg)

**Header**:
- Operator name
- Employee ID
- Current date/time
- Project assignment

**Today's Assignments** (Card-based UI):

```
┌─────────────────────────────────┐
│ Equipo: EXCAVADORA-001         │
│ Marca: Caterpillar 320D        │
│ Proyecto: Carretera Lima-Ica   │
│                                 │
│ Estado: ⚫ Sin Iniciar           │
│                                 │
│ [   INICIAR PARTE DIARIO   ]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Equipo: COMPACTADORA-015       │
│ Marca: Bomag BW 213            │
│ Proyecto: Carretera Lima-Ica   │
│                                 │
│ Estado: 🟢 En Curso (3.5 hrs)   │
│                                 │
│ [   CONTINUAR REPORTE   ]      │
└─────────────────────────────────┘
```

**Bottom Navigation**:
- 📋 Mis Reportes (My Reports)
- ➕ Nuevo Reporte (New Report)
- 👤 Mi Perfil (My Profile)
- ⚙️ Configuración (Settings)

---

### 4.3 Daily Report Form (Parte Diario)

**Screen**: New/Edit Daily Report

**Trigger**: 
- Click "Iniciar Parte Diario" from assignment card
- Click "➕ Nuevo Reporte" from bottom nav

#### 4.3.1 Form Layout (Single-Page Scrolling Form)

**Section 1: Equipment Selection** (if not from assignment)

| Field | Type | Notes |
|-------|------|-------|
| Seleccionar Equipo | Searchable Dropdown | Filtered by operator's authorized equipment |

**Section 2: Basic Information** (Auto-filled when possible)

| Field | Type | Required | Auto-filled | Notes |
|-------|------|----------|-------------|-------|
| Fecha | Date Picker | Yes | Yes (Current date) | Can be changed for delayed reports |
| Proyecto | Text (Read-only) | Yes | Yes | From equipment assignment |
| Operador | Text (Read-only) | Yes | Yes | Current logged-in user |
| Código de Operador | Text (Read-only) | Yes | Yes | Employee ID |

**Section 3: Work Shift Information**

| Field | Type | Required | Input Method | Notes |
|-------|------|----------|--------------|-------|
| Hora de Inicio | Time Picker | Yes | Clock interface or numeric | Start time of work |
| Hora de Fin | Time Picker | Yes | Clock interface or numeric | End time of work |
| Horas Trabajadas | Number (Read-only) | Yes | Auto-calculated | End - Start (with break deduction) |
| Descanso (minutos) | Number | No | Stepper (+/- buttons) | Lunch/break time to deduct |

**Section 4: Equipment Readings** (Conditional based on equipment type)

**IF equipment has Horómetro (Hour Meter)**:

| Field | Type | Required | Input Method | Validation |
|-------|------|----------|--------------|------------|
| Horómetro Inicial | Number | Yes | Numeric keypad | Must be ≥ last reading |
| Horómetro Final | Number | Yes | Numeric keypad | Must be > initial |
| Horas Horómetro | Number (Read-only) | Yes | Auto-calculated | Final - Initial |

**IF equipment has Odómetro (Odometer)**:

| Field | Type | Required | Input Method | Validation |
|-------|------|----------|--------------|------------|
| Odómetro Inicial (km) | Number | Yes | Numeric keypad | Must be ≥ last reading |
| Odómetro Final (km) | Number | Yes | Numeric keypad | Must be > initial |
| Kilómetros Recorridos | Number (Read-only) | Yes | Auto-calculated | Final - Initial |

**Section 5: Fuel Consumption**

| Field | Type | Required | Input Method | Notes |
|-------|------|----------|--------------|-------|
| Combustible Consumido | Number (decimal) | Yes | Numeric keypad | In gallons or liters (configurable) |
| Tipo de Combustible | Dropdown | Yes | Tap selection | Diesel, Gasolina 90, 95, 97 |
| Lugar de Abastecimiento | Text | No | Text input | Gas station name/location |

**Section 6: Work Description**

| Field | Type | Required | Input Method | Notes |
|-------|------|----------|--------------|-------|
| Actividad Realizada | Dropdown | Yes | Tap selection | Pre-defined activities: Excavación, Compactación, Transporte, etc. |
| Ubicación/Progresiva | Text | Yes | Text input or GPS | Work location (e.g., "KM 45+500") |
| Descripción Adicional | Textarea | No | Text input | Additional notes |

**Section 7: Equipment Condition & Incidents**

| Field | Type | Required | Input Method | Notes |
|-------|------|----------|--------------|-------|
| Estado del Equipo | Radio Buttons | Yes | Large tap targets | Operativo, Requiere Revisión, Averiado |
| Observaciones | Textarea | No | Text input | Any issues, damage, anomalies |
| Fotos | Image Upload | No | Camera/Gallery | Up to 5 photos |

#### 4.3.2 Form Validations

**Client-Side (Real-time)**:
- Start time < End time
- Final readings > Initial readings
- Final readings ≥ Last report's final readings
- Fuel amount must be positive
- Required fields highlighted if empty

**Server-Side (On Submit)**:
- Duplicate report check (same operator, equipment, date)
- Reading consistency check across reports
- Fuel consumption within expected range (alert if excessive)
- Work hours align with shift schedule

#### 4.3.3 Form Actions

**Bottom Action Buttons** (Fixed, always visible):

```
┌─────────────────────────────────┐
│                                 │
│  [  💾  GUARDAR BORRADOR  ]    │
│  (Save Draft - Offline OK)     │
│                                 │
│  [  ✓  ENVIAR REPORTE  ]       │
│  (Submit Report - Requires net)│
│                                 │
│  [  ❌  CANCELAR  ]             │
│  (Cancel)                       │
│                                 │
└─────────────────────────────────┘
```

**Action Behaviors**:

| Action | Behavior | Offline Support |
|--------|----------|-----------------|
| Guardar Borrador | Saves form data locally, can be resumed later | ✅ Yes |
| Enviar Reporte | Validates + Submits to server, marks as complete | ❌ No (queues if offline) |
| Cancelar | Returns to control panel, prompts if unsaved changes | ✅ Yes |

---

### 4.4 Offline Functionality

**Requirements**:
- Operator can fill out forms without internet
- Forms saved in local storage (IndexedDB)
- Visual indicator showing online/offline status
- Automatic sync when connection restored
[Parte Diario](../../docs/Formato_Parte_diario_de_equipos.pdf)
**Sync Indicator** (Top-right corner):

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Online | 🟢 WiFi | Green | Connected, live sync |
| Offline | 🔴 WiFi with X | Red | No connection, local only |
| Syncing | 🔄 | Blue | Uploading pending reports |
| Sync Error | ⚠️ | Yellow | Some reports failed to sync |

**Sync Queue** (Background Process):

```typescript
WHEN connection detected:
  1. Retrieve all draft reports from local storage
  2. FOR each draft report:
       TRY:
         - Submit to server
         - Wait for confirmation
         - Mark as synced
         - Remove from local storage
         - Show success notification
       CATCH error:
         - Keep in local storage
         - Increment retry count
         - Show error notification (if retry count > 3)
  3. Update sync indicator
  4. Refresh dashboard data
```

**User Notifications**:
- "✓ 3 reportes enviados exitosamente" (3 reports sent successfully)
- "⚠️ 1 reporte pendiente de envío" (1 report pending submission)
- "❌ Error al enviar reporte [ID]. Intente nuevamente." (Error sending report)

---

### 4.5 Report History & Editing

**Screen**: Mis Reportes (My Reports)

**Layout**: List of submitted reports, most recent first

**List Item**:

```
┌─────────────────────────────────┐
│ EXCAVADORA-001                  │
│ 📅 07/11/2025                   │
│ ⏰ 08:00 - 17:00 (8.5 hrs)      │
│ 📍 KM 45+500 - KM 46+200        │
│                                 │
│ Estado: ✅ Aprobado             │
│                                 │
│ [  Ver Detalle  ] [  Editar  ] │
└─────────────────────────────────┘
```

**Report Status**:
- 📝 Borrador (Draft) - Can edit freely
- 📤 Enviado (Submitted) - Awaiting approval
- ✅ Aprobado (Approved) - Cannot edit
- ❌ Rechazado (Rejected) - Can edit and resubmit

**Actions**:
- **Ver Detalle**: Opens read-only view of report
- **Editar**: Opens form for editing (only if status = Borrador or Rechazado)
- **Eliminar**: Deletes draft report (only if status = Borrador)

**Filters**:
- Por Fecha (Date range)
- Por Equipo (Equipment)
- Por Estado (Status)

---

### 4.6 Operator Profile

**Screen**: Mi Perfil (My Profile)

**Display Information** (Read-only for operator):
- Full Name
- Employee ID
- Photo
- Contact Information (Phone, Email)
- Current Project(s)
- Authorized Equipment List
- Certifications & Licenses (with expiration dates)
- Employment Start Date
- Performance Summary (if applicable)

**Actions**:
- 📷 Actualizar Foto (Update Photo)
- 📞 Actualizar Teléfono (Update Phone)
- 🔐 Cambiar Contraseña (Change Password)

---

### 4.7 Daily Report Approval Workflow

**Backend Process**: Admin Review of Operator Reports

**Screen** (Admin Web): Revisión de Partes Diarios

**Table Columns**:
| Fecha | Operador | Equipo | Horas | Combustible | Estado | Acciones |
|-------|----------|--------|-------|-------------|--------|----------|
| 07/11/25 | Juan P. | EXC-001 | 8.5 | 25.3 gal | Pendiente | [Aprobar] [Rechazar] [Ver] |

**Bulk Actions**:
- ✓ Aprobar Seleccionados (Approve Selected)
- ❌ Rechazar Seleccionados (Reject Selected)

**Approval Workflow**:

```
Enviado (Submitted by operator)
    ↓
    | [Admin/Supervisor reviews]
    ↓
En Revisión (Under Review)
    ↓
    ├──→ Aprobado (Approved)
    │     ↓
    │     [Used in valuations]
    │
    └──→ Rechazado (Rejected)
          ↓
          [Returned to operator for correction]
          ↓
          [Operator edits and resubmits]
```

**Rejection Reasons** (Required when rejecting):
- Inconsistent readings
- Missing information
- Fuel consumption anomaly
- Work hours mismatch
- Duplicate report
- Other (specify)

**Notification to Operator**:
When report rejected:
- Push notification: "Reporte del 07/11 rechazado. Motivo: [Reason]"
- Email notification (if configured)
- Report status updated in mobile app
- Operator can edit and resubmit

---

## 5. Module: KPI Dashboard

### 5.1 KPI Overview

**Purpose**: Provide real-time performance indicators and analytics

**Access**: Level 1 (All KPIs), Level 2 (Project-specific KPIs), Level 3 (Module-specific KPIs)

**Status**: Placeholder in initial phase, to be expanded later

### 5.2 Planned KPI Categories

**Equipment Performance KPIs**:
- Equipment utilization rate (%)
- Average hours per day per equipment
- Maintenance frequency
- Downtime analysis
- Cost per operating hour

**Operator Performance KPIs**:
- Daily report submission rate (%)
- Average hours worked per operator
- Fuel efficiency by operator
- Equipment handling incidents

**Financial KPIs**:
- Monthly equipment cost trends
- Cost per project
- Contract vs. actual costs
- Provider payment timeline

**Operational KPIs**:
- Project progress (based on equipment usage)
- Equipment availability by location
- Contract expiration alerts
- Maintenance compliance rate

---

## 6. Cross-Cutting Functional Requirements

### 6.1 Authentication & Authorization

**Login Requirements**:
- Secure login (username/password, 2FA optional)
- Session timeout after 30 minutes of inactivity
- "Remember Me" functionality (7-day cookie)
- Password strength requirements (min 8 chars, uppercase, number, special char)
- Account lockout after 5 failed attempts
- Password reset via email

**Role-Based Access Control (RBAC)**:

| Role | Modules Access | Permissions |
|------|----------------|-------------|
| Company Director | All modules | Read all, Write all, Approve all |
| Project Director | Operational modules (per project) | Read all, Write limited, Approve limited |
| Equipment Manager | Equipment, Contracts, Valuations | Read all, Write all, Approve valuations |
| Finance User | Contracts, Valuations, Reports | Read all, Approve valuations, Generate PDFs |
| Operator | Mobile app only (Daily Reports) | Read own, Write own reports |
| HR Manager | RRHH module, Operator profiles | Read all, Write all, Manage users |

**Permission Matrix**:

| Resource | Create | Read | Update | Delete | Approve |
|----------|--------|------|--------|--------|---------|
| Equipment | Mgr+ | All | Mgr+ | Dir+ | N/A |
| Contracts | Mgr+ | All | Mgr+ | Dir+ | Dir+ |
| Daily Reports | Operator | Mgr+ | Operator | Mgr+ | Mgr+ |
| Valuations | System | Mgr+ | Mgr+ | Dir+ | Finance+ |

---

### 6.2 Notifications & Alerts

**Notification Types**:

| Event | Recipients | Channel | Priority |
|-------|------------|---------|----------|
| Contract expiring in 30 days | Equipment Mgr, Project Dir | Email, Dashboard | Medium |
| Contract expiring in 7 days | Equipment Mgr, Project Dir | Email, SMS, Dashboard | High |
| Maintenance due in 7 days | Equipment Mgr, Assigned Operator | Dashboard, Mobile Push | Medium |
| Maintenance overdue | Equipment Mgr, Project Dir | Email, SMS, Dashboard | Critical |
| Daily report rejected | Operator | Mobile Push, Email | Medium |
| Valuation ready for approval | Finance, Project Dir | Email, Dashboard | Medium |
| New equipment added | Equipment Mgr team | Dashboard | Low |
| Equipment status changed | Project Dir, Equipment Mgr | Dashboard | Low |

**Notification Preferences**:
- Users can configure notification channels per event type
- "Do Not Disturb" mode (outside work hours)
- Digest mode (daily summary email)

---

### 6.3 Audit Trail & Logging

**Requirements**:
- Log all CRUD operations (who, what, when, from where)
- Track all logins/logouts
- Record all approval/rejection actions
- Monitor failed login attempts
- Log data exports and PDF generations

**Audit Log Fields**:
| Field | Description |
|-------|-------------|
| Timestamp | Date and time of action |
| User ID | Who performed the action |
| User Name | Full name of user |
| Action | CREATE, READ, UPDATE, DELETE, APPROVE, REJECT, EXPORT, LOGIN, LOGOUT |
| Resource Type | Equipment, Contract, Report, Valuation, etc. |
| Resource ID | ID of affected record |
| Old Value | Previous value (for UPDATEs) |
| New Value | New value (for UPDATEs) |
| IP Address | Client IP address |
| Device | Desktop, Mobile, etc. |
| Result | Success, Failure |
| Error Message | If failure, reason |

**Audit Log Access**:
- Company Directors: Full access
- Auditors: Read-only access
- Retention: 7 years minimum (compliance requirement)

---

### 6.4 Data Export & Reporting

**Export Formats**:
- Excel (.xlsx) - All tables
- CSV - All tables
- PDF - Reports, Valuations, Contracts
- JSON - API data exports

**Standard Reports**:
1. Equipment Inventory Report
2. Monthly Valuation Summary
3. Contract Expiration Report
4. Operator Performance Report
5. Fuel Consumption Analysis
6. Maintenance Schedule Report
7. Daily Reports Compilation

**Report Scheduling**:
- Automated generation (daily, weekly, monthly)
- Email delivery to distribution list
- FTP/SFTP upload (if integrated with accounting system)

---

### 6.5 Multi-Project & Multi-Company Support

**Project Management**:
- Users can be assigned to multiple projects
- Each project has its own equipment, operators, contracts
- Data is isolated per project (no cross-project visibility except for directors)
- Project selector in UI for multi-project users

**Company/Organization Hierarchy**:
```
Bitcorp (Parent Company)
├── Subsidiary A
│   ├── Project Alpha
│   └── Project Beta
├── Subsidiary B
│   ├── Project Gamma
│   └── Project Delta
```

**Data Isolation**:
- Company Directors see all subsidiaries
- Subsidiary Directors see only their subsidiary's projects
- Project Directors see only their assigned projects

---

### 6.6 Language & Localization

**Supported Languages**:
- Spanish (Primary, default)
- English (Secondary)

**Localization Requirements**:
- UI text, labels, buttons in both languages
- Date formats: DD/MM/YYYY (Peru standard)
- Currency: S/ (Soles) and $ (USD)
- Number format: 1,234.56 (thousands separator, decimal point)
- Time format: 24-hour (HH:mm)

**Language Switching**:
- User preference saved in profile
- Language selector in settings
- Language persists across sessions

---

### 6.7 Data Backup & Recovery

**Backup Requirements**:
- Automated daily backups (full database)
- Incremental backups every 6 hours
- Backup retention: 30 days online, 1 year archive
- Offsite backup storage (cloud or secondary location)
- Encrypted backups

**Recovery Procedures**:
- Point-in-time recovery capability
- Maximum 4-hour data loss acceptable (RPO = 4 hours)
- Maximum 2-hour downtime acceptable (RTO = 2 hours)
- Regular restore testing (monthly)

---

### 6.8 Performance Requirements

**Response Time**:
| Action | Maximum Time |
|--------|--------------|
| Page load (desktop) | 2 seconds |
| Page load (mobile) | 3 seconds |
| API response (simple query) | 500 ms |
| API response (complex query) | 2 seconds |
| Report generation (Excel) | 10 seconds |
| PDF generation | 15 seconds |
| Daily report submission | 3 seconds |

**Scalability**:
- Support 500+ concurrent users
- Handle 10,000+ equipment records
- Process 1,000+ daily reports per day
- Store 5+ years of historical data

**Availability**:
- 99.5% uptime during business hours (6 AM - 10 PM local time)
- Planned maintenance windows: Sundays 2 AM - 6 AM
- Maximum 2 hours unplanned downtime per month

---

### 6.9 Security Requirements

**Data Security**:
- Encryption at rest (database, file storage)
- Encryption in transit (HTTPS/TLS 1.3)
- Regular security audits (quarterly)
- Vulnerability scanning (monthly)
- Penetration testing (annually)

**Application Security**:
- Input validation and sanitization (prevent SQL injection, XSS)
- CSRF protection
- Rate limiting on API endpoints
- Secure file upload (virus scanning, type validation)
- Content Security Policy (CSP) headers

**Compliance**:
- GDPR compliance (if applicable)
- Peru data protection laws (Ley de Protección de Datos Personales)
- SOC 2 Type II (if hosted/cloud)

---

## 7. Integration Requirements

### 7.1 Future Integrations (Not in Phase 1)

**Accounting Systems**:
- Export valuations to accounting software (e.g., SAP, Odoo, ContaSOL)
- Sync contract data for budgeting
- Payment tracking and reconciliation
- Automatic invoice generation

**HR/Payroll Systems**:
- Sync operator information
- Export operator hours for payroll calculation
- Track certifications and license expirations
- Performance data integration

**GPS/Fleet Management**:
- Real-time equipment location tracking
- Geofencing for work zones
- Route optimization
- Automatic odometer readings

**IoT/Telematics**:
- Automatic hour meter readings from equipment sensors
- Real-time fuel consumption monitoring
- Engine diagnostics and fault codes
- Predictive maintenance alerts

**Document Management Systems**:
- Store and retrieve contract PDFs
- Equipment documentation repository
- Certificate and license storage
- Integration with SharePoint or similar

---

## 8. User Interface Requirements

### 8.1 Desktop Application (Admin Web)

**Technology**: Angular 19+ with responsive design

**Design System**: Material Design principles with custom Bitcorp branding

**Layout Structure**:

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Bitcorp ERP     [Search]  [Notifications] [User] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌────────────────────────────────────┐  │
│  │          │  │                                     │  │
│  │ Left     │  │  Main Content Area                 │  │
│  │ Sidebar  │  │  - Dashboard                       │  │
│  │ Menu     │  │  - Module Content                  │  │
│  │          │  │  - Tables                          │  │
│  │ [SIG]    │  │  - Forms                           │  │
│  │ [Ops]    │  │  - Reports                         │  │
│  │ [Depts]  │  │                                     │  │
│  │          │  │                                     │  │
│  │          │  │                                     │  │
│  └──────────┘  └────────────────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Footer: © 2025 Bitcorp | v1.0.0 | Support             │
└─────────────────────────────────────────────────────────┘
```

**Color Scheme**:
- Primary: Company brand color (to be defined)
- Secondary: Complementary color
- Success: Green (#4CAF50)
- Warning: Yellow/Orange (#FF9800)
- Error: Red (#F44336)
- Info: Blue (#2196F3)
- Neutral: Gray shades (#757575, #BDBDBD, #E0E0E0)

**Typography**:
- Headings: Roboto Bold, 18-24pt
- Body: Roboto Regular, 14pt
- Small text: Roboto Regular, 12pt
- Monospace (codes): Roboto Mono, 14pt

**Spacing**:
- Consistent 8px grid system
- Card padding: 16px
- Section margins: 24px
- Form field spacing: 12px vertical

---

### 8.2 Mobile Application (Operator App)

**Technology**: Progressive Web App (PWA) or React Native

**Design Principles**:
- Mobile-first, touch-optimized
- Large tap targets (minimum 44x44px)
- Minimal text entry
- Heavy use of dropdowns, date pickers, steppers
- Offline-first architecture
- Fast load times (<3 seconds)

**Navigation Pattern**: Bottom Tab Navigation

```
┌─────────────────────────────────┐
│  📋 Parte Diario - Nuevo        │
│  ─────────────────────────      │
│                                 │
│  [Form content scrolls here]   │
│  ...                            │
│  ...                            │
│                                 │
├─────────────────────────────────┤
│  [  💾  GUARDAR  ]             │
│  [  ✓  ENVIAR  ]               │
├─────────────────────────────────┤
│ 📋 Reportes  ➕ Nuevo  👤 Perfil│
└─────────────────────────────────┘
```

**Input Components**:
- **Numbers**: Large numeric keypad
- **Time**: Clock-style picker or scrollable time selector
- **Date**: Calendar view picker
- **Dropdown**: Full-screen selection list with search
- **Text**: Minimize free text, use autocomplete where possible
- **Camera**: Direct camera access for photos

---

### 8.3 Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:
- Keyboard navigation support (all functions accessible via keyboard)
- Screen reader compatibility (proper ARIA labels)
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text
- Focus indicators visible and clear
- No flashing content (seizure prevention)
- Text resizable up to 200% without loss of functionality
- Alternative text for all images and icons

**Multi-device Support**:
- Desktop: 1920x1080, 1366x768 (primary resolutions)
- Tablet: iPad (768x1024), Android tablets
- Mobile: iPhone (various), Android phones (360x640 minimum)

---

## 9. Data Model & Database Schema

### 9.1 Core Entities

**Note**: This is a high-level overview. Detailed database schema to be defined during implementation.

#### 9.1.1 Equipment (Equipo)

```sql
TABLE equipment (
  id UUID PRIMARY KEY,
  codigo_equipo VARCHAR(50) UNIQUE NOT NULL,
  ruc_proveedor VARCHAR(11) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
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
  año_fabricacion INT,
  codigo_externo VARCHAR(50),
  medidor_uso VARCHAR(20), -- 'horometro', 'odometro', 'ninguno'
  tipo_motor VARCHAR(50),
  estado VARCHAR(50), -- 'en_proyecto', 'disponible', 'mantenimiento'
  fecha_venc_poliza DATE,
  fecha_venc_soat DATE,
  fecha_venc_citv DATE,
  id_unidad_operacion VARCHAR(50),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  registrado_por VARCHAR(100),
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(100),
  proyecto_actual_id UUID,
  ubicacion_actual VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (proyecto_actual_id) REFERENCES proyectos(id)
);

CREATE INDEX idx_equipment_codigo ON equipment(codigo_equipo);
CREATE INDEX idx_equipment_estado ON equipment(estado);
CREATE INDEX idx_equipment_proyecto ON equipment(proyecto_actual_id);
CREATE INDEX idx_equipment_proveedor ON equipment(ruc_proveedor);
```

#### 9.1.2 Contracts (Contratos)

```sql
TABLE contratos (
  id UUID PRIMARY KEY,
  numero_contrato VARCHAR(100) UNIQUE NOT NULL,
  equipo_id UUID NOT NULL,
  proveedor_ruc VARCHAR(11) NOT NULL,
  fecha_contrato DATE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  duracion_dias INT GENERATED ALWAYS AS (fecha_fin - fecha_inicio) STORED,
  moneda VARCHAR(3), -- 'PEN', 'USD'
  tipo_tarifa VARCHAR(50), -- 'hourly', 'daily', 'monthly', 'fixed'
  tarifa DECIMAL(10,2),
  incluye_motor BOOLEAN DEFAULT FALSE,
  incluye_operador BOOLEAN DEFAULT FALSE,
  costo_adicional_motor DECIMAL(10,2),
  horas_incluidas INT,
  penalidad_exceso DECIMAL(10,2),
  condiciones_especiales TEXT,
  documento_url VARCHAR(500),
  estado VARCHAR(50), -- 'activo', 'proximo_vencer', 'vencido', 'extendido'
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (equipo_id) REFERENCES equipment(id),
  FOREIGN KEY (proveedor_ruc) REFERENCES proveedores(ruc)
);

CREATE INDEX idx_contratos_equipo ON contratos(equipo_id);
CREATE INDEX idx_contratos_proveedor ON contratos(proveedor_ruc);
CREATE INDEX idx_contratos_fecha_fin ON contratos(fecha_fin);
CREATE INDEX idx_contratos_estado ON contratos(estado);
```

#### 9.1.3 Addendums (Adendas)

```sql
TABLE adendas (
  id UUID PRIMARY KEY,
  numero_adenda VARCHAR(100) UNIQUE NOT NULL,
  contrato_id UUID NOT NULL,
  nueva_fecha_fin DATE NOT NULL,
  cambio_tarifa BOOLEAN DEFAULT FALSE,
  nueva_tarifa DECIMAL(10,2),
  nueva_moneda VARCHAR(3),
  justificacion TEXT NOT NULL,
  documento_url VARCHAR(500),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (contrato_id) REFERENCES contratos(id)
);

CREATE INDEX idx_adendas_contrato ON adendas(contrato_id);
```

#### 9.1.4 Daily Reports (Partes Diarios)

```sql
TABLE daily_reports (
  id UUID PRIMARY KEY,
  fecha DATE NOT NULL,
  equipo_id UUID NOT NULL,
  operador_id UUID NOT NULL,
  proyecto_id UUID NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  minutos_descanso INT DEFAULT 0,
  horas_trabajadas DECIMAL(4,2) GENERATED ALWAYS AS 
    ((hora_fin - hora_inicio) / 3600.0 - minutos_descanso / 60.0) STORED,
  horometro_inicial DECIMAL(10,2),
  horometro_final DECIMAL(10,2),
  horas_horometro DECIMAL(10,2),
  odometro_inicial DECIMAL(10,2),
  odometro_final DECIMAL(10,2),
  kilometros_recorridos DECIMAL(10,2),
  combustible_consumido DECIMAL(10,2) NOT NULL,
  tipo_combustible VARCHAR(50),
  lugar_abastecimiento VARCHAR(255),
  actividad_realizada VARCHAR(255) NOT NULL,
  ubicacion_trabajo VARCHAR(255),
  descripcion_adicional TEXT,
  estado_equipo VARCHAR(50), -- 'operativo', 'requiere_revision', 'averiado'
  observaciones TEXT,
  foto_urls TEXT[], -- Array of photo URLs
  estado VARCHAR(50) DEFAULT 'borrador', -- 'borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado'
  motivo_rechazo TEXT,
  fecha_aprobacion TIMESTAMP,
  aprobado_por VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(100),
  synced BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (equipo_id) REFERENCES equipment(id),
  FOREIGN KEY (operador_id) REFERENCES operadores(id),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
  
  CONSTRAINT unique_daily_report UNIQUE (fecha, equipo_id, operador_id)
);

CREATE INDEX idx_daily_reports_fecha ON daily_reports(fecha);
CREATE INDEX idx_daily_reports_equipo ON daily_reports(equipo_id);
CREATE INDEX idx_daily_reports_operador ON daily_reports(operador_id);
CREATE INDEX idx_daily_reports_proyecto ON daily_reports(proyecto_id);
CREATE INDEX idx_daily_reports_estado ON daily_reports(estado);
```

#### 9.1.5 Valuations (Valorizaciones)

```sql
TABLE valorizaciones (
  id UUID PRIMARY KEY,
  periodo_mes INT NOT NULL, -- 1-12
  periodo_año INT NOT NULL,
  equipo_id UUID NOT NULL,
  contrato_id UUID NOT NULL,
  proyecto_id UUID NOT NULL,
  proveedor_ruc VARCHAR(11) NOT NULL,
  dias_trabajados INT,
  horas_trabajadas DECIMAL(10,2),
  combustible_consumido DECIMAL(10,2),
  costo_base DECIMAL(12,2),
  costo_horas_exceso DECIMAL(12,2),
  costo_combustible DECIMAL(12,2),
  cargos_adicionales DECIMAL(12,2),
  total_valorizado DECIMAL(12,2),
  moneda VARCHAR(3),
  estado VARCHAR(50), -- 'pendiente', 'en_revision', 'aprobado', 'pagado'
  pdf_url VARCHAR(500),
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  generado_por VARCHAR(100),
  fecha_aprobacion TIMESTAMP,
  aprobado_por VARCHAR(100),
  observaciones TEXT,
  
  FOREIGN KEY (equipo_id) REFERENCES equipment(id),
  FOREIGN KEY (contrato_id) REFERENCES contratos(id),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
  FOREIGN KEY (proveedor_ruc) REFERENCES proveedores(ruc),
  
  CONSTRAINT unique_valorizacion UNIQUE (periodo_mes, periodo_año, equipo_id)
);

CREATE INDEX idx_valorizaciones_periodo ON valorizaciones(periodo_año, periodo_mes);
CREATE INDEX idx_valorizaciones_equipo ON valorizaciones(equipo_id);
CREATE INDEX idx_valorizaciones_proveedor ON valorizaciones(proveedor_ruc);
CREATE INDEX idx_valorizaciones_estado ON valorizaciones(estado);
```

#### 9.1.6 Operators (Operadores)

```sql
TABLE operadores (
  id UUID PRIMARY KEY,
  codigo_operador VARCHAR(50) UNIQUE NOT NULL,
  dni VARCHAR(8) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  nombre_completo VARCHAR(255) GENERATED ALWAYS AS (nombres || ' ' || apellidos) STORED,
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  foto_url VARCHAR(500),
  fecha_contratacion DATE,
  estado VARCHAR(50), -- 'activo', 'inactivo', 'suspendido'
  proyectos_asignados UUID[], -- Array of project IDs
  certificaciones JSONB, -- Array of certifications with expiry dates
  licencias JSONB, -- Licenses (e.g., driving license)
  equipos_autorizados UUID[], -- Array of equipment IDs operator is certified for
  usuario_id UUID, -- Link to users table for login
  fecha_registro TIMESTAMP DEFAULT NOW(),
  registrado_por VARCHAR(100),
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (usuario_id) REFERENCES users(id)
);

CREATE INDEX idx_operadores_dni ON operadores(dni);
CREATE INDEX idx_operadores_codigo ON operadores(codigo_operador);
CREATE INDEX idx_operadores_estado ON operadores(estado);
```

#### 9.1.7 Projects (Proyectos)

```sql
TABLE proyectos (
  id UUID PRIMARY KEY,
  codigo_proyecto VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  cliente VARCHAR(255),
  ubicacion VARCHAR(255),
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  fecha_fin_real DATE,
  presupuesto DECIMAL(15,2),
  moneda VARCHAR(3),
  estado VARCHAR(50), -- 'planificacion', 'activo', 'suspendido', 'completado'
  director_proyecto_id UUID,
  empresa_id UUID,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (director_proyecto_id) REFERENCES users(id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX idx_proyectos_codigo ON proyectos(codigo_proyecto);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_empresa ON proyectos(empresa_id);
```

#### 9.1.8 Providers (Proveedores)

```sql
TABLE proveedores (
  id UUID PRIMARY KEY,
  ruc VARCHAR(11) UNIQUE NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  tipo_proveedor VARCHAR(50), -- 'rental', 'owned', 'leased'
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  contacto_nombre VARCHAR(255),
  contacto_telefono VARCHAR(20),
  contacto_email VARCHAR(255),
  banco VARCHAR(100),
  numero_cuenta VARCHAR(50),
  tipo_cuenta VARCHAR(50),
  moneda_cuenta VARCHAR(3),
  estado VARCHAR(50), -- 'activo', 'inactivo'
  fecha_registro TIMESTAMP DEFAULT NOW(),
  registrado_por VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_proveedores_ruc ON proveedores(ruc);
CREATE INDEX idx_proveedores_razon_social ON proveedores(razon_social);
```

#### 9.1.9 Users (Usuarios)

```sql
TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL, -- 'company_director', 'project_director', 'equipment_manager', 'finance', 'operator', 'hr_manager'
  nivel_acceso INT, -- 1, 2, 3 (corresponding to hierarchy)
  proyectos_asignados UUID[], -- Array of project IDs
  empresas_asignadas UUID[], -- Array of company IDs
  is_active BOOLEAN DEFAULT TRUE,
  ultimo_login TIMESTAMP,
  intentos_fallidos INT DEFAULT 0,
  cuenta_bloqueada BOOLEAN DEFAULT FALSE,
  preferencias JSONB, -- User preferences (language, notifications, etc.)
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(100)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
```

#### 9.1.10 Maintenance Records (Registros Mantenimiento)

```sql
TABLE mantenimientos (
  id UUID PRIMARY KEY,
  equipo_id UUID NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_realizada DATE,
  tipo_mantenimiento VARCHAR(50), -- 'preventivo', 'correctivo', 'emergencia'
  descripcion TEXT NOT NULL,
  componentes_revisados TEXT[],
  tecnico_responsable_id UUID,
  costo_estimado DECIMAL(10,2),
  costo_real DECIMAL(10,2),
  estado VARCHAR(50), -- 'programado', 'en_proceso', 'completado', 'cancelado'
  observaciones TEXT,
  proxima_fecha_mantenimiento DATE,
  kilometraje_actual DECIMAL(10,2),
  horometro_actual DECIMAL(10,2),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  creado_por VARCHAR(100),
  
  FOREIGN KEY (equipo_id) REFERENCES equipment(id),
  FOREIGN KEY (tecnico_responsable_id) REFERENCES users(id)
);

CREATE INDEX idx_mantenimientos_equipo ON mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_fecha_programada ON mantenimientos(fecha_programada);
CREATE INDEX idx_mantenimientos_estado ON mantenimientos(estado);
```

#### 9.1.11 Audit Logs (Logs de Auditoría)

```sql
TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  username VARCHAR(100),
  action VARCHAR(50), -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'LOGIN', 'LOGOUT'
  resource_type VARCHAR(100), -- 'equipment', 'contract', 'daily_report', 'valuation', etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  device VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  result VARCHAR(50), -- 'success', 'failure'
  error_message TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

---

### 9.2 Database Relationships

**Key Relationships**:
1. Equipment → Contracts (1:Many) - One equipment can have multiple contracts over time
2. Contracts → Addendums (1:Many) - One contract can have multiple addendums
3. Equipment → Daily Reports (1:Many) - One equipment has many daily reports
4. Operators → Daily Reports (1:Many) - One operator submits many daily reports
5. Equipment → Valuations (1:Many) - One equipment has monthly valuations
6. Contracts → Valuations (1:Many) - One contract linked to multiple monthly valuations
7. Projects → Equipment (1:Many) - One project has many equipment assigned
8. Providers → Equipment (1:Many) - One provider supplies many equipment
9. Providers → Contracts (1:Many) - One provider has many contracts
10. Users → Projects (Many:Many) - Users can be assigned to multiple projects

---

## 10. API Specifications

### 10.1 API Design Principles

**RESTful API Standards**:
- Base URL: `https://api.bitcorp.com/v1`
- Use HTTP verbs correctly (GET, POST, PUT, PATCH, DELETE)
- Use plural nouns for resources (`/equipment`, `/contracts`, `/daily-reports`)
- Use hyphens for multi-word resources (not underscores)
- Return appropriate HTTP status codes
- Use JSON for request/response bodies
- Implement pagination for list endpoints
- Support filtering, sorting, searching via query parameters

**Authentication**: JWT Bearer Token in Authorization header

**Rate Limiting**: 
- 100 requests per minute per user (standard)
- 1000 requests per minute per user (admin)

---

### 10.2 Core API Endpoints

#### Equipment Management

```http
GET /v1/equipment
  Query Params: page, limit, status, provider, category, search, sort
  Response: { data: Equipment[], total: number, page: number }

POST /v1/equipment
  Body: EquipmentCreateDTO
  Response: { data: Equipment, message: string }

GET /v1/equipment/:id
  Response: { data: Equipment }

PUT /v1/equipment/:id
  Body: EquipmentUpdateDTO
  Response: { data: Equipment, message: string }

DELETE /v1/equipment/:id
  Response: { message: string }

GET /v1/equipment/:id/history
  Response: { data: AuditLog[] }

GET /v1/equipment/:id/daily-reports
  Query Params: startDate, endDate, page, limit
  Response: { data: DailyReport[], total: number }

GET /v1/equipment/:id/valuations
  Query Params: year, month
  Response: { data: Valuation[] }

POST /v1/equipment/:id/maintenance
  Body: MaintenanceCreateDTO
  Response: { data: Maintenance, message: string }

GET /v1/equipment/availability
  Query Params: startDate, endDate, projectId
  Response: { data: EquipmentAvailability[] }
```

#### Contract Management

```http
GET /v1/contracts
  Query Params: page, limit, equipment, provider, status, search
  Response: { data: Contract[], total: number }

POST /v1/contracts
  Body: ContractCreateDTO
  Response: { data: Contract, message: string }

GET /v1/contracts/:id
  Response: { data: Contract }

PUT /v1/contracts/:id
  Body: ContractUpdateDTO
  Response: { data: Contract, message: string }

POST /v1/contracts/:id/addendum
  Body: AddendumCreateDTO
  Response: { data: Addendum, message: string }

GET /v1/contracts/:id/addendums
  Response: { data: Addendum[] }

GET /v1/contracts/expiring
  Query Params: days (default: 30)
  Response: { data: Contract[] }

GET /v1/contracts/:id/pdf
  Response: File (application/pdf)
```

#### Daily Reports

```http
GET /v1/daily-reports
  Query Params: page, limit, date, equipment, operator, status, project
  Response: { data: DailyReport[], total: number }

POST /v1/daily-reports
  Body: DailyReportCreateDTO
  Response: { data: DailyReport, message: string }

GET /v1/daily-reports/:id
  Response: { data: DailyReport }

PUT /v1/daily-reports/:id
  Body: DailyReportUpdateDTO
  Response: { data: DailyReport, message: string }

POST /v1/daily-reports/:id/approve
  Response: { data: DailyReport, message: string }

POST /v1/daily-reports/:id/reject
  Body: { reason: string }
  Response: { data: DailyReport, message: string }

POST /v1/daily-reports/bulk-approve
  Body: { reportIds: UUID[] }
  Response: { success: number, failed: number }

POST /v1/daily-reports/sync
  Body: DailyReport[] (from offline queue)
  Response: { synced: number, failed: number, errors: any[] }

GET /v1/daily-reports/operator/:operatorId
  Query Params: page, limit, startDate, endDate
  Response: { data: DailyReport[], total: number }
```

#### Valuations

```http
GET /v1/valuations
  Query Params: page, limit, month, year, project, provider, equipment, status
  Response: { data: Valuation[], total: number }

POST /v1/valuations/generate
  Body: { month: number, year: number, projectId?: UUID }
  Response: { data: Valuation[], count: number, message: string }

GET /v1/valuations/:id
  Response: { data: Valuation }

POST /v1/valuations/:id/approve
  Response: { data: Valuation, message: string }

GET /v1/valuations/:id/pdf
  Response: File (application/pdf)

POST /v1/valuations/bulk-pdf
  Body: { valuationIds: UUID[] }
  Response: File (application/zip with multiple PDFs)

GET /v1/valuations/summary
  Query Params: month, year, projectId, providerId
  Response: { 
    totalAmount: number, 
    equipmentCount: number, 
    byProvider: ProviderSummary[],
    byEquipment: EquipmentSummary[]
  }

POST /v1/valuations/:id/send-email
  Body: { recipients: string[], subject?: string, message?: string }
  Response: { message: string }
```

#### Operators (Mobile API)

```http
POST /v1/auth/operator-login
  Body: { username: string, password: string }
  Response: { token: string, operator: Operator }

GET /v1/operators/me
  Headers: Authorization: Bearer <token>
  Response: { data: Operator }

GET /v1/operators/me/assignments
  Response: { data: Assignment[] } // Today's equipment assignments

GET /v1/operators/me/reports
  Query Params: page, limit, startDate, endDate
  Response: { data: DailyReport[], total: number }

PUT /v1/operators/me/profile
  Body: { phone: string, photo: File }
  Response: { data: Operator, message: string }
```

---

### 10.3 Error Responses

**Standard Error Format**:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error details"
    },
    "timestamp": "2025-11-07T10:30:00Z",
    "path": "/v1/equipment/123"
  }
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate, constraint violation)
- 422: Unprocessable Entity (business logic error)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
- 503: Service Unavailable

---

## 11. Testing Requirements

### 11.1 Unit Testing

**Coverage Target**: ≥80% code coverage

**Technologies**: Jest (backend), Jasmine/Karma (frontend)

**What to Test**:
- All business logic functions
- Data validation functions
- Calculation algorithms (valuation, hours, etc.)
- Utility functions
- Service methods
- Database repositories (with mocked DB)

**Test Naming Convention**:
```typescript
describe('EquipmentService', () => {
  describe('createEquipment', () => {
    it('should create equipment with valid data', () => {});
    it('should throw error when codigo_equipo is duplicate', () => {});
    it('should validate RUC format', () => {});
  });
});
```

---

### 11.2 Integration Testing

**Coverage Target**: All API endpoints tested

**Technologies**: Supertest (Node.js), Playwright Test (API Testing)

**What to Test**:
- API endpoint responses
- Database transactions
- Authentication/authorization
- Error handling
- Business logic integration
- Data integrity across operations

---

### 11.3 End-to-End Testing

**Coverage Target**: All critical user workflows

**Technology**: Playwright

**What to Test**:

**Admin Web Workflows**: