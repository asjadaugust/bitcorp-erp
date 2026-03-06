# PRD: AI/ML Innovation Features — BitCorp ERP

**Product**: BitCorp ERP (Construction Equipment Rental Management)
**Client**: Grupo Aramsa, Peru
**Document Version**: 1.0
**Date**: 2026-03-05
**Status**: DRAFT — Pending Product Owner Approval
**Author**: Engineering Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Current System Baseline](#4-current-system-baseline)
5. [Feature Catalog](#5-feature-catalog)
   - [Category 1: Predictive Analytics](#category-1-predictive-analytics)
   - [Category 2: Anomaly Detection](#category-2-anomaly-detection)
   - [Category 3: Optimization & Operations Research](#category-3-optimization--operations-research)
   - [Category 4: Natural Language & LLM](#category-4-natural-language--llm)
   - [Category 5: Computer Vision](#category-5-computer-vision)
   - [Category 6: Smart Automation](#category-6-smart-automation)
   - [Category 7: Strategic Intelligence](#category-7-strategic-intelligence)
6. [Showcase Features ("Wow Factor")](#6-showcase-features-wow-factor)
7. [Implementation Phases](#7-implementation-phases)
8. [Technical Architecture](#8-technical-architecture)
9. [Dependencies & Risks](#9-dependencies--risks)
10. [Approval & Sign-Off](#10-approval--sign-off)

---

## 1. Executive Summary

BitCorp ERP manages the full lifecycle of construction equipment rentals — from requests and contracts through daily operations and monthly valuations to payments. The system currently handles **56 data models**, **50+ backend services**, **48 API routes**, and **25 frontend feature modules** with **zero AI/ML capabilities**.

This PRD proposes **47 AI/ML features across 7 categories** that leverage the rich operational data already collected (hours, fuel, downtime, maintenance, costs, operator assignments) to deliver:

- **Predictive maintenance** to prevent costly breakdowns
- **Anomaly detection** to catch fraud, theft, and data quality issues
- **Optimization solvers** for equipment/operator allocation
- **Natural language interfaces** (Claude API) for conversational ERP access
- **Computer vision** for OCR and photo analysis
- **Smart automation** to reduce manual data entry
- **Strategic dashboards** for executive decision-making

**Investment Justification**: These features transform BitCorp from a record-keeping system into an intelligent decision platform, creating competitive differentiation while reducing operational costs through predictive analytics and optimization.

---

## 2. Business Context

### 2.1 Current Pain Points

| Pain Point                                         | Impact                                               | Features That Address It |
| -------------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| Equipment breakdowns are reactive, not predicted   | Downtime costs, emergency repairs, project delays    | 1.1, 6.4, 3.3            |
| Fuel theft/waste goes undetected                   | Financial losses of 5-15% of fuel budget             | 2.1, 2.2                 |
| Manual daily report entry is slow and error-prone  | Operator frustration, data quality issues            | 6.1, 2.3                 |
| Equipment allocation is manual and suboptimal      | Idle equipment on one project while another needs it | 3.1, 7.6                 |
| Contract analysis requires reading dozens of pages | Missed penalties, unfavorable terms                  | 4.2                      |
| No cross-system visibility for executives          | Decisions made on incomplete information             | 7.1, 7.2, 7.4, 4.1       |
| Valuation anomalies caught late                    | Payment disputes, revenue leakage                    | 2.4, 6.6                 |
| Document/certificate expiries tracked manually     | Compliance risk, operational stoppages               | 6.7                      |

### 2.2 Users & Stakeholders

| Role                      | Count (est.) | Primary Interest                          | Key Features                |
| ------------------------- | :----------: | ----------------------------------------- | --------------------------- |
| **Director / CEO**        |     2-3      | Strategic oversight, fleet optimization   | 4.1, 7.1, 7.2, 7.4, WOW 1-3 |
| **Project Manager (PM)**  |     5-10     | Daily operations, equipment performance   | 1.1, 2.1, 2.2, 6.1, 3.1     |
| **Finance Manager**       |     2-3      | Cost control, payment accuracy            | 2.4, 1.3, 3.4, 7.5          |
| **Operator / Supervisor** |    20-50     | Fast data entry, fewer errors             | 6.1, 4.3, 6.5               |
| **Procurement Manager**   |     2-3      | Supplier management, contract negotiation | 4.2, 3.5, 7.3               |
| **Maintenance Manager**   |     2-3      | Preventive maintenance, scheduling        | 1.1, 6.4, 3.3               |
| **Safety Manager (SST)**  |     1-2      | Incident prevention, compliance           | 2.5, 4.5, 5.3               |
| **Logistics Manager**     |     1-2      | Inventory optimization                    | 2.7                         |

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

| Goal                                 | Target                                  | Measurement                                             |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------- |
| Reduce unplanned equipment downtime  | -30% within 6 months of deployment      | Comparing `periodo_inoperatividad` records before/after |
| Detect fuel anomalies proactively    | Catch 80%+ of anomalies within 24 hours | Anomaly detection recall vs. manual audit results       |
| Reduce daily report entry time       | -50% time per report                    | User survey + session analytics                         |
| Improve equipment utilization rate   | +10% fleet-wide utilization             | `parte_diario` utilization calculations                 |
| Accelerate executive decision-making | Real-time cross-system visibility       | Qualitative CEO feedback                                |

### 3.2 Technical Goals

| Goal                              | Target                                                     |
| --------------------------------- | ---------------------------------------------------------- |
| AI feature response time          | < 2 seconds for rule-based, < 10 seconds for LLM features  |
| Model accuracy (where applicable) | > 80% precision on anomaly detection, > 70% on predictions |
| Multi-tenant isolation            | All AI models and data strictly tenant-scoped              |
| System stability                  | Zero degradation of existing ERP performance               |

---

## 4. Current System Baseline

### 4.1 Existing Data Assets

| Data Source        | Model(s)                                                   | Records (est.) | Relevance                                  |
| ------------------ | ---------------------------------------------------------- | :------------: | ------------------------------------------ |
| Daily Reports      | `parte_diario`, `parte_diario_detalle`                     |      10K+      | Hours, horometro, production, delays, fuel |
| Fuel Vouchers      | `vale_combustible`, `analisis_combustible`                 |      5K+       | Consumption tracking, gal/hr ratios        |
| Maintenance        | `programa_mantenimiento`, `mantenimiento_equipo`           |      2K+       | Scheduled/unscheduled maintenance history  |
| Equipment Registry | `equipo`, `tipo_equipo`                                    |      100+      | Fleet inventory, status, specifications    |
| Contracts          | `contrato_adenda`, `contrato_obligacion`                   |      200+      | Terms, rates, obligations                  |
| Valuations         | `valorizacion_equipo`, `valorizacion_detalle`              |      1K+       | Monthly billing calculations               |
| Inoperability      | `periodo_inoperatividad`                                   |      500+      | Downtime records with causes               |
| Operators          | `operador`, `operador_habilidad`, `certificacion_operador` |      50+       | Skills, certifications, availability       |
| Safety Incidents   | `incidente_sst`, `reporte_acto_condicion`                  |      200+      | Incident records, root causes              |
| Payments           | `registro_pago`, `cuenta_por_pagar`                        |      1K+       | Payment history, delays                    |
| Projects           | `proyecto`, `equipo_edt`                                   |      20+       | Work breakdown, budgets                    |
| Suppliers          | `proveedor`, `evaluacion_proveedor`                        |      50+       | Performance evaluations                    |

### 4.2 Existing Analytics Capabilities

The system already has an analytics service (`app/servicios/analitica.py`) providing:

- Fleet utilization metrics (total, active, avg %, top 5, underutilized)
- Per-equipment utilization (hours worked, inactive, fuel cost/hr)
- Daily utilization trends
- Fuel metrics (consumption, per-hour ratio, cost, efficiency rating)
- Maintenance metrics (total, cost, pending)

**Gap**: These are **descriptive** (what happened). The AI features add **predictive** (what will happen), **prescriptive** (what to do), and **cognitive** (understand natural language) capabilities.

### 4.3 Existing Scheduled Tasks

The cron service (`app/servicios/cron.py`) already handles:

- Maintenance due alerts (7-day lookahead)
- Contract expiry alerts (30-day lookahead)
- Operator certification expiry alerts (30-day lookahead)

**Opportunity**: Extend this infrastructure for AI model retraining, anomaly detection scans, and predictive alert generation.

---

## 5. Feature Catalog

### Category 1: Predictive Analytics

> **Theme**: Shift from reactive to proactive operations by forecasting equipment performance, costs, and demand.

---

#### Feature 1.1 — Equipment Failure Prediction

**Priority**: HIGH | **Complexity**: Medium | **Tech**: Gradient Boosted Trees (scikit-learn)

**Description**
Predict the probability of equipment breakdown in the next 7, 14, and 30 days using historical mechanical delay patterns, maintenance records, and horometro trends. Display risk scores on the equipment detail page and maintenance dashboard.

**User Story**

> As a **Maintenance Manager**, I want to see which equipment is most likely to fail in the next 7-30 days so that I can schedule preventive maintenance before breakdowns occur.

**Acceptance Criteria**

- [ ] System calculates a failure risk score (0-100%) per equipment unit
- [ ] Risk scores update daily via scheduled job
- [ ] Dashboard shows equipment ranked by failure risk with color-coded severity (green/yellow/orange/red)
- [ ] Clicking an equipment row shows contributing factors (e.g., "High horometro delta", "Overdue maintenance", "Recent delay pattern")
- [ ] Risk threshold alerts (>70%) generate notifications for the Maintenance Manager
- [ ] Model retrains weekly with new data

**Data Sources**

- `parte_diario` — horas_trabajadas, horometro_inicial/final, delay codes
- `programa_mantenimiento` — scheduled vs. actual completion dates
- `periodo_inoperatividad` — historical downtime events and causes
- `equipo` — tipo_equipo, estado, fecha_ingreso (age)

**Business Impact**

- Reduces unplanned downtime by enabling proactive maintenance
- Estimated 20-30% reduction in emergency repair costs

---

#### Feature 1.2 — Utilization Forecasting

**Priority**: HIGH | **Complexity**: Medium | **Tech**: Prophet / SARIMAX

**Description**
Forecast fleet and per-equipment utilization rates for the next 30, 60, and 90 days based on historical usage patterns, seasonal trends, and project schedules.

**User Story**

> As a **Director**, I want to see projected fleet utilization for the next quarter so that I can make informed decisions about equipment purchases, rentals, and project staffing.

**Acceptance Criteria**

- [ ] System generates 30/60/90-day utilization forecasts per equipment and fleet-wide
- [ ] Forecast chart overlays historical trend with confidence intervals
- [ ] Forecasts are accessible from the analytics dashboard
- [ ] Model accounts for seasonality (construction seasons) and project schedules
- [ ] Forecast accuracy tracking: system logs predicted vs. actual for continuous improvement
- [ ] Alert when forecasted utilization drops below configurable threshold (e.g., <50%)

**Data Sources**

- `parte_diario` — daily utilization data (horas_trabajadas / horas_disponibles)
- `contrato_adenda` — contract start/end dates indicating demand windows
- `solicitud_equipo` — equipment requests as leading demand indicators

**Business Impact**

- Enables proactive fleet sizing decisions
- Prevents both idle equipment costs and capacity shortages

---

#### Feature 1.3 — Fuel Consumption Forecasting

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: Prophet / Linear Regression

**Description**
Predict fuel consumption per equipment per week/month to support accurate budget planning and procurement.

**User Story**

> As a **Finance Manager**, I want accurate fuel consumption forecasts so that I can set realistic budgets and negotiate bulk fuel purchase agreements.

**Acceptance Criteria**

- [ ] Weekly and monthly fuel consumption predictions per equipment and per project
- [ ] Forecast considers equipment type baseline, utilization patterns, and seasonal factors
- [ ] Budget comparison view: forecasted fuel cost vs. allocated budget
- [ ] Alerts when projected spending exceeds budget threshold (configurable %)
- [ ] Historical accuracy display showing past forecast precision

**Data Sources**

- `vale_combustible` — fuel quantities, dates, equipment assignments
- `analisis_combustible` — fuel efficiency analysis data
- `parte_diario` — hours worked (usage intensity)
- `tipo_equipo` — expected consumption rates by type

**Business Impact**

- More accurate fuel budgets (currently estimated manually)
- Identifies cost-saving opportunities through procurement optimization

---

#### Feature 1.4 — Contract Renewal Risk Scoring

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Logistic Regression / XGBoost

**Description**
Score each active contract by renewal likelihood (0-100%) based on equipment utilization, payment history, inoperability frequency, and supplier evaluation scores.

**User Story**

> As a **Director**, I want to know which contracts are at risk of non-renewal so that I can proactively address issues and plan for fleet changes.

**Acceptance Criteria**

- [ ] Each active contract shows a renewal risk score with contributing factors
- [ ] Contracts sorted by risk on a dedicated view
- [ ] Risk factors are explainable (e.g., "Low utilization: 35%", "2 late payments", "Supplier eval: 2.1/5")
- [ ] Trend line showing how risk has changed over the contract period
- [ ] Alerts for high-risk contracts (>60% non-renewal probability)

**Data Sources**

- `contrato_adenda` — contract terms, dates, rates
- `valorizacion_equipo` — monthly billing and utilization
- `registro_pago` — payment timeliness
- `periodo_inoperatividad` — downtime frequency
- `evaluacion_proveedor` — supplier satisfaction scores

**Business Impact**

- Proactive contract retention
- Better fleet planning when non-renewals are anticipated

---

#### Feature 1.5 — Maintenance Cost Forecasting

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Random Forest Regressor

**Description**
Predict next-month maintenance costs per equipment type and per project to support budget allocation.

**User Story**

> As a **Finance Manager**, I want to forecast maintenance expenses so that I can allocate budgets accurately and avoid surprises.

**Acceptance Criteria**

- [ ] Monthly maintenance cost prediction per equipment type and per project
- [ ] Breakdown by maintenance type (preventive, corrective, emergency)
- [ ] Comparison to historical averages and trends
- [ ] Budget variance alerts when predicted costs exceed allocation
- [ ] Model considers equipment age, usage intensity, and maintenance history

**Data Sources**

- `programa_mantenimiento` — maintenance records with costs
- `equipo` — equipment age and type
- `parte_diario` — usage intensity
- `centro_costo` — budget allocations

**Business Impact**

- Reduces budget variance on maintenance line items
- Enables proactive cost management

---

#### Feature 1.6 — Equipment Demand Forecasting

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Time Series + Regression

**Description**
Predict equipment type demand per project for the next quarter based on historical request patterns and project phases.

**User Story**

> As a **Director**, I want to anticipate which equipment types will be needed next quarter so that I can pre-negotiate rentals and avoid project delays.

**Acceptance Criteria**

- [ ] Quarterly demand forecast by equipment type and project
- [ ] Visual demand heatmap (equipment type × month)
- [ ] Comparison with current fleet capacity
- [ ] Gap analysis: "You'll need 3 additional excavators in Q2"
- [ ] Historical accuracy tracking

**Data Sources**

- `solicitud_equipo` — historical equipment requests (type, quantity, dates)
- `equipo_edt` — equipment-to-project assignments
- `contrato_adenda` — contract periods indicating demand

**Business Impact**

- Reduces emergency equipment procurement
- Optimizes long-term rental/purchase decisions

---

#### Feature 1.7 — Equipment Resale Value Prediction

**Priority**: LOW-MEDIUM | **Complexity**: Medium | **Tech**: Random Forest Regressor

**Description**
Predict the optimal time to sell owned heavy machinery by forecasting its future resale value against its projected maintenance costs and depreciation curve.

**User Story**

> As a **Finance Manager**, I want the system to tell me exactly when an excavator stops being profitable to keep and maintains enough residual value to sell, so we can maximize our return on assets.

**Acceptance Criteria**

- [ ] Forecasted depreciation curve plotted against projected maintenance costs.
- [ ] Calculates the "Optimal Replacement Point" (inflection point where keeping the machine costs more than replacing it).
- [ ] Considers current market trends for used heavy equipment (web scraping or manual index input).
- [ ] Alert 6 months prior to the predicted optimal replacement window.

**Data Sources**

- `equipo` — purchase price, age, model.
- `programa_mantenimiento` — historical and projected maintenance costs.
- `parte_diario` — cumulative horometro (wear and tear).

**Business Impact**

- Maximizes asset lifecycle profitability.
- Transforms fleet renewal from a reactive guess to a data-driven financial strategy.

---

#### Feature 1.7 — Payment Delay Prediction

**Priority**: LOW-MEDIUM | **Complexity**: Low | **Tech**: Logistic Regression

**Description**
Predict which valuations are likely to experience delayed payments, per supplier, to support cash flow planning.

**User Story**

> As a **Finance Manager**, I want to know which payments are likely to be delayed so that I can manage cash flow proactively and escalate early.

**Acceptance Criteria**

- [ ] Each pending valuation shows a delay probability (%)
- [ ] Ranked list of "at-risk" payments on finance dashboard
- [ ] Contributing factors visible (supplier history, valuation amount, season)
- [ ] Integration with existing payment scheduling views

**Data Sources**

- `registro_pago` — historical payment dates vs. due dates
- `valorizacion_equipo` — valuation amounts and dates
- `proveedor` — supplier payment track record

**Business Impact**

- Improved cash flow management
- Earlier escalation for at-risk payments

---

### Category 2: Anomaly Detection

> **Theme**: Proactively identify data quality issues, potential fraud, and operational anomalies before they become costly problems.

---

#### Feature 2.1 — Fuel Consumption Anomalies

**Priority**: HIGH | **Complexity**: Low-Medium | **Tech**: Isolation Forest / Z-score

**Description**
Detect abnormal gallons-per-hour ratios compared to equipment type baselines. Flags potential fuel theft, mechanical inefficiency, or data entry errors.

**User Story**

> As a **Project Manager**, I want to be alerted when any equipment shows abnormal fuel consumption so that I can investigate potential theft or mechanical problems immediately.

**Acceptance Criteria**

- [ ] System calculates baseline gal/hr per equipment type from historical data
- [ ] Each fuel voucher entry is compared against the baseline
- [ ] Anomalies flagged with severity: WARNING (1.5-2x baseline), CRITICAL (>2x baseline)
- [ ] Anomaly alerts delivered via notification system with link to the specific voucher
- [ ] Dashboard view showing all active anomalies with trends
- [ ] Configurable sensitivity threshold per equipment type
- [ ] False-positive dismissal with reason tracking

**Data Sources**

- `vale_combustible` — cantidad_galones, id_equipo, fecha
- `parte_diario` — horas_trabajadas for the same period
- `tipo_equipo` — expected gal/hr reference values

**Business Impact**

- Industry benchmarks suggest 5-15% of fuel costs are lost to theft/waste
- Even 50% detection rate represents significant savings

---

#### Feature 2.2 — Horometer/Odometer Tampering Detection

**Priority**: HIGH | **Complexity**: Low | **Tech**: Rule-based + Moving Average

**Description**
Detect impossible horometer/odometer readings: reversals (final < initial), unrealistic jumps (e.g., 50+ hours in a day), zero-progression during reported work hours, and significant deviations from moving average.

**User Story**

> As a **Project Manager**, I want the system to automatically catch suspicious horometer readings so that billing accuracy and equipment tracking are not compromised.

**Acceptance Criteria**

- [ ] Real-time validation on daily report entry: warns operator before submission
- [ ] Post-submission batch scan catches readings that slip through
- [ ] Detection rules:
  - Reversal: `horometro_final < horometro_inicial`
  - Gap: today's `horometro_inicial ≠ yesterday's horometro_final`
  - Excessive: `horometro_final - horometro_inicial > 24` (physical impossibility)
  - Zero-work: `horas_trabajadas > 0` but `horometro_delta = 0`
- [ ] Flagged records appear in a "Data Quality" review queue
- [ ] Severity classification: ERROR (impossible), WARNING (suspicious)
- [ ] Impact on valuation calculations highlighted

**Data Sources**

- `parte_diario` — horometro_inicial, horometro_final, horas_trabajadas
- Sequential daily reports per equipment (time series)

**Business Impact**

- Prevents billing errors caused by incorrect horometer data
- Deters data manipulation
- Improves accuracy of maintenance scheduling (based on horometro)

---

#### Feature 2.3 — Daily Report Quality Flags

**Priority**: MEDIUM-HIGH | **Complexity**: Low | **Tech**: Rule-based + Outlier Detection

**Description**
Flag daily reports with suspicious patterns that indicate data quality issues: zero hours with reported production, missing required fields, hours exceeding shift length, or statistical outliers in production metrics.

**User Story**

> As a **Project Manager**, I want daily reports with quality issues flagged automatically so that I can focus my review time on the reports that need attention.

**Acceptance Criteria**

- [ ] Quality score (A/B/C/D) assigned to each daily report
- [ ] Flag categories: INCONSISTENCY, MISSING_DATA, OUTLIER, IMPOSSIBLE_VALUE
- [ ] Specific flags:
  - Zero hours but non-zero production
  - Hours > shift maximum (e.g., >14 hours)
  - Missing operator or project assignment
  - Production values >2σ from equipment-type mean
- [ ] PM dashboard shows daily report quality summary with drill-down
- [ ] Quality trends tracked per operator and project

**Data Sources**

- `parte_diario` — all fields (hours, production, delays, operator)
- `parte_diario_detalle` — detailed breakdown
- Historical distributions per equipment type and project

**Business Impact**

- Reduces PM time spent reviewing daily reports by ~40%
- Improves overall data quality for downstream analytics

---

#### Feature 2.4 — Valuation Calculation Anomalies

**Priority**: MEDIUM-HIGH | **Complexity**: Low | **Tech**: Z-score vs. Historical Mean

**Description**
Flag valuations that deviate significantly from expected ranges per contract type, equipment type, and historical patterns.

**User Story**

> As a **Finance Manager**, I want to be alerted when a valuation seems abnormally high or low compared to expectations so that I can verify calculations before approval.

**Acceptance Criteria**

- [ ] Each valuation compared against historical mean ± 2σ for same equipment/contract type
- [ ] Anomaly flags: TOO_HIGH, TOO_LOW, FIRST_OCCURRENCE (no baseline)
- [ ] Contributing factors shown (e.g., "25% above 6-month average for this contract")
- [ ] Flag appears in the valuation approval workflow
- [ ] Monthly anomaly summary report for Finance

**Data Sources**

- `valorizacion_equipo` — calculated amounts, equipment, contract
- `contrato_adenda` — tariff type and rates
- Historical valuation distributions

**Business Impact**

- Prevents billing errors and payment disputes
- Increases confidence in monthly valuation process

---

#### Feature 2.5 — Safety Incident Clustering

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: DBSCAN Clustering

**Description**
Detect clusters of safety incidents by location, time period, and type that may indicate systemic safety issues requiring intervention.

**User Story**

> As a **Safety Manager**, I want to identify patterns in safety incidents — clusters by project, time, or type — so that I can implement targeted preventive measures.

**Acceptance Criteria**

- [ ] Cluster detection runs weekly on incident data
- [ ] Clusters identified by: project, incident type, time window, severity
- [ ] Visual cluster map showing incident concentrations
- [ ] Alert when a new cluster is detected (3+ incidents of similar type in 30 days at same project)
- [ ] Cluster report includes recommended actions based on incident types

**Data Sources**

- `incidente_sst` — incident records (tipo, ubicacion, fecha, gravedad)
- `reporte_acto_condicion` — near-miss reports
- `proyecto` — project locations

**Business Impact**

- Identifies systemic safety issues before they cause serious incidents
- Supports regulatory compliance documentation

---

#### Feature 2.6 — Supplier Performance Degradation

**Priority**: MEDIUM | **Complexity**: Low | **Tech**: Moving Average + Threshold

**Description**
Alert when a supplier's reliability, equipment uptime, or response times drop significantly from their historical baseline.

**User Story**

> As a **Procurement Manager**, I want early warning when a supplier's performance is declining so that I can intervene before it impacts operations.

**Acceptance Criteria**

- [ ] Rolling 90-day performance score per supplier (composite of uptime, response, quality)
- [ ] Alert when score drops >15% from 6-month baseline
- [ ] Trend visualization per supplier
- [ ] Integration with existing supplier evaluation views
- [ ] Degradation factors itemized (e.g., "Uptime dropped from 95% to 82%")

**Data Sources**

- `evaluacion_proveedor` — manual evaluation scores
- `periodo_inoperatividad` — equipment downtime per supplier's equipment
- `programa_mantenimiento` — maintenance response times

**Business Impact**

- Proactive supplier management
- Data-driven basis for contract renegotiation or supplier change

---

#### Feature 2.7 — Inventory Stock-Out Prediction

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: Exponential Smoothing

**Description**
Predict when logistics items (parts, consumables) will reach stock-out based on consumption trends, reorder times, and seasonal patterns.

**User Story**

> As a **Logistics Manager**, I want to know which items are trending toward stock-out so that I can reorder before we run out and halt operations.

**Acceptance Criteria**

- [ ] Predicted stock-out date per item based on consumption rate
- [ ] Items sorted by urgency (days until stock-out)
- [ ] Considers lead time for reorder
- [ ] Alert at configurable thresholds (e.g., "10 days to stock-out")
- [ ] Seasonal consumption adjustment

**Data Sources**

- `producto` — current stock levels
- `movimiento_inventario` — consumption history
- `solicitud_material` — demand signals

**Business Impact**

- Prevents operational stoppages due to missing parts
- Optimizes inventory carrying costs

---

### Category 3: Optimization & Operations Research

> **Theme**: Apply mathematical optimization to allocation, scheduling, and resource management problems that are currently solved by manual judgment.

---

#### Feature 3.1 — Equipment-to-Project Allocation Optimizer

**Priority**: HIGH | **Complexity**: High | **Tech**: Linear Programming (PuLP / scipy)

**Description**
Solve the assignment problem: allocate N available equipment units to M project demands, minimizing total cost (transport + idle time + mismatch penalties) while satisfying all constraints.

**User Story**

> As a **Director**, I want the system to recommend the optimal allocation of equipment across projects, minimizing costs while ensuring all project needs are met.

**Acceptance Criteria**

- [ ] Input: available equipment (with current location), project demands (type, quantity, dates)
- [ ] Output: recommended assignment matrix with total cost
- [ ] Constraints: equipment type compatibility, availability windows, transport costs
- [ ] Comparison with current allocation: "Potential savings: S/. X,XXX/month"
- [ ] What-if mode: adjust inputs and re-solve
- [ ] User can accept/reject/modify recommendations

**Data Sources**

- `equipo` — fleet inventory, current assignments, status
- `solicitud_equipo` — project demands
- `proyecto` — project locations
- `contrato_adenda` — rental rates

**Business Impact**

- Optimal allocation can reduce fleet costs by 10-20%
- Eliminates idle equipment while satisfying all demands

---

#### Feature 3.1b — Dynamic Pricing Optimization for Outbound Rentals

**Priority**: LOW-MEDIUM | **Complexity**: High | **Tech**: Reinforcement Learning / Elasticity Models

**Description**
If ARAMSA rents out its own idle equipment to third parties (sub-leasing), this algorithm suggests the optimal rental price based on current market demand, competitor availability, and the specific machine's depreciation.

**User Story**

> As a **Commercial Manager**, I want the system to suggest the most profitable rental rate for our idle machinery so we don't leave money on the table when demand is high, and we don't lose deals when demand is low.

**Acceptance Criteria**

- [ ] Analyzes historical rental win/loss rates against quoted prices.
- [ ] Suggests daily/hourly rates for outbound rentals based on seasonality and current fleet utilization (inventories).
- [ ] "Floor price" calculation ensuring the rental covers minimum depreciation and maintenance costs.

**Data Sources**

- `cotizacion_proveedor` (Historical outbound quotes if available).
- `equipo` — current availability and holding costs.

**Business Impact**

- Maximizes revenue from the owned fleet during off-peak project periods.
- Replaces static rate cards with profit-maximizing dynamic rates.

---

#### Feature 3.2 — Operator-Equipment Assignment Optimizer

**Priority**: HIGH | **Complexity**: High | **Tech**: Hungarian Algorithm / CSP

**Description**
Optimally assign operators to equipment based on skills, certifications, availability, performance history, and location, maximizing overall operational efficiency.

**User Story**

> As a **Project Manager**, I want the system to recommend the best operator for each piece of equipment based on qualifications and performance history.

**Acceptance Criteria**

- [ ] Matching score per operator-equipment pair based on:
  - Required certifications vs. operator certifications
  - Equipment type proficiency
  - Historical performance on similar equipment
  - Availability and shift preferences
- [ ] Ranked recommendations for each equipment assignment
- [ ] Constraint enforcement: no double-booking, certification compliance
- [ ] Visual assignment matrix
- [ ] Override capability with reason tracking

**Data Sources**

- `operador` — operator profiles
- `operador_habilidad` — skills and proficiency levels
- `certificacion_operador` — certifications with expiry dates
- `disponibilidad_operador` — availability schedules
- `parte_diario` — historical performance per equipment type

**Business Impact**

- Better operator-equipment fit improves productivity
- Ensures certification compliance automatically

---

#### Feature 3.3 — Maintenance Schedule Optimization

**Priority**: HIGH | **Complexity**: High | **Tech**: Constraint Programming (OR-Tools)

**Description**
Minimize fleet-wide downtime by scheduling maintenance during low-utilization windows, balancing maintenance urgency with operational needs.

**User Story**

> As a **Maintenance Manager**, I want an optimized maintenance schedule that minimizes fleet downtime by scheduling work during low-utilization periods.

**Acceptance Criteria**

- [ ] Input: maintenance due dates (from horometro thresholds), utilization forecasts, crew availability
- [ ] Output: optimized maintenance calendar minimizing total fleet downtime
- [ ] Constraints: maximum concurrent maintenances, crew capacity, critical equipment priority
- [ ] Comparison: "Optimized schedule saves X hours of productive time vs. first-come scheduling"
- [ ] Drag-and-drop calendar for manual adjustments
- [ ] Re-optimization when inputs change

**Data Sources**

- `programa_mantenimiento` — maintenance schedules and types
- `parte_diario` — utilization patterns (identify low-use windows)
- `equipo` — equipment criticality and project assignments

**Business Impact**

- Reduces productive time lost to maintenance by 15-25%
- Balances maintenance workload across crew

---

#### Feature 3.4 — Payment Schedule Optimization

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: LP Scheduling

**Description**
Optimize payment timing to maximize cash flow while respecting contractual deadlines, taking advantage of early payment discounts where available.

**User Story**

> As a **Finance Manager**, I want an optimized payment schedule that maximizes our cash position while meeting all obligations on time.

**Acceptance Criteria**

- [ ] Input: pending payments with due dates, amounts, and discount terms
- [ ] Output: optimized payment calendar with projected daily cash position
- [ ] Constraints: due dates, minimum cash balance, early payment discount thresholds
- [ ] Scenario comparison: "Optimized schedule saves S/. X,XXX in discounts / interest"
- [ ] Manual override with constraint violation warnings

**Data Sources**

- `cuenta_por_pagar` — payables with due dates
- `registro_pago` — payment history
- `caja_banco` — current cash position

**Business Impact**

- Improved cash flow management
- Capture early payment discounts where beneficial

---

#### Feature 3.5 — Contract Rate Benchmarking

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: Statistical + Percentile Ranking

**Description**
Analyze historical contract rates by equipment type, modality, and supplier to provide negotiation benchmarks and identify above/below-market rates.

**User Story**

> As a **Procurement Manager**, I want to know how a proposed contract rate compares to our historical rates and market benchmarks so that I can negotiate better terms.

**Acceptance Criteria**

- [ ] Benchmark rates per equipment type + modality (hourly, daily, monthly)
- [ ] Percentile ranking: "This rate is at the 75th percentile of your contracts"
- [ ] Trend analysis: rates over time
- [ ] Supplier comparison: same equipment type across suppliers
- [ ] Auto-populate benchmark on new contract creation
- [ ] Alert when proposed rate is above 80th percentile

**Data Sources**

- `contrato_adenda` — historical rates by type and modality
- `tipo_equipo` — equipment classifications
- `proveedor` — supplier information
- `cotizacion_proveedor` — quotation data

**Business Impact**

- Data-driven negotiation support
- Identifies overpriced contracts for renegotiation

---

#### Feature 3.6 — Fleet Right-Sizing

**Priority**: MEDIUM-HIGH | **Complexity**: High | **Tech**: Multi-criteria Decision Analysis

**Description**
Recommend which equipment to add, remove, or replace based on utilization data, maintenance costs, demand forecasts, and age analysis.

**User Story**

> As a **Director**, I want data-driven recommendations on fleet composition — which equipment to keep, add, or phase out — to optimize total fleet costs.

**Acceptance Criteria**

- [ ] Per-equipment score: value (utilization × revenue) vs. cost (maintenance + downtime + depreciation)
- [ ] Fleet-level recommendations: "Remove 2 underutilized dump trucks, add 1 excavator"
- [ ] Supporting data for each recommendation
- [ ] What-if simulator: change fleet composition and see projected impact
- [ ] Annual review report generation

**Data Sources**

- `equipo` — fleet inventory, age, type
- `parte_diario` — utilization data
- `programa_mantenimiento` — maintenance costs
- `periodo_inoperatividad` — downtime history
- `valorizacion_equipo` — revenue contribution
- `solicitud_equipo` — demand patterns

**Business Impact**

- Prevents capital waste on underutilized equipment
- Ensures fleet matches actual demand patterns

---

#### Feature 3.7 — "Dead Rent" Minimization Scheduler (Daily Dispatch)

**Priority**: HIGH | **Complexity**: High | **Tech**: Heuristic / Job-Shop Scheduling

**Description**
Optimize daily dispatching of equipment to work fronts based on contractual minimums. Ensures rented equipment hits its "Tarifa Horaria con Horas Mínimas" before using owned machinery or rentals without quotas.

**User Story**

> As a **Project Manager**, I want the system to tell my dispatchers exactly which machines to use today so we don't accidentally leave a machine idle that we're already forced to pay a minimum 180 hours/month for.

**Acceptance Criteria**

- [ ] Reads contract terms (CORP-GEM-F-001 / Anexo B) to identify machines with minimum hourly/daily quotas.
- [ ] Tracks current accumulated hours vs. monthly quota target in real-time.
- [ ] Generates a daily dispatch recommendation prioritizing machines at risk of missing their minimums.
- [ ] Alerts when project demand is too low to satisfy all minimum quotas across rented fleet.
- [ ] Option to manually override with reason tracking.

**Data Sources**

- `contrato_adenda` — tariff types and minimum hour/day clauses.
- `parte_diario` — accumulated hours worked in the current billing cycle.
- `solicitud_equipo` — daily demand/work fronts.

**Business Impact**

- Direct elimination of "Stand-by" penalties paid to third-party suppliers.
- Maximizes ROI on rigid rental contracts.

---

#### Feature 3.8 — Optimal Routing for Fuel Tankers (Vehicle Routing)

**Priority**: MEDIUM | **Complexity**: High | **Tech**: Inventory Routing Problem (IRP)

**Description**
Calculate the optimal daily route for the fuel tanker (Cisterna de Combustible) across large project sites, ensuring all heavy machinery is refueled just-in-time while minimizing the tanker's travel distance.

**User Story**

> As a **Logistics Manager**, I want an optimized route for our fuel tanker so that no excavator runs out of gas mid-shift, and the tanker doesn't waste time driving aimlessly around a 50km road project.

**Acceptance Criteria**

- [ ] Input: GPS locations (or assigned work fronts) of active heavy machinery.
- [ ] Input: Predicted current fuel levels (using Feature 1.3 models).
- [ ] Output: Turn-by-turn route or sequence list for the tanker operator.
- [ ] Constraint: Tanker capacity vs. total refueling demand.
- [ ] Auto-reconciles the route completion against actual Vales de Combustible (CORP-LA-F-004) submitted.

**Data Sources**

- `vale_combustible` — historical and current refueling events.
- `parte_diario` — utilization correlating to fuel drain.
- `equipo_edt` — current location/work front assignment.

**Business Impact**

- Prevents costly operational stoppages due to "out of fuel" equipment.
- Optimizes the tanker operator's time and fuel usage.
- Tightens the audit loop on fuel vouchers.

---

### Category 4: Natural Language & LLM

> **Theme**: Make the entire ERP accessible through natural language, automate document analysis, and generate human-readable narratives from data.

---

#### Feature 4.1 — BitCorp Copilot (Conversational ERP Assistant)

**Priority**: HIGH | **Complexity**: High | **Tech**: Claude API + SQL/Function Calling

**Description**
Chat interface where any user can ask questions in Spanish and get live answers from the database. The copilot translates natural language to queries, executes them safely (read-only), and returns formatted responses with tables, charts, and recommendations.

**User Story**

> As a **CEO/Director**, I want to ask the ERP questions in plain Spanish — like "Cuantos equipos estan inoperativos hoy y por que?" — and get instant answers without navigating multiple pages.

**Acceptance Criteria**

- [ ] Chat panel accessible from any ERP page (slide-out sidebar or floating widget)
- [ ] Supports Spanish natural language queries
- [ ] Query types: counts, aggregations, comparisons, time ranges, filtered lists
- [ ] Response formats: plain text, tables, summary statistics
- [ ] Read-only: no data modification through chat
- [ ] Context-aware: understands ERP domain terminology
- [ ] Conversation memory within session
- [ ] Query audit log for security
- [ ] Fallback: "I couldn't understand that. Try asking about equipment, contracts, projects, or operations."
- [ ] Example prompts provided for new users

**Example Queries**

- "Cuantas horas trabajo el equipo EX-001 en enero?"
- "Cual es el equipo con mayor consumo de combustible este mes?"
- "Muestrame los contratos que vencen en los proximos 30 dias"
- "Que operadores tienen certificaciones vencidas?"
- "Comparar utilizacion de febrero vs marzo por tipo de equipo"

**Data Sources**

- All database schemas accessible via read-only SQL generation
- Schema metadata for query understanding

**Business Impact**

- Makes 120+ pages of ERP accessible through a single interface
- Reduces time-to-insight from minutes to seconds
- Highest "wow factor" for executive demos

---

#### Feature 4.2 — Contract Clause Analyzer

**Priority**: HIGH | **Complexity**: Medium | **Tech**: Claude API (Document Analysis)

**Description**
Upload a contract PDF and have the system extract key information: tariff type, rates, minimums, penalties, obligations, and important dates. Auto-populate contract creation fields from the extracted data.

**User Story**

> As a **Procurement Manager**, I want to upload a contract PDF and have the system extract all the key terms so that I don't have to manually read 30+ pages and risk missing obligations.

**Acceptance Criteria**

- [ ] PDF upload interface on contract creation page
- [ ] Extracts: tariff type, rates, minimum guarantees, penalty clauses, start/end dates, parties, obligations
- [ ] Extracted fields presented for review before auto-populating form
- [ ] Highlights unusual clauses or terms that deviate from standard contracts
- [ ] Supports multi-page contracts in Spanish
- [ ] Confidence scores per extracted field
- [ ] Human review required before saving (no auto-save)

**Data Sources**

- Uploaded contract PDFs
- `contrato_adenda` schema for field mapping
- Historical contracts as reference baseline

**Business Impact**

- Reduces contract review time from hours to minutes
- Catches obligations that might be missed in manual review

---

#### Feature 4.3 — Daily Report Narrative Generator

**Priority**: MEDIUM | **Complexity**: Low | **Tech**: Claude API

**Description**
Auto-generate the "observaciones" (observations) field in daily reports from the numeric data already entered (hours, production, delays, fuel consumption).

**User Story**

> As an **Operator**, I want the system to suggest an observations narrative based on the numbers I've already entered so that I can submit reports faster with more complete documentation.

**Acceptance Criteria**

- [ ] "Generate Observations" button on daily report form
- [ ] Narrative includes: equipment status summary, notable events, delay explanations
- [ ] Generated in Spanish appropriate for field reports
- [ ] Editable before submission (suggestion only)
- [ ] Contextual: references specific delays, production anomalies
- [ ] Does NOT replace operator's ability to write manual observations

**Data Sources**

- `parte_diario` form fields (current entry)
- `parte_diario_detalle` — delay and production breakdowns
- Historical reports for the same equipment (patterns)

**Business Impact**

- Reduces report completion time by 5-10 minutes per report
- Improves documentation quality for audit trail

---

#### Feature 4.4 — Valuation Executive Summary

**Priority**: MEDIUM | **Complexity**: Low | **Tech**: Claude API

**Description**
Auto-generate a plain-language executive summary of monthly valuation financials, highlighting key metrics, variances, and trends.

**User Story**

> As a **Director**, I want a plain-language summary of each monthly valuation — not just numbers — that tells me what's important and what needs attention.

**Acceptance Criteria**

- [ ] "Generate Summary" button on valuation view
- [ ] Summary includes: total valuation amount, comparison to previous month, notable variances, equipment highlights
- [ ] Written in executive-friendly Spanish
- [ ] Actionable insights highlighted (e.g., "Equipment EX-003 underutilized at 25% — consider reallocation")
- [ ] Exportable as part of valuation PDF report

**Data Sources**

- `valorizacion_equipo` — current and historical valuations
- `valorizacion_detalle` — line-item details
- `contrato_adenda` — contract terms for context

**Business Impact**

- Saves executive time in valuation review meetings
- Highlights issues that might be buried in spreadsheets

---

#### Feature 4.5 — Safety 5-Why Root Cause Assistant

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Claude API + RAG

**Description**
Guide the 5-Why root cause analysis for safety incidents by suggesting root causes based on similar historical incidents (RAG — Retrieval Augmented Generation).

**User Story**

> As a **Safety Manager**, I want AI-assisted 5-Why analysis that suggests root causes from similar past incidents so that we build on institutional knowledge.

**Acceptance Criteria**

- [ ] Available on incident report form during 5-Why entry
- [ ] Retrieves similar historical incidents by type, location, equipment
- [ ] Suggests potential root causes based on similar incidents' conclusions
- [ ] Each suggestion linked to the source incident for verification
- [ ] Operator can accept, modify, or reject suggestions
- [ ] Learns from accepted suggestions to improve future recommendations

**Data Sources**

- `incidente_sst` — incident records
- `reporte_acto_condicion` — por_que_1 through por_que_5 fields
- Historical root cause analyses (embedded for RAG)

**Business Impact**

- Accelerates incident investigation
- Prevents recurring incidents by surfacing historical patterns

---

#### Feature 4.6 — Supplier Evaluation Narrative

**Priority**: LOW-MEDIUM | **Complexity**: Low | **Tech**: Claude API

**Description**
Auto-generate structured evaluation summaries from supplier scoring data, creating consistent, professional evaluation reports.

**User Story**

> As a **Procurement Manager**, I want auto-generated supplier evaluation narratives that I can include in procurement reports and share with management.

**Acceptance Criteria**

- [ ] "Generate Evaluation" button on supplier evaluation page
- [ ] Narrative covers: overall score, strengths, weaknesses, comparison to peers, recommendation
- [ ] Consistent structure across all supplier evaluations
- [ ] Editable before finalization
- [ ] Historical comparison: "Performance improved by 12% vs. last evaluation"

**Data Sources**

- `evaluacion_proveedor` — scoring data across categories
- Historical evaluations for trend analysis
- `proveedor` — supplier profile information

**Business Impact**

- Consistent, professional evaluation documentation
- Saves ~30 minutes per evaluation report

---

#### Feature 4.7 — Intelligent Cross-Module Search

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Claude API (Intent Routing)

**Description**
Unified search bar that routes natural language queries to the correct module with pre-applied filters. Acts as a lightweight alternative to the full Copilot.

**User Story**

> As **any user**, I want to type what I'm looking for in a search bar — like "contratos de excavadoras vencidos" — and be taken directly to the right page with filters applied.

**Acceptance Criteria**

- [ ] Global search bar in the top navigation
- [ ] Understands intent: entity type (equipment, contract, operator, etc.) + filters (date range, status, type)
- [ ] Routes to the correct module page with filters pre-applied
- [ ] Fallback: if intent unclear, shows categorized results from all modules
- [ ] Recent searches saved for quick access
- [ ] Supports both text and voice input (stretch goal)

**Data Sources**

- Module registry (mapping of entities to routes)
- Filter schema per module
- Query history for personalization

**Business Impact**

- Reduces navigation time across 120+ pages
- Lowers learning curve for new users

---

### Category 5: Computer Vision

> **Theme**: Extract structured data from images and photos to reduce manual data entry and improve verification processes.

---

#### Feature 5.1 — Daily Report Photo Analysis

**Priority**: MEDIUM-HIGH | **Complexity**: Medium | **Tech**: Claude Vision API

**Description**
Analyze equipment photos attached to daily reports to assess condition, detect visible damage, and verify equipment identity.

**User Story**

> As a **Project Manager**, I want AI analysis of daily equipment photos so that I can spot damage trends and verify equipment condition without reviewing every photo manually.

**Acceptance Criteria**

- [ ] Photos attached to daily reports are automatically analyzed
- [ ] Analysis output: condition assessment (good/fair/poor), visible issues detected, equipment identity verification
- [ ] Damage alerts when new damage is detected vs. previous photos
- [ ] Condition trend tracking per equipment over time
- [ ] Analysis visible on the daily report review page
- [ ] PM can mark false positives

**Data Sources**

- `parte_diario_foto` — equipment photos
- `equipo` — equipment reference images and details

**Business Impact**

- Early damage detection prevents costly repairs
- Automated condition tracking for lease/return disputes

---

#### Feature 5.1b — Automated Equipment Handover & Return Inspection

**Priority**: HIGH | **Complexity**: Medium | **Tech**: Claude Vision API

**Description**
Streamline the "Acta de Entrega" (CORP-GEM-F-010) process by using computer vision to read dashboard gauges (horometer, fuel level) and scan the exterior for damages specifically during the handover/return events.

**User Story**

> As a **Project Manager**, I want to take a picture of the dashboard and the machine during handover, and have the AI instantly record the fuel level, horometer, and pre-existing dents so we never have disputes with suppliers upon return.

**Acceptance Criteria**

- [ ] Mobile-first UI for the handover event.
- [ ] AI extracts exact horometer reading and fuel gauge percentage from dashboard photos.
- [ ] Differential analysis: compares "Return" photos against "Handover" photos to highlight new damages.
- [ ] Auto-populates the CORP-GEM-F-010 form.

**Data Sources**

- Handover and Return photos (dashboards and exterior 360).
- `parte_diario` for cross-referencing final horometer readings.

**Business Impact**

- Drastically reduces dispute costs with third-party suppliers over damages and fuel levels.
- Accelerates the desmobilization process.

---

#### Feature 5.2 — Fuel Voucher OCR

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Claude Vision API

**Description**
Photograph fuel vouchers and auto-extract date, gallons, price, and provider. Cross-validate extracted data against manual entries.

**User Story**

> As an **Operator**, I want to take a photo of the fuel voucher and have the system fill in the details automatically so that I spend less time on data entry.

**Acceptance Criteria**

- [ ] Camera/upload interface on fuel voucher form
- [ ] Extracts: date, quantity (gallons), unit price, total, provider name, voucher number
- [ ] Pre-fills form fields with extracted data
- [ ] Confidence indicators per field (green = high confidence, yellow = review)
- [ ] Cross-validation against manual entries when both exist
- [ ] Discrepancy alerts when OCR and manual entry disagree

**Data Sources**

- Fuel voucher photos (captured or uploaded)
- `vale_combustible` — form fields for population

**Business Impact**

- Reduces fuel voucher data entry time by 60-80%
- Provides verification layer against manual errors

---

#### Feature 5.3 — Checklist Photo Verification

**Priority**: LOW-MEDIUM | **Complexity**: Medium | **Tech**: Claude Vision API

**Description**
For checklist items requiring photos, verify that the photo shows the correct component and the expected condition.

**User Story**

> As a **Safety Manager**, I want assurance that checklist photos actually show the required component in the expected condition, not just random photos taken to satisfy the requirement.

**Acceptance Criteria**

- [ ] Photos for `requiere_foto` checklist items are auto-analyzed
- [ ] Verification: does the photo match the expected component type?
- [ ] Condition assessment based on checklist item requirements
- [ ] Flag suspicious photos (wrong component, blurry, duplicate of another item)
- [ ] Verification result visible in checklist review

**Data Sources**

- `checklist_detalle` — checklist items with `requiere_foto` flag
- Associated photos
- Checklist item descriptions for context

**Business Impact**

- Ensures checklist compliance quality
- Reduces rubber-stamping of safety inspections

---

#### Feature 5.4 — Invoice OCR for Accounts Payable

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Claude Vision API

**Description**
Scan supplier invoices and auto-populate accounts payable fields (cuenta_por_pagar), reducing manual data entry and transcription errors.

**User Story**

> As a **Finance team member**, I want to upload an invoice image and have the system extract all the details automatically so that I can process payables faster and with fewer errors.

**Acceptance Criteria**

- [ ] Upload interface on accounts payable creation page
- [ ] Extracts: supplier name/RUC, invoice number, date, line items, amounts, taxes, total
- [ ] Maps extracted supplier to existing `proveedor` records
- [ ] Pre-fills `cuenta_por_pagar` form fields
- [ ] Confidence scoring per field
- [ ] Human review and confirmation before saving
- [ ] Batch upload support for multiple invoices

**Data Sources**

- Invoice images/scans
- `proveedor` — supplier name matching
- `cuenta_por_pagar` — target fields

**Business Impact**

- Reduces invoice processing time by 50-70%
- Eliminates transcription errors

---

### Category 6: Smart Automation

> **Theme**: Reduce manual data entry, automate routine decisions, and add intelligent safeguards to everyday workflows.

---

#### Feature 6.1 — Smart Daily Report Pre-Fill

**Priority**: HIGH | **Complexity**: Low | **Tech**: Rule-based + Pattern Matching

**Description**
Auto-carry yesterday's horometro_final as today's horometro_inicial, and suggest the same operator, project, turno, and equipment based on recent patterns.

**User Story**

> As an **Operator**, I want the daily report form to come pre-filled with my usual values so that I only need to update what changed, not re-enter everything from scratch.

**Acceptance Criteria**

- [ ] `horometro_inicial` auto-populated from previous day's `horometro_final`
- [ ] Operator, project, turno suggested from last 3 days' pattern
- [ ] Equipment pre-selected if operator typically works with the same one
- [ ] Pre-filled values clearly marked as "suggested" (different styling)
- [ ] One-click clear to reset suggestions
- [ ] Works for both new daily report creation and report continuation

**Data Sources**

- `parte_diario` — previous day's records for the same equipment/operator
- User's recent report history (last 7 days)

**Business Impact**

- Estimated 50%+ reduction in daily report entry time
- Reduces data entry errors (especially horometro continuity)
- Highest user satisfaction for operators (daily time savings)

---

#### Feature 6.2 — Intelligent Approval Routing

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: Rule-based + Decision Tree

**Description**
Auto-route approval requests to the correct approver based on amount, type, project, and organizational hierarchy. Predict approval likelihood based on historical patterns.

**User Story**

> As a **requester**, I want my approvals to be automatically routed to the right person based on the type and amount, without me having to figure out who approves what.

**Acceptance Criteria**

- [ ] Routing rules based on: request type, amount threshold, project, department
- [ ] Automatic escalation for amounts above threshold
- [ ] Approval likelihood indicator (e.g., "Based on similar requests, 85% approval rate")
- [ ] Fallback routing when primary approver is unavailable
- [ ] Routing rule management UI for administrators
- [ ] Audit trail for routing decisions

**Data Sources**

- `aprobacion_solicitud` — approval history
- `aprobacion_plantilla` — approval templates
- User hierarchy and roles

**Business Impact**

- Reduces approval cycle time
- Eliminates routing errors and bottlenecks

---

#### Feature 6.3 — Contract Auto-Population from Quotation

**Priority**: MEDIUM | **Complexity**: Low | **Tech**: Rule-based Field Mapping

**Description**
When creating a new contract, auto-populate matching fields from the selected supplier quotation, reducing duplicate data entry.

**User Story**

> As a **Procurement Manager**, I want contract fields automatically filled from the accepted quotation so that I don't re-enter information that was already captured.

**Acceptance Criteria**

- [ ] "Create Contract from Quotation" button on quotation detail page
- [ ] Auto-maps: equipment types, quantities, proposed rates, supplier, dates
- [ ] Side-by-side comparison: quotation values vs. contract fields
- [ ] Manual override for any field
- [ ] Highlights fields that differ from the quotation

**Data Sources**

- `cotizacion_proveedor` — quotation details
- `contrato_adenda` — contract fields to populate

**Business Impact**

- Eliminates duplicate data entry
- Reduces contract creation time and errors

---

#### Feature 6.4 — Smart Maintenance Trigger

**Priority**: HIGH | **Complexity**: Low-Medium | **Tech**: Rule-based + Adaptive ML

**Description**
Auto-create maintenance records when horometro thresholds are reached, with adaptive thresholds based on equipment condition and usage patterns.

**User Story**

> As a **Maintenance Manager**, I want maintenance to be automatically triggered when equipment reaches service intervals, with adaptive thresholds that account for actual conditions.

**Acceptance Criteria**

- [ ] Base thresholds per equipment type (e.g., every 250 hours)
- [ ] Adaptive adjustment: increase frequency for high-usage equipment, decrease for low-usage
- [ ] Auto-creates maintenance task with pre-filled details
- [ ] Notification to maintenance team when trigger fires
- [ ] Dashboard showing upcoming triggers (horometro distance to next service)
- [ ] Override: maintenance manager can adjust thresholds per equipment
- [ ] Considers actual horometro from `parte_diario`, not just calendar time

**Data Sources**

- `parte_diario` — cumulative horometro readings
- `programa_mantenimiento` — maintenance schedules and thresholds
- `equipo` — equipment type and specifications

**Business Impact**

- Prevents missed maintenance that leads to breakdowns
- Moves from calendar-based to usage-based maintenance

---

#### Feature 6.5 — Delay Code Auto-Classification

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: TF-IDF + Nearest Neighbor (or Claude API)

**Description**
Auto-suggest the appropriate delay code when an operator enters a free-text delay description, reducing classification errors.

**User Story**

> As an **Operator**, I want the system to suggest the right delay code when I describe what happened, so that I don't have to search through a long dropdown of codes I don't memorize.

**Acceptance Criteria**

- [ ] Text input field where operator describes the delay in free text
- [ ] Top 3 suggested delay codes with confidence scores
- [ ] Operator selects the correct code (or types more for better suggestions)
- [ ] Learning: tracks which suggestions are accepted/rejected
- [ ] Supports Spanish text input
- [ ] Fallback to full dropdown if no good match found

**Data Sources**

- `catalogo` — delay code catalog with descriptions
- `parte_diario_detalle` — historical delay descriptions and selected codes

**Business Impact**

- Faster and more accurate delay reporting
- Reduces delay code misclassification

---

#### Feature 6.6 — Valuation Sanity Check

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: Statistical Confidence Intervals

**Description**
Independent ML-based verification after valuation calculation — flags discrepancies between calculated amounts and expected ranges based on historical patterns.

**User Story**

> As a **Finance Manager**, I want an independent sanity check on valuation calculations — a second opinion that catches errors in the calculation logic before I approve.

**Acceptance Criteria**

- [ ] Runs automatically after valuation calculation
- [ ] Compares: calculated amount vs. predicted amount based on inputs (hours, rates, equipment type)
- [ ] Flags discrepancies exceeding configurable threshold (e.g., ±15%)
- [ ] Shows expected range with confidence interval
- [ ] Pass/fail indicator on valuation approval screen
- [ ] Detailed explanation of any discrepancies

**Data Sources**

- `valorizacion_equipo` — calculated valuations
- `parte_diario` — input hours/utilization
- `contrato_adenda` — rates and terms
- Historical valuations for baseline

**Business Impact**

- Independent verification layer reduces billing errors
- Increases confidence in the valuation process

---

#### Feature 6.7 — Document Expiry Priority Scoring

**Priority**: MEDIUM | **Complexity**: Low | **Tech**: Weighted Risk Model

**Description**
Enhance existing expiry alerts with ML risk scoring: rank which expirations pose the highest operational risk based on equipment criticality, document type importance, and usage patterns.

**User Story**

> As a **Project Manager**, I want to know which expiring documents are most critical to renew first — not just a flat list of all expiring items — so that I focus on what matters most.

**Acceptance Criteria**

- [ ] Risk score (1-10) per expiring document/certificate
- [ ] Scoring factors: equipment utilization (high-use = higher priority), document type (safety-critical = higher), project requirements
- [ ] Sorted priority list: highest-risk expirations first
- [ ] Color-coded urgency: RED (expired, high-risk), ORANGE (expiring soon, high-risk), YELLOW (expiring, low-risk)
- [ ] Integration with existing notification system
- [ ] Configurable weights per document type

**Data Sources**

- `certificacion_operador` — operator certifications with expiry
- `contrato_adenda` — contract dates
- `equipo` — equipment documents (SOAT, inspections)
- `parte_diario` — equipment utilization (for criticality weighting)

**Business Impact**

- Focuses attention on highest-risk expirations
- Prevents operational stoppages due to expired critical documents

---

### Category 7: Strategic Intelligence

> **Theme**: Transform operational data into strategic insights for executive decision-making.

---

#### Feature 7.1 — Total Cost of Ownership (TCO) Dashboard

**Priority**: HIGH | **Complexity**: Medium-High | **Tech**: Statistical Aggregation + Trend ML

**Description**
Calculate true TCO per equipment unit: rental cost + fuel + maintenance + downtime cost + transport, with peer comparison and trends.

**User Story**

> As a **Director**, I want to see the true total cost of each piece of equipment — not just rental, but fuel, maintenance, and downtime — so that I can identify which assets are profitable and which are money pits.

**Acceptance Criteria**

- [ ] TCO per equipment: rental + fuel + maintenance + downtime (calculated as lost revenue) + transport
- [ ] TCO per hour/day/month for comparison across different equipment sizes
- [ ] Peer comparison: same equipment type, same type across suppliers
- [ ] Trend charts: TCO over time per equipment
- [ ] Fleet-level TCO summary and trends
- [ ] Drill-down from fleet level → equipment type → individual equipment
- [ ] Export to PDF/Excel for board presentations

**Data Sources**

- `valorizacion_equipo` — rental costs
- `vale_combustible` — fuel costs
- `programa_mantenimiento` — maintenance costs
- `periodo_inoperatividad` — downtime records
- `contrato_adenda` — contracted rates for downtime cost calculation

**Business Impact**

- First comprehensive view of true equipment costs
- Enables data-driven fleet decisions

---

#### Feature 7.2 — Project Profitability Analytics

**Priority**: HIGH | **Complexity**: Medium | **Tech**: Aggregation + Forecast

**Description**
Track equipment cost contribution to project profitability, comparing actual costs vs. budgets with forecasted end-of-period position.

**User Story**

> As a **Director**, I want to see how equipment costs impact each project's profitability — and forecast where we'll end up by period close — so that I can intervene on over-budget projects early.

**Acceptance Criteria**

- [ ] Per-project equipment cost breakdown: rental, fuel, maintenance, by equipment unit
- [ ] Budget vs. actual comparison with variance analysis
- [ ] Forecasted end-of-period cost based on current run rate
- [ ] Alert when projected costs exceed budget threshold
- [ ] Cross-project comparison
- [ ] Drill-down to specific cost drivers

**Data Sources**

- `centro_costo` — budgets per project/cost center
- `valorizacion_equipo` — actual equipment costs
- `vale_combustible` — fuel costs per project
- `equipo_edt` — equipment-to-project assignments

**Business Impact**

- Early intervention on over-budget projects
- Better project-level cost management

---

#### Feature 7.3 — ML-Enhanced Supplier Scorecard

**Priority**: MEDIUM-HIGH | **Complexity**: Medium | **Tech**: Weighted Composite with Auto-Adjusted Weights

**Description**
Automated supplier scoring combining objective metrics (equipment uptime, inoperability rates, maintenance response, delivery timeliness) with manual evaluations, using auto-adjusted weights based on metric importance.

**User Story**

> As a **Procurement Manager**, I want a comprehensive, automatically-updated supplier scorecard that combines hard data with manual evaluations so that I can make objective procurement decisions.

**Acceptance Criteria**

- [ ] Composite score per supplier (0-100)
- [ ] Objective metrics (auto-calculated): equipment uptime %, inoperability rate, maintenance response time, delivery timeliness
- [ ] Subjective metrics (from evaluaciones): quality rating, communication, professionalism
- [ ] Auto-weight adjustment based on metric variance (high-variance metrics get higher weight)
- [ ] Historical trend per supplier
- [ ] Peer ranking within equipment type category
- [ ] Integration with existing supplier evaluation views

**Data Sources**

- `evaluacion_proveedor` — manual evaluation scores
- `periodo_inoperatividad` — equipment downtime per supplier
- `programa_mantenimiento` — maintenance response data
- `contrato_adenda` — delivery and compliance data

**Business Impact**

- Objective supplier comparison for procurement decisions
- Identifies top and underperforming suppliers

---

#### Feature 7.4 — Operational Risk Heatmap

**Priority**: MEDIUM-HIGH | **Complexity**: Medium | **Tech**: Composite Risk Scoring

**Description**
Visual heatmap showing risk across projects by combining safety incidents, maintenance overdue, document expirations, and inoperability rates into a unified risk score.

**User Story**

> As a **Director**, I want a single visual showing which projects have the highest operational risk across all dimensions — safety, maintenance, compliance, and performance — so that I can focus executive attention where it's needed most.

**Acceptance Criteria**

- [ ] Risk score (1-10) per project across 4 dimensions: Safety, Maintenance, Compliance, Performance
- [ ] Visual heatmap: projects × risk dimensions, color-coded
- [ ] Overall project risk score (weighted composite)
- [ ] Drill-down: click project to see contributing risk factors
- [ ] Weekly trend: is risk improving or worsening?
- [ ] Configurable thresholds for risk levels
- [ ] Alert when any project crosses critical risk threshold

**Data Sources**

- `incidente_sst` — safety incidents per project
- `programa_mantenimiento` — overdue maintenance per project
- Expiry data — expired documents per project
- `periodo_inoperatividad` — downtime rates per project

**Business Impact**

- Executive-level risk visibility in a single view
- Enables proactive risk management

---

#### Feature 7.5 — Budget vs. Actual AI Commentary

**Priority**: MEDIUM | **Complexity**: Low-Medium | **Tech**: Claude API + Financial Data

**Description**
Auto-generate natural language commentary on cost variances — explaining why they occurred and predicting end-of-period position.

**User Story**

> As a **Director**, I want AI-generated commentary on budget variances — not just numbers, but explanations of why costs were over/under and what to expect going forward.

**Acceptance Criteria**

- [ ] "Generate Commentary" button on budget vs. actual report
- [ ] Commentary covers: top 3 variances with explanations, contributing factors, trend direction
- [ ] Prediction: "At current run rate, project X will end S/. Y over/under budget"
- [ ] Language: executive-friendly Spanish
- [ ] Context-aware: references specific events (e.g., "Equipment EX-005 downtime in week 3 drove 40% of the maintenance variance")
- [ ] Exportable with the financial report

**Data Sources**

- `centro_costo` — budgets
- `valorizacion_equipo`, `vale_combustible`, `programa_mantenimiento` — actual costs
- `periodo_inoperatividad` — contributing events

**Business Impact**

- Transforms financial reports from numbers into narratives
- Saves executive time in understanding variances

---

#### Feature 7.6 — Cross-Project Equipment Sharing

**Priority**: MEDIUM | **Complexity**: Medium | **Tech**: OR Matching/Assignment

**Description**
Identify idle equipment on one project that could fulfill demand on another project, including transfer cost analysis and net benefit calculation.

**User Story**

> As a **Director**, I want to see opportunities to share equipment between projects — which equipment is idle where, who needs it, and whether transfer is worth the cost.

**Acceptance Criteria**

- [ ] Dashboard showing: idle equipment (with location) + unfulfilled demands (with location)
- [ ] Match recommendations: "EX-003 idle at Project A can fulfill demand at Project B"
- [ ] Cost analysis: transfer cost vs. renting a new unit
- [ ] Net benefit calculation per recommendation
- [ ] One-click to initiate equipment transfer workflow
- [ ] Filters by equipment type, time window, project

**Data Sources**

- `equipo` — current assignments and status
- `parte_diario` — utilization (identify truly idle equipment)
- `solicitud_equipo` — unfulfilled demands
- `proyecto` — project locations (for transfer cost estimation)

**Business Impact**

- Reduces idle equipment costs
- Avoids unnecessary new equipment rentals

---

## 6. Showcase Features ("Wow Factor")

These three features are designed for maximum executive impression and combine multiple capabilities.

### WOW 1: BitCorp Copilot — Conversational ERP

**Merges**: Feature 4.1 (Copilot) + relevant data from all categories

The CEO types in Spanish: _"Muestrame los equipos con mas combustible de lo normal este mes y cuanto nos cuesta"_ and receives:

1. A formatted table of equipment with abnormal fuel consumption (from Feature 2.1)
2. Cost impact calculation per equipment
3. Suggested actions ("Investigate EX-007 — 2.3x baseline consumption, potential savings of S/. 4,200/month")
4. One-click navigation to the relevant pages

**Why it impresses**: Makes the entire 120-page ERP accessible through conversation. Any question, any data, instant answer.

---

### WOW 2: Digital Twin Fleet Simulator

**Merges**: Features 3.1 (Equipment Allocation) + 3.6 (Fleet Right-Sizing) + 1.2 (Utilization Forecasting)

**New capability**: What-if tool where the CEO inputs a scenario ("Add 3 excavators, remove 2 dump trucks from the fleet") and the system simulates the impact on:

- Fleet utilization rates (next 6 months)
- Total costs (rental + maintenance + fuel)
- Project coverage (which projects gain/lose capacity)
- Maintenance burden changes

Uses Monte Carlo simulation with actual historical distributions, coupled with the OR allocation solver.

**Why it impresses**: Transforms ERP from a record-keeping system into a strategic planning tool. Decisions backed by simulated outcomes, not gut feeling.

**Acceptance Criteria**

- [ ] Scenario builder: add/remove/replace equipment units
- [ ] 6-month simulation with confidence intervals
- [ ] Side-by-side comparison: current fleet vs. proposed fleet
- [ ] Impact metrics: utilization, cost, coverage, maintenance
- [ ] Save and compare multiple scenarios
- [ ] Monte Carlo with 1000+ iterations for statistical confidence
- [ ] Visual: utilization curves, cost waterfall, coverage matrix

---

### WOW 3: Anomaly Radar — Multi-Signal Dashboard

**Merges**: Features 2.1 (Fuel) + 2.2 (Horometer) + 2.3 (Report Quality) + 2.4 (Valuation) + 2.5 (Safety) + 2.6 (Supplier)

**New capability**: Single "threat radar" dashboard fusing all anomaly detectors into a unified view with:

- Real-time anomaly severity scoring (1-10)
- LLM-generated investigation summaries per anomaly
- One-click drill-down to source records
- Suggested corrective actions
- Historical anomaly frequency trends

**Why it impresses**: Visually compelling, proactive, and comprehensive. One screen to see everything that needs attention.

**Acceptance Criteria**

- [ ] Unified dashboard with anomaly cards grouped by type
- [ ] Severity score (1-10) per anomaly with color coding
- [ ] LLM-generated investigation summary per anomaly (Claude API)
- [ ] Source record link for each anomaly
- [ ] Suggested corrective actions per anomaly type
- [ ] Filter by: type, severity, project, date range
- [ ] Trend chart: anomaly frequency over time
- [ ] Anomaly resolution workflow (acknowledge → investigate → resolve)

---

## 7. Implementation Phases

### Phase 1: Quick Wins (Weeks 1-4)

**Goal**: Deliver immediate user value with rule-based features requiring no ML training.

| Feature                              |  Effort  | Dependencies |
| ------------------------------------ | :------: | ------------ |
| 6.1 Smart Daily Report Pre-Fill      | 3-5 days | None         |
| 2.2 Horometer/Odometer Tampering     | 3-4 days | None         |
| 2.1 Fuel Consumption Anomalies       | 4-5 days | None         |
| 6.7 Document Expiry Priority Scoring | 2-3 days | None         |
| 6.4 Smart Maintenance Trigger        | 4-5 days | None         |

**Prerequisites**: Set up `app/servicios/ml/` package structure and `app/api/ia.py` router.

**Exit Criteria**: All 5 features deployed, tested, and visible in the ERP UI.

---

### Phase 2: Core ML (Weeks 5-12)

**Goal**: Train and deploy the first ML models using historical data.

| Feature                             |  Effort   | Dependencies                                            |
| ----------------------------------- | :-------: | ------------------------------------------------------- |
| 1.1 Equipment Failure Prediction    | 2-3 weeks | Sufficient historical `parte_diario` + maintenance data |
| 1.2 Utilization Forecasting         | 1-2 weeks | 6+ months of daily report data                          |
| 3.1 Equipment-to-Project Allocation | 2-3 weeks | Equipment and project data                              |
| 3.2 Operator-Equipment Assignment   | 1-2 weeks | Operator skills and certification data                  |

**Prerequisites**: Phase 1 complete, ML infrastructure (model training pipeline, versioning, retraining cron).

**New dependencies**: `scikit-learn`, `prophet`, `scipy`/`pulp`

**Exit Criteria**: Models trained, validated (>70% accuracy on hold-out data), and serving predictions.

---

### Phase 3: LLM Integration (Weeks 8-14)

**Goal**: Integrate Claude API for natural language features. Can overlap with Phase 2.

| Feature                            |  Effort   | Dependencies                        |
| ---------------------------------- | :-------: | ----------------------------------- |
| 4.1 BitCorp Copilot (NL Assistant) | 3-4 weeks | Schema metadata, query safety layer |
| 4.2 Contract Clause Analyzer       | 1-2 weeks | PDF upload infrastructure           |
| 5.1 Daily Report Photo Analysis    | 1-2 weeks | Photo storage already exists        |
| 5.2 Fuel Voucher OCR               | 1-2 weeks | Camera/upload component             |

**Prerequisites**: Claude API key provisioned, usage budget approved, `app/servicios/llm/` package.

**New dependencies**: `anthropic` Python SDK

**Exit Criteria**: Copilot answering queries accurately, OCR reducing data entry time by 50%+.

---

### Phase 4: Advanced Intelligence (Weeks 12-24)

**Goal**: Deploy the most complex features and the three "wow" showcase capabilities.

| Feature                               |  Effort   | Dependencies                                 |
| ------------------------------------- | :-------: | -------------------------------------------- |
| 7.1 TCO Dashboard                     | 2-3 weeks | All cost data sources integrated             |
| 7.4 Operational Risk Heatmap          | 2-3 weeks | Anomaly detectors from Phase 1               |
| 3.3 Maintenance Schedule Optimization | 2-3 weeks | OR-Tools, utilization forecasts from Phase 2 |
| WOW 2: Digital Twin Fleet Simulator   | 3-4 weeks | Allocation solver + forecasting from Phase 2 |
| WOW 3: Anomaly Radar Dashboard        | 2-3 weeks | All anomaly detectors from Phase 1           |

**Prerequisites**: Phases 1-3 complete (builds on earlier capabilities).

**New dependencies**: `ortools` (Google OR-Tools)

**Exit Criteria**: Executive demo-ready with all three "wow" features functional.

---

### Remaining Features (Post Phase 4)

Features not in Phases 1-4 are prioritized for subsequent iterations:

- 1.3, 1.4, 1.5, 1.6, 1.7 (additional predictive models)
- 2.3, 2.4, 2.5, 2.6, 2.7 (additional anomaly detectors)
- 3.4, 3.5 (additional OR features)
- 4.3, 4.4, 4.5, 4.6, 4.7 (additional LLM features)
- 5.3, 5.4 (additional CV features)
- 6.2, 6.3, 6.5, 6.6 (additional automation)
- 7.2, 7.3, 7.5, 7.6 (additional strategic features)

---

## 8. Technical Architecture

### 8.1 New Backend Packages

```
app/
├── servicios/
│   ├── ml/                          # NEW: ML service layer
│   │   ├── __init__.py
│   │   ├── modelo_base.py           # Base class for ML models
│   │   ├── prediccion_fallas.py     # Feature 1.1
│   │   ├── pronostico_utilizacion.py # Feature 1.2
│   │   ├── anomalia_combustible.py  # Feature 2.1
│   │   ├── deteccion_horometro.py   # Feature 2.2
│   │   ├── optimizacion_asignacion.py # Feature 3.1
│   │   └── ...
│   ├── llm/                         # NEW: LLM integration layer
│   │   ├── __init__.py
│   │   ├── cliente_claude.py        # Claude API client wrapper
│   │   ├── copilot.py               # Feature 4.1
│   │   ├── analizador_contrato.py   # Feature 4.2
│   │   ├── vision.py                # Features 5.x
│   │   └── ...
│   └── ia/                          # NEW: AI orchestration
│       ├── __init__.py
│       ├── prefill_inteligente.py   # Feature 6.1
│       ├── trigger_mantenimiento.py # Feature 6.4
│       ├── prioridad_vencimiento.py # Feature 6.7
│       └── ...
├── api/
│   └── ia.py                        # NEW: AI feature API routes
├── esquemas/
│   └── ia.py                        # NEW: AI feature DTOs
```

### 8.2 New Python Dependencies

| Package        | Version | Used For                                      |
| -------------- | ------- | --------------------------------------------- |
| `scikit-learn` | ≥1.4    | Classification, regression, anomaly detection |
| `prophet`      | ≥1.1    | Time series forecasting                       |
| `scipy`        | ≥1.12   | Optimization, statistics                      |
| `pulp`         | ≥2.7    | Linear programming                            |
| `ortools`      | ≥9.8    | Constraint programming (Phase 4)              |
| `anthropic`    | ≥0.40   | Claude API client                             |

### 8.3 Infrastructure Changes

| Change            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| Model storage     | Serialized models in Redis or filesystem (per tenant)  |
| Cron jobs         | Add model retraining and anomaly scan schedules        |
| API rate limiting | Claude API usage caps per tenant per day               |
| File upload       | PDF and image upload for CV features (extend existing) |

### 8.4 Multi-Tenancy Compliance

All AI features **MUST** maintain tenant isolation:

- ML models trained per-tenant on tenant-specific data
- No cross-tenant data leakage in training or inference
- Claude API calls include tenant context, never cross-tenant data
- Model storage keyed by tenant ID
- API endpoints enforce tenant scoping via existing middleware

---

## 9. Dependencies & Risks

### 9.1 Technical Risks

| Risk                                       | Probability | Impact | Mitigation                                                                         |
| ------------------------------------------ | :---------: | :----: | ---------------------------------------------------------------------------------- |
| Insufficient historical data for ML models |   Medium    |  High  | Start with rule-based approaches; set minimum data thresholds for model activation |
| Claude API latency affects UX              |     Low     | Medium | Async processing, streaming responses, response caching                            |
| Model accuracy below useful threshold      |   Medium    | Medium | Iterative improvement; fall back to rule-based when ML underperforms               |
| Multi-tenant model isolation complexity    |     Low     |  High  | Clear architectural patterns; automated testing per tenant                         |
| Claude API cost overruns                   |   Medium    | Medium | Usage caps per tenant, caching, prompt optimization                                |

### 9.2 Business Risks

| Risk                                       | Probability | Impact | Mitigation                                                                 |
| ------------------------------------------ | :---------: | :----: | -------------------------------------------------------------------------- |
| User resistance to AI suggestions          |   Medium    | Medium | Suggestions only, never auto-actions; clear confidence indicators          |
| False positive fatigue (anomaly detection) |    High     | Medium | Tunable sensitivity, false-positive feedback loop                          |
| Over-reliance on AI for critical decisions |     Low     |  High  | AI as advisory only; human approval required for all actions               |
| Data quality insufficient for training     |   Medium    |  High  | Data quality improvements in Phase 1 (features 2.2, 2.3) feed later phases |

### 9.3 Prerequisites

| Prerequisite                   | Required For            | Status                                   |
| ------------------------------ | ----------------------- | ---------------------------------------- |
| 6+ months of daily report data | ML training (Phase 2)   | To verify                                |
| Claude API key and budget      | LLM features (Phase 3)  | To provision                             |
| Existing cron infrastructure   | Scheduled jobs          | Available (`app/servicios/cron.py`)      |
| Photo storage infrastructure   | CV features (Phase 3)   | Available (`parte_diario_foto`)          |
| Analytics service patterns     | ML service architecture | Available (`app/servicios/analitica.py`) |

---

## 10. Approval & Sign-Off

### Feature Priority Review

Please review each category and mark your decision:

| Category                  | Features  | Decision                                   |
| ------------------------- | :-------: | ------------------------------------------ |
| 1. Predictive Analytics   | 1.1 – 1.7 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 2. Anomaly Detection      | 2.1 – 2.7 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 3. Optimization & OR      | 3.1 – 3.6 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 4. Natural Language & LLM | 4.1 – 4.7 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 5. Computer Vision        | 5.1 – 5.4 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 6. Smart Automation       | 6.1 – 6.7 | [ ] Approved / [ ] Deferred / [ ] Modified |
| 7. Strategic Intelligence | 7.1 – 7.6 | [ ] Approved / [ ] Deferred / [ ] Modified |

### Phase Approval

| Phase                    | Timeline    | Decision                    |
| ------------------------ | ----------- | --------------------------- |
| Phase 1: Quick Wins      | Weeks 1-4   | [ ] Approved / [ ] Modified |
| Phase 2: Core ML         | Weeks 5-12  | [ ] Approved / [ ] Modified |
| Phase 3: LLM Integration | Weeks 8-14  | [ ] Approved / [ ] Modified |
| Phase 4: Advanced        | Weeks 12-24 | [ ] Approved / [ ] Modified |

### Sign-Off

| Role               | Name | Date | Signature |
| ------------------ | ---- | ---- | --------- |
| Product Owner      |      |      |           |
| Technical Lead     |      |      |           |
| Director / Sponsor |      |      |           |

---

### Notes & Comments

_Space for PO feedback, feature modifications, priority changes, and additional requirements._

---

> **Document generated**: 2026-03-05
> **Next action**: Product Owner review and feature selection
> **Contact**: Engineering Team
