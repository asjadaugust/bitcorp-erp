---
name: bitcorp-prd-analyzer
description: Comprehensive analysis and extraction of BitCorp ERP PRD documents for mechanical equipment rental management (GEM - Gestión Equipo Mecánico). Extract business requirements, processes, validation rules, contract structures, pricing models, and terminology from Spanish-language documentation. Use when analyzing PRD-Raw documents, implementing features from specifications, understanding equipment lifecycle, valuation workflows, or mapping requirements to technical architecture. Essential for all BitCorp ERP development work.
license: Proprietary - BitCorp Internal Use
compatibility: Designed for BitCorp ERP project (Angular/Node.js/PostgreSQL stack)
metadata:
  domain: mechanical-equipment-rental-management
  language: spanish-primary-english-technical
  version: '1.0.0'
  project: bitcorp-erp
  author: bitcorp-dev-team
---

# BitCorp PRD Analyzer - Deep Analysis Skill

## Overview

This skill provides comprehensive understanding of BitCorp's mechanical equipment rental management (Gestión Equipo Mecánico - GEM) business domain. It enables extraction, analysis, and synthesis of requirements from Spanish-language PRD documents including process definitions, contracts, pricing models, and business presentations.

**Critical Context**: BitCorp manages a fleet of mechanical equipment (excavators, loaders, trucks, compressors, etc.) for construction projects. The system tracks equipment from quotation through contract execution, daily operations, monthly valuations, and contract closure.

---

## Domain Context: Gestión Equipo Mecánico (GEM)

### Business Domain

BitCorp operates in the **construction equipment rental** industry, specifically:

- **Primary Business**: Alquiler (rental) of mechanical equipment to construction projects
- **Equipment Types**: Maquinaria pesada (heavy machinery), vehículos pesados (heavy vehicles), vehículos livianos (light vehicles), equipos menores (small equipment)
- **Client Base**: Internal projects (Grupo ARAMSA) and external construction companies
- **Geographic Scope**: Peru (Spanish-language documentation and regulations)

### Core Business Model

1. **Equipment Sourcing**: Own fleet (equipos propios) + third-party rentals (equipos de terceros)
2. **Pricing Models**: Multiple tariff structures (hourly, daily, monthly) with/without minimums
3. **Contract Management**: Formal contracts (CORP-GEM-F-001) with legal requirements
4. **Valuation Cycle**: Monthly billing (valorización mensual) based on daily usage records (parte diario)
5. **Regulatory Compliance**: Peruvian transport, safety, and insurance regulations

---

## Document Types in PRD-Raw Folder

### 1. Process Documents (Procedimientos)

#### CORP-GEM-P-001: Gestión Equipo Mecánico V03

**Purpose**: Master process for equipment management lifecycle

**Key Sections**:

- **Objetivo**: Standardize equipment management process for Grupo ARAMSA
- **Alcance**: Covers requirement → quotation → selection → incorporation → contract → valuation → closure
- **Políticas**: Business rules and governance policies
- **Despliegue**: Detailed process steps with roles and responsibilities

**Process Stages**:

1. **Requerimiento y Cotización**: Equipment request and supplier quotation
2. **Incorporación de Equipo**: Equipment onboarding and checklist
3. **Elaboración y Seguimiento de Contrato**: Contract creation and tracking
4. **Valorización**: Monthly valuation and billing
5. **Cierre de Contrato**: Contract closure and final settlement

**Critical Business Rules** (from Políticas section):

- Todo ingreso de equipo requires orden de alquiler (rental order)
- Valorizaciones are MONTHLY based on contracted rates
- Minimum 2 quotations required (except single supplier)
- Equipment must have all legal documents BEFORE project entry
- Operators must have SCTR insurance, medical exams, PPE
- Equipment must have TREC insurance, SOAT, technical inspection certificates

**Key Roles**:

- Usuario: Project user requesting equipment
- Responsable de Equipo Mecánico: Equipment manager
- Administrador de Proyecto: Project administrator
- Responsable SSOMA: Health, safety, environment manager
- Jefe de Gestión Integral: Central office approval authority
- Coordinador de Control: Central control coordinator

**Registers/Forms**:

- CORP-LA-F-001: Requerimiento (requirement form)
- CORP-LA-F-012: Orden de Servicio (service order)
- CORP-GEM-F-001: Contrato de Alquiler de Equipo (rental contract)
- CORP-GEM-F-006: Lista de Equipos (equipment list)
- CORP-GEM-F-009: Matriz de Comparación de Proveedores (supplier comparison matrix)
- CORP-SSOMA-F-073: Checklist de Pre-Uso (pre-use checklist)
- CORP-REH-F-010: Inducción (operator induction)

#### CORP-GEM-P-002: Valorización de Equipo Mecánico V01

**Purpose**: Monthly valuation calculation and billing process

**Objetivo**: Establish guidelines for calculating monthly valuations of own and third-party equipment

**Alcance**: Applies to all infrastructure projects and conservation services

**Timeline Requirements** (Critical for Implementation):

- **Day 5**: Valorización Parcial (partial valuation) completed
  - Consolidate all partes diarios (daily reports)
  - Send to Responsable de Control for verification
- **Day 7**: Discount Reports received
  - Administrador sends expense deductions (repuestos, consumibles, EPPs)
  - Responsable de Taller sends advance deductions (equipos propios only)
- **Day 10**: Valorización Final (final valuation) completed
  - Includes all observations and deductions
  - Requires supplier conformity (approval)
- **Post Day 10**: Approval chain
  - Coordinador de Control validates
  - Responsables del Proyecto approve for payment

**Valorización Types** (3 formats):

1. **Alquiler Horas Máquina** (hourly rental) - CORP-GEM-F-002
2. **Alquiler Día** (daily rental) - CORP-GEM-F-003
3. **Alquiler Mes** (monthly rental) - CORP-GEM-F-004

**Business Rules**:

- Valorizaciones are MONTHLY in base to contracted tariffs and conditions
- Specific calculation procedure must be in each contract (Anexo B)
- Includes consolidation of daily equipment reports
- Deductions: repair costs, consumables, advances (equipos propios)
- Requires supplier conformity before finalization

**Registry**:

- CORP-GEM-F-011: Registro de Valorizaciones de equipos (central valuation registry)

### 2. Contract Template

#### CORP-GEM-F-001: Contrato de Alquiler de Equipo V01

**Purpose**: Standard rental contract format

**Expected Structure** (based on process reference):

- Identification of parties (BitCorp + Proveedor)
- Equipment description and specifications
- Tariff and payment conditions (references Anexo B)
- Service term (plazo)
- Responsibilities of each party
- Insurance and documentation requirements
- Penalty clauses (penalidades)
- Valuation methodology
- Termination conditions
- Legal dispute resolution

**Legalización Requirements**:

- 2 contract copies with provider signatures
- Notarial legalization
- Must match Orden de Alquiler terms

### 3. Pricing Models (Anexo B Variants)

#### Anexo B-TarifaDiariaConDiasMin.docx

**Model**: Daily tariff WITH minimum days

- Base daily rate (tarifa diaria base)
- Minimum billable days per period (días mínimos)
- Operator inclusion/exclusion
- Fuel inclusion/exclusion
- Maintenance responsibilities

#### Anexo B-TarifaDiariaSinDiasMin.docx

**Model**: Daily tariff WITHOUT minimum days

- Pay only for actual working days
- No minimum commitment
- Flexible for intermittent use

#### Anexo B-TarifaHorariaConHorasMin.docx

**Model**: Hourly tariff WITH minimum hours

- Base hourly rate (tarifa horaria base)
- Minimum billable hours per period (horas mínimas)
- Typical for high-utilization equipment

#### Anexo B-TarifaHorariaSinHorasMin.docx

**Model**: Hourly tariff WITHOUT minimum hours

- Pay per actual machine hours (horas máquina)
- Based on horímetro (hour meter) readings
- Strict usage tracking required

#### Anexo B-TarifaMensual.docx

**Model**: Monthly flat rate

- Fixed monthly fee regardless of usage
- Simplest billing model
- Typical for long-term dedicated equipment

**Common Elements Across All Anexo B**:

- Equipment identification (marca, modelo, año, placa/serie)
- Included/excluded items (operator, fuel, maintenance, insurance)
- Payment terms (forma de pago)
- Deduction rules (descuentos)
- Overtime rates (sobretiempo)
- Standby rates (stand-by)
- Mobilization/demobilization costs (movilización/desmovilización)

### 4. Reference Data

#### Anexo A.xlsx

**Purpose**: Supporting data tables or reference matrices
**Expected Content**: Equipment catalogs, rate tables, or supplier master data

### 5. Business Presentation

#### 03. Presentación SoftGEM V7-2.pdf

**Purpose**: SoftGEM system overview and business process visualization
**Expected Content**:

- System architecture diagrams
- Process flows with screenshots
- Feature descriptions
- Business case and benefits
- Implementation roadmap

### 6. Process Images

#### image0.png through image12.png

**Purpose**: Process flow diagrams, UI mockups, form examples
**Usage**: Visual reference for requirements and UI design

---

## Equipment Classification (Definiciones from CORP-GEM-P-001)

### Equipos Menores (Small Equipment)

- Compresora (air compressor)
- Cortadora de Cemento (concrete cutter)
- Equipo de Fisuras (crack repair equipment)
- Generador (generator)
- Hidrolavadora (pressure washer)
- Minifresadora (small milling machine)
- Motobomba (motor pump)
- Motosoldadora (welding generator)
- Tanque Imprimador (primer tank)
- Vibroapisonador (vibrating tamper)

### Vehículos Livianos (Light Vehicles)

- Camión Baranda (flatbed truck)
- Camioneta (pickup truck)
- Minivan
- Automóvil (car)

### Vehículos Pesados (Heavy Vehicles)

- Cisterna de Agua (water tanker)
- Cisterna de Combustible (fuel tanker)
- Cisterna de Emulsión (emulsion tanker)
- Volquetes (dump trucks)

### Maquinaria Pesada (Heavy Machinery)

- Cargador Frontal (wheel loader)
- Excavadora Sobre Orugas (tracked excavator)
- Pavimentador de Mortero Asfaltico (asphalt paver)
- Minicargador (skid steer loader)
- Motoniveladora (motor grader)
- Recicladora (road reclaimer)
- Retroexcavadora (backhoe)
- Rodillo Liso (smooth drum roller)
- Rodillo Neumático (pneumatic roller)

---

## Key Terminology Glossary

### Core Business Terms

| Spanish              | English Context   | Usage                                   |
| -------------------- | ----------------- | --------------------------------------- |
| **Alquiler**         | Rental            | Core business - equipment rental        |
| **Equipo**           | Equipment         | Generic term for all machinery/vehicles |
| **Proveedor**        | Supplier/Provider | Third-party equipment owner             |
| **Propios/Terceros** | Own/Third-party   | Equipment ownership classification      |
| **Valorización**     | Valuation/Billing | Monthly billing calculation             |
| **Parte Diario**     | Daily Report      | Daily equipment usage log               |
| **Tarifa**           | Tariff/Rate       | Pricing rate structure                  |
| **Horas Máquina**    | Machine Hours     | Equipment operating hours               |
| **Horímetro**        | Hour Meter        | Equipment hour counter                  |
| **Operador**         | Operator          | Equipment driver/operator               |

### Process Terms

| Spanish                  | English Context     | Usage                                 |
| ------------------------ | ------------------- | ------------------------------------- |
| **Requerimiento**        | Requirement         | Equipment request from project        |
| **Cotización**           | Quotation           | Supplier price quote                  |
| **Orden de Alquiler**    | Rental Order        | Formal equipment rental authorization |
| **Incorporación**        | Onboarding/Addition | Adding equipment to project           |
| **Checklist de Pre-Uso** | Pre-Use Checklist   | Equipment inspection before use       |
| **Contrato**             | Contract            | Legal rental agreement                |
| **Legalización**         | Legalization        | Notarial contract signing             |
| **Conformidad**          | Approval/Conformity | Official approval                     |
| **Cierre**               | Closure             | Contract termination                  |

### Financial Terms

| Spanish                          | English Context             | Usage                             |
| -------------------------------- | --------------------------- | --------------------------------- |
| **Valorización Parcial**         | Partial Valuation           | Preliminary monthly calculation   |
| **Valorización Final**           | Final Valuation             | Approved monthly billing          |
| **Descuentos**                   | Deductions/Discounts        | Expense deductions from billing   |
| **Adelantos**                    | Advances                    | Advance payments (deducted later) |
| **Gastos de Obra**               | Project Expenses            | Direct project costs              |
| **Repuestos**                    | Spare Parts                 | Replacement parts                 |
| **Consumibles**                  | Consumables                 | Supplies and consumables          |
| **Movilización/Desmovilización** | Mobilization/Demobilization | Transport costs                   |

### Regulatory/Safety Terms

| Spanish                        | English Context                               | Usage                                |
| ------------------------------ | --------------------------------------------- | ------------------------------------ |
| **SCTR**                       | Trabajo de Riesgo Insurance                   | Mandatory work risk insurance (Peru) |
| **SOAT**                       | Obligatorio de Accidentes de Tránsito         | Mandatory vehicle insurance (Peru)   |
| **TREC**                       | Todo Riesgo Equipo Contratista                | Contractor's all-risk insurance      |
| **EPPs**                       | Equipos de Protección Personal                | Personal protective equipment        |
| **SSOMA**                      | Seguridad, Salud Ocupacional y Medio Ambiente | Health, Safety, Environment          |
| **Revisión Técnica Vehicular** | Vehicle Technical Inspection                  | Mandatory vehicle inspection (Peru)  |
| **Licencia de Conducir**       | Driver's License                              | Operator license                     |
| **Kit Antiderrames**           | Spill Kit                                     | Environmental protection kit         |

### Document Codes

| Code Format          | Meaning                           |
| -------------------- | --------------------------------- |
| **CORP-GEM-P-XXX**   | Procedimiento (Process/Procedure) |
| **CORP-GEM-F-XXX**   | Formato (Form/Format)             |
| **CORP-GEM-C-XXX**   | Cartilla (Guide/Manual)           |
| **CORP-LA-F-XXX**    | Logística y Abastecimiento Form   |
| **CORP-SSOMA-F-XXX** | Safety, Health, Environment Form  |
| **CORP-REH-F-XXX**   | Recursos Humanos Form             |

---

## Business Rules and Validation Logic

### Equipment Entry Rules

```
RULE: Equipment Entry Authorization
IF equipo enters proyecto
THEN MUST have:
  - orden_de_alquiler (rental order) OR
  - requerimiento_aprobado (approved requirement)
VALIDATION: Check document exists before equipment.fecha_ingreso
```

```
RULE: Minimum Quotations
IF new equipment needed AND multiple suppliers exist
THEN MUST obtain >= 2 cotizaciones
ELSE IF only 1 supplier
THEN no comparison required
VALIDATION: Check cotizacion_count in CORP-GEM-F-009
```

```
RULE: Equipment Documentation Completeness
IF equipo_tipo IN (vehiculo_liviano, vehiculo_pesado, maquinaria_pesada)
THEN MUST have ALL documents:
  - tarjeta_propiedad (vehicle title)
  - soat_vigente (current SOAT insurance)
  - certificado_inspeccion_tecnica (technical inspection certificate)
  - poliza_trec_vigente (current TREC insurance)
  - permiso_circulacion (circulation permit)
AND IF transports_fuel OR transports_goods
THEN ALSO require:
  - certificado_transporte_hidrocarburos OR
  - certificado_transporte_mercancia
VALIDATION: All documents must be vigente (not expired)
```

```
RULE: Operator Requirements
IF operador assigned to equipo
THEN MUST have:
  - licencia_conducir_vigente (valid driver's license for equipment class)
  - sctr_salud (SCTR health insurance)
  - sctr_pension (SCTR pension insurance)
  - examenes_medicos_vigentes (current medical exams)
  - epps_completos (complete PPE)
  - induccion_completada (completed induction - CORP-REH-F-010)
VALIDATION: Check before equipment operation
```

### Valuation Rules

```
RULE: Monthly Valuation Timeline
IF mes_actual ends
THEN WITHIN 5 calendar days:
  - Create valoracion_parcial (consolidate all partes_diarios)
  - Send to responsable_control
WITHIN 7 calendar days:
  - Receive informe_descuentos_obra from administrador
  - Receive informe_descuentos_adelantos from responsable_taller (equipos_propios only)
WITHIN 10 calendar days:
  - Create valoracion_final
  - Obtain conformidad_proveedor
  - Submit for approval
VALIDATION: Monitor due_dates for compliance
```

```
RULE: Valuation Type Selection
IF contrato.tipo_tarifa = "HOURLY"
THEN use CORP-GEM-F-002 (Horas Máquina format)
ELSE IF contrato.tipo_tarifa = "DAILY"
THEN use CORP-GEM-F-003 (Día format)
ELSE IF contrato.tipo_tarifa = "MONTHLY"
THEN use CORP-GEM-F-004 (Mes format)
VALIDATION: Format must match contrato.anexo_b
```

```
RULE: Minimum Billing Calculation
IF contrato has minimos_horas OR minimos_dias
THEN monthly_charge = MAX(actual_usage * tarifa, minimos * tarifa)
ELSE monthly_charge = actual_usage * tarifa
VALIDATION: Check contrato.condiciones_minimas
```

```
RULE: Equipment Deductions (Equipos de Terceros)
IF equipo.tipo = "TERCEROS"
THEN apply deductions:
  - gastos_repuestos (from administrador report)
  - gastos_consumibles (from administrador report)
  - gastos_epps (from administrador report)
final_amount = valoracion_bruta - total_descuentos
VALIDATION: All descuentos must have sustaining documentation
```

```
RULE: Equipment Advances (Equipos Propios)
IF equipo.tipo = "PROPIOS"
THEN apply deductions:
  - adelantos_recibidos (from responsable_taller report)
  - gastos_obra (from administrador report)
final_amount = valoracion_bruta - total_descuentos - total_adelantos
VALIDATION: Track adelantos.saldo_pendiente across months
```

### Contract Management Rules

```
RULE: Contract Legalization
IF contrato created
THEN MUST:
  - Generate 2 physical copies
  - Send to proveedor for signature
  - Obtain notarial_legalization on both copies
  - Store 1 copy with proyecto
  - Store 1 copy with oficina_central
VALIDATION: contrato.estado = "LEGALIZADO" required before equipment operation
```

```
RULE: Contract-Order Consistency
IF contrato generated from orden_alquiler
THEN MUST match:
  - equipment specifications
  - tarifa amounts
  - payment conditions
  - service term
VALIDATION: Cross-check contrato fields with orden_alquiler
```

### Supplier Selection Rules

```
RULE: Own Equipment Priority
IF equipment_needed AND equipo_propio available in taller_aramsa
THEN prioritize equipo_propio OVER terceros
ELSE IF no equipo_propio available OR insufficient capacity
THEN proceed with terceros quotation
VALIDATION: Check disponibilidad_taller before external quotation
```

```
RULE: Local Supplier Evaluation
IF proveedor is local (same project location)
THEN responsable_administrador must:
  - Evaluate proveedor capabilities
  - Verify proveedor legal status
  - Confirm proveedor insurance coverage
VALIDATION: Document evaluation in supplier selection matrix
```

---

## Integration with BitCorp Architecture

### Mapping to ARCHITECTURE.md Principles

#### Database Schema (Spanish Naming)

All table and column names MUST be in Spanish per ARCHITECTURE.md Section 2.3:

```sql
-- Equipment Management Tables
CREATE TABLE equipos (
  id_equipo SERIAL PRIMARY KEY,
  codigo_equipo VARCHAR(50) NOT NULL,  -- Per CORP-GEM-C-001
  tipo_equipo VARCHAR(50),  -- equipos_menores, vehiculos_livianos, etc.
  marca VARCHAR(100),
  modelo VARCHAR(100),
  anio_fabricacion INTEGER,
  placa_serie VARCHAR(50),
  tipo_propiedad VARCHAR(20),  -- PROPIOS | TERCEROS
  id_proveedor INTEGER REFERENCES proveedores(id_proveedor),
  estado VARCHAR(20),  -- DISPONIBLE | EN_PROYECTO | MANTENIMIENTO | RETIRADO
  fecha_incorporacion DATE,
  horimetro_actual INTEGER,  -- For equipment with hour meters
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contratos_alquiler (
  id_contrato SERIAL PRIMARY KEY,
  numero_contrato VARCHAR(50) UNIQUE NOT NULL,  -- CORP-GEM-F-001
  id_equipo INTEGER REFERENCES equipos(id_equipo),
  id_proveedor INTEGER REFERENCES proveedores(id_proveedor),
  id_proyecto INTEGER REFERENCES proyectos(id_proyecto),
  tipo_tarifa VARCHAR(20),  -- HORARIA | DIARIA | MENSUAL
  tarifa_base DECIMAL(10,2),
  tiene_minimos BOOLEAN DEFAULT FALSE,
  minimos_cantidad INTEGER,  -- horas_minimas or dias_minimos
  incluye_operador BOOLEAN DEFAULT FALSE,
  incluye_combustible BOOLEAN DEFAULT FALSE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado_contrato VARCHAR(20),  -- BORRADOR | LEGALIZADO | ACTIVO | CERRADO
  anexo_b_referencia VARCHAR(100),  -- Which Anexo B model used
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE partes_diarios_equipo (
  id_parte_diario SERIAL PRIMARY KEY,
  id_equipo INTEGER REFERENCES equipos(id_equipo),
  id_contrato INTEGER REFERENCES contratos_alquiler(id_contrato),
  fecha DATE NOT NULL,
  horas_trabajadas DECIMAL(5,2),  -- For hourly equipment
  horimetro_inicial INTEGER,
  horimetro_final INTEGER,
  opero BOOLEAN DEFAULT TRUE,  -- Did equipment work this day?
  id_operador INTEGER REFERENCES operadores(id_operador),
  observaciones TEXT,
  created_by INTEGER REFERENCES usuarios(id_usuario),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE valorizaciones_equipo (
  id_valorizacion SERIAL PRIMARY KEY,
  id_contrato INTEGER REFERENCES contratos_alquiler(id_contrato),
  mes INTEGER NOT NULL,  -- 1-12
  anio INTEGER NOT NULL,
  tipo_valorizacion VARCHAR(20),  -- PARCIAL | FINAL
  formato_usado VARCHAR(50),  -- CORP-GEM-F-002 | F-003 | F-004
  monto_bruto DECIMAL(12,2),
  total_descuentos_obra DECIMAL(12,2) DEFAULT 0,
  total_descuentos_adelantos DECIMAL(12,2) DEFAULT 0,
  monto_neto DECIMAL(12,2),
  fecha_parcial DATE,
  fecha_final DATE,
  conformidad_proveedor BOOLEAN DEFAULT FALSE,
  fecha_conformidad DATE,
  aprobado_control BOOLEAN DEFAULT FALSE,
  aprobado_proyecto BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Design (snake_case Response Contract)

Per ARCHITECTURE.md Section 3.1 and 3.2, all API responses MUST use snake_case:

```typescript
// DTO Example: Equipment List Response
interface EquipoListResponseDTO {
  success: true;
  data: {
    id_equipo: number;
    codigo_equipo: string;
    tipo_equipo: string;
    marca: string;
    modelo: string;
    placa_serie: string;
    tipo_propiedad: 'PROPIOS' | 'TERCEROS';
    estado: string;
    proveedor: {
      id_proveedor: number;
      razon_social: string;
    } | null;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// DTO Example: Valuation Detail Response
interface ValorizacionDetailDTO {
  success: true;
  data: {
    id_valorizacion: number;
    contrato: {
      numero_contrato: string;
      tipo_tarifa: string;
      tarifa_base: number;
    };
    equipo: {
      codigo_equipo: string;
      tipo_equipo: string;
      marca: string;
      modelo: string;
    };
    mes: number;
    anio: number;
    tipo_valorizacion: 'PARCIAL' | 'FINAL';
    monto_bruto: number;
    descuentos: {
      gastos_obra: number;
      adelantos: number;
      total: number;
    };
    monto_neto: number;
    partes_diarios: {
      fecha: string;
      horas_trabajadas: number;
      opero: boolean;
    }[];
    conformidad_proveedor: boolean;
    aprobado_control: boolean;
    aprobado_proyecto: boolean;
  };
}
```

#### Service Layer Organization

Per ARCHITECTURE.md Section 4.2:

```typescript
// backend/src/services/equipos.service.ts
export class EquiposService {
  // Business logic for equipment management
  async solicitarEquipo(requerimiento: RequerimientoDTO) {}
  async cotizarEquipo(equipoId: number) {}
  async incorporarEquipo(equipo: EquipoCreateDTO) {}
  async crearContrato(contrato: ContratoDTO) {}
}

// backend/src/services/valorizaciones.service.ts
export class ValorizacionesService {
  // Business logic for monthly valuations
  async calcularValorizacionParcial(contratoId: number, mes: number, anio: number) {}
  async aplicarDescuentos(valorizacionId: number, descuentos: DescuentosDTO) {}
  async finalizarValorizacion(valorizacionId: number) {}
  async obtenerConformidadProveedor(valorizacionId: number) {}
}
```

#### Frontend Components (Reusable & Composable)

Per ARCHITECTURE.md Section 5.2:

```typescript
// frontend/src/app/modules/equipos/components/
// - equipo-list.component.ts (Generic table)
// - equipo-filter.component.ts (Reusable filter)
// - contrato-wizard.component.ts (Multi-step contract creation)
// - valorizacion-form.component.ts (Monthly valuation form)
// - parte-diario-table.component.ts (Daily report grid)
```

---

## Cross-Reference Guide

### How Documents Relate

```
Requerimiento (User needs equipment)
    ↓
CORP-GEM-P-001 § 1: Requerimiento y Cotización
    ↓
Cotización + Matriz Comparación (CORP-GEM-F-009)
    ↓
Orden de Alquiler (CORP-LA-F-012)
    ↓
CORP-GEM-P-001 § 2: Incorporación
    ↓
Checklist Pre-Uso (CORP-SSOMA-F-073)
    ↓
CORP-GEM-P-001 § 3: Elaboración Contrato
    ↓
Contrato (CORP-GEM-F-001) + Anexo B (pricing model)
    ↓
Legalización Notarial
    ↓
Equipment Operation (Daily)
    ↓
Partes Diarios de Equipo (daily logs)
    ↓ (Monthly)
CORP-GEM-P-002: Valorización Process
    ↓ (Day 5)
Valorización Parcial (CORP-GEM-F-002/003/004)
    ↓ (Day 7)
Informes de Descuentos (Administrador + Taller)
    ↓ (Day 10)
Valorización Final + Conformidad Proveedor
    ↓
Approval Chain (Control → Proyecto)
    ↓
Payment Authorization
    ↓
Registro Central (CORP-GEM-F-011)
```

### Finding Information Across Documents

**To understand equipment types**:
→ CORP-GEM-P-001, Section 4.1 Definiciones

**To understand process flow**:
→ CORP-GEM-P-001, Section 5 Despliegue
→ CORP-GEM-P-002, Section 4.2 Descripción del Procedimiento

**To understand pricing structures**:
→ Anexo B variants (5 different models)
→ CORP-GEM-F-001 contract template (references Anexo B)

**To understand valuation calculations**:
→ CORP-GEM-P-002 (monthly cycle)
→ CORP-GEM-F-002/003/004 (valuation formats by tariff type)

**To understand timeline requirements**:
→ CORP-GEM-P-002 timeline (Day 5, 7, 10 milestones)

**To understand regulatory requirements**:
→ CORP-GEM-P-001, Section 3 Referencias Legales
→ CORP-GEM-P-001, Section 4.2 Políticas (safety/insurance requirements)

**To understand roles and responsibilities**:
→ CORP-GEM-P-001, Section 5 Despliegue (Responsable column)
→ CORP-GEM-P-002, Section 5 Responsabilidades

**To find form templates**:
→ Each process section lists required forms in "Registro" column

---

## Usage Patterns for Implementation

### When Implementing Equipment Module

1. **Read**: CORP-GEM-P-001 sections 1-4 for business context
2. **Extract**: Equipment types from Section 4.1 Definiciones → Create enum/catalog
3. **Map**: Process stages in Section 5 Despliegue → Define workflow states
4. **Identify**: Forms listed in Registro column → Create form components
5. **Validate**: Business rules in Section 4.2 Políticas → Implement validation logic
6. **Reference**: ARCHITECTURE.md for naming conventions (Spanish tables, snake_case API)

### When Implementing Valuation Module

1. **Read**: CORP-GEM-P-002 for complete valuation cycle
2. **Extract**: Timeline milestones (Day 5, 7, 10) → Create scheduled jobs/reminders
3. **Identify**: Three valuation formats → Create format-specific templates
4. **Map**: Deduction types → Create descuentos data structure
5. **Implement**: Approval workflow (Proveedor → Control → Proyecto)
6. **Cross-reference**: Anexo B models to understand tariff calculations

### When Implementing Contract Module

1. **Read**: CORP-GEM-P-001 Section 3 (Contract Elaboration)
2. **Analyze**: Anexo B variants → Create pricing configuration
3. **Design**: Contract wizard matching Orden de Alquiler → Contrato flow
4. **Implement**: Multi-step form (equipment selection → terms → pricing → review)
5. **Validate**: Contract-Order consistency rules
6. **Track**: Legalization status workflow

### When Creating New Documentation

1. **Use**: doc-coauthoring skill for structured documentation workflow
2. **Reference**: Existing PRD terminology for consistency
3. **Follow**: ARCHITECTURE.md principles for technical documentation
4. **Generate**: Markdown format for internal technical docs
5. **Generate**: PDF/DOCX format for business stakeholder docs (using pdf/docx skills)

---

## Validation Checklist for Implementation

Use this checklist when implementing features from PRD specifications:

### ✅ Terminology Consistency

- [ ] All Spanish business terms preserved (equipos, proveedores, valorización)
- [ ] Database tables and columns in Spanish (per ARCHITECTURE.md)
- [ ] API responses use snake_case (per ARCHITECTURE.md)
- [ ] DTOs properly transform camelCase → snake_case

### ✅ Business Rules Compliance

- [ ] Equipment entry requires orden_alquiler
- [ ] Minimum 2 quotations (unless single supplier)
- [ ] All regulatory documents validated before equipment entry
- [ ] Operator requirements checked (SCTR, medical exams, PPE, license)
- [ ] Monthly valuation timeline enforced (Day 5, 7, 10)
- [ ] Correct valuation format selected based on tariff type
- [ ] Deductions properly calculated and documented

### ✅ Process Flow Adherence

- [ ] Requerimiento → Cotización → Orden → Incorporación → Contrato → Valorización → Cierre
- [ ] Approval chain implemented (user → administrator → central office)
- [ ] Status transitions tracked (BORRADOR → LEGALIZADO → ACTIVO → CERRADO)

### ✅ Document Traceability

- [ ] Each form code (CORP-GEM-F-XXX) mapped to database table/form component
- [ ] Cross-references between documents maintained
- [ ] Audit trail for approvals and modifications

### ✅ Architecture Compliance

- [ ] Standard API response contract (success, data, pagination/error)
- [ ] DTOs used instead of raw entities
- [ ] Service layer contains business logic
- [ ] Controllers handle request/response transformation only
- [ ] Reusable frontend components (generic tables, filters, wizards)

---

## Skill Activation Triggers

This skill should be automatically loaded when:

- User mentions "PRD", "requirements", "business process", or "specification"
- User references specific documents: "CORP-GEM-P-001", "Anexo B", "contrato", "valorización"
- User asks about equipment types, tariff models, or valuation processes
- User needs to map business requirements to technical implementation
- User is implementing modules: equipos, contratos, valorizaciones, proveedores
- User asks about Spanish terminology or business domain concepts
- User needs to understand process flows or document relationships

---

## Best Practices for Using This Skill

### For Analysis Tasks

1. Specify which document or process section you're analyzing
2. Request specific information: terminology, business rules, timeline, or workflow
3. Cross-reference related documents for complete understanding

### For Implementation Tasks

1. Start with business context from process documents
2. Extract specific business rules and validation requirements
3. Map to ARCHITECTURE.md technical standards
4. Validate Spanish terminology preservation
5. Ensure API contract compliance (snake_case, DTOs)

### For Documentation Tasks

1. Use doc-coauthoring skill for structured writing
2. Reference this skill for accurate business terminology
3. Include cross-references to PRD source documents
4. Generate markdown for technical docs, PDF/DOCX for business docs

### For Troubleshooting

1. Check if implementation matches PRD business rules
2. Verify terminology consistency (Spanish database, snake_case API)
3. Confirm process flow adherence
4. Validate document traceability

---

## Additional Reference Files

See `references/` directory for:

- **process-workflows.md**: Detailed flowcharts and state diagrams
- **form-mappings.md**: Complete mapping of CORP-GEM-F-XXX forms to database/UI
- **regulatory-compliance.md**: Peruvian legal requirements and document checklist
- **calculation-formulas.md**: Detailed valuation calculation examples by tariff type

---

## Version History

- **v1.0.0** (2026-01-17): Initial comprehensive skill creation
  - Deep analysis of CORP-GEM-P-001, CORP-GEM-P-002
  - Business rules extraction and validation logic
  - Complete terminology glossary
  - Architecture integration mapping
  - Cross-reference guide and usage patterns
