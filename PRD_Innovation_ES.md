# PRD: Funciones de innovación de IA/ML — BitCorp ERP

**Producto**: BitCorp ERP (Gestión de alquiler de equipos de construcción)
**Cliente**: Grupo Aramsa, Perú
**Versión del documento**: 1.0
**Fecha**: 2026-03-05
**Estado**: BORRADOR: Aprobación pendiente del propietario del producto
**Autor**: Equipo de ingeniería

---

## Tabla de contenido

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contexto empresarial](#2-contexto-empresarial)
3. [Metas y métricas de éxito](#3-metas--métricas-de-éxito)
4. [Línea base del sistema actual](#4-línea-base-del-sistema-actual)
5. [Catálogo de funciones](#5-catalogo-de-funciones)
   - [Categoría 1: Análisis predictivo](#categoría-1-análisis-predictivo)
   - [Categoría 2: Detección de anomalías](#categoría-2-detección-de-anomalías)
   - [Categoría 3: Optimización e investigación de operaciones](#categoría-3-optimización--investigación-de-operaciones)
   - [Categoría 4: Lenguaje natural y LLM](#categoría-4-lenguaje-natural--llm)
   - [Categoría 5: Visión por computadora](#categoría-5-visión por computadora)
   - [Categoría 6: Automatización inteligente](#categoría-6-automatización-inteligente)
   - [Categoría 7: Inteligencia Estratégica](#categoría-7-inteligencia-estratégica)
6. [Características del escaparate ("Factor sorpresa")](#6-características-del escaparate-factor-wow)
7. [Fases de implementación](#7-fases-de-implementación)
8. [Arquitectura técnica](#8-arquitectura-técnica)
9. [Dependencias y riesgos](#9-dependencias--riesgos)
10. [Aprobación y aprobación](#10-aprobación--aprobación)

---

## 1. Resumen ejecutivo

BitCorp ERP gestiona el ciclo de vida completo del alquiler de equipos de construcción, desde solicitudes y contratos, pasando por operaciones diarias y valoraciones mensuales hasta pagos. Actualmente, el sistema maneja **56 modelos de datos**, **más de 50 servicios backend**, **48 rutas API** y **25 módulos de funciones frontend** con **cero capacidades de IA/ML**.

Este PRD propone **47 funciones de IA/ML en 7 categorías** que aprovechan los ricos datos operativos ya recopilados (horas, combustible, tiempo de inactividad, mantenimiento, costos, asignaciones de operadores) para ofrecer:

- **Mantenimiento predictivo** para evitar costosas averías
- **Detección de anomalías** para detectar fraudes, robos y problemas de calidad de los datos
- **Solucionadores de optimización** para asignación de equipos/operadores
- **Interfaces de lenguaje natural** (Claude API) para acceso conversacional al ERP
- **Visión por computadora** para OCR y análisis de fotografías
- **Automatización inteligente** para reducir la entrada manual de datos
- **Paneles de control estratégico** para la toma de decisiones ejecutivas

**Justificación de la inversión**: Estas características transforman a BitCorp de un sistema de mantenimiento de registros a una plataforma de decisiones inteligente, creando una diferenciación competitiva al tiempo que reducen los costos operativos a través de análisis predictivos y optimización.

---

## 2. Contexto empresarial

### 2.1 Puntos débiles actuales

| Punto de dolor                                                      | Impacto                                                                  | Características que lo abordan |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| Las averías de los equipos son reactivas, no previstas              | Costos de inactividad, reparaciones de emergencia, retrasos en proyectos | 1.1, 6.4, 3.3                  |
| El robo/desperdicio de combustible pasa desapercibido               | Pérdidas financieras del 5 al 15% del presupuesto de combustible         | 2.1, 2.2                       |
| La entrada manual de informes diarios es lenta y propensa a errores | Frustración del operador, problemas de calidad de los datos              | 6.1, 2.3                       |
| La asignación de equipos es manual y subóptima                      | Equipo inactivo en un proyecto mientras otro lo necesita                 | 3.1, 7.6                       |
| El análisis de contratos requiere leer decenas de páginas           | Penalizaciones incumplidas, condiciones desfavorables                    | 4.2                            |
| No hay visibilidad entre sistemas para los ejecutivos               | Decisiones tomadas sobre información incompleta                          | 7.1, 7.2, 7.4, 4.1             |
| Anomalías de valoración detectadas tarde                            | Disputas de pago, fuga de ingresos                                       | 2.4, 6.6                       |
| Vencimientos de documentos/certificados rastreados manualmente      | Riesgo de cumplimiento, paros operativos                                 | 6.7                            |

### 2.2 Usuarios y partes interesadas

| Rol                            | Conteo (est.) | Interés primario                                 | Características clave         |
| ------------------------------ | :-----------: | ------------------------------------------------ | ----------------------------- |
| **Director/CEO**               |      2-3      | Supervisión estratégica, optimización de flotas  | 4.1, 7.1, 7.2, 7.4, ¡GUAU 1-3 |
| **Gerente de Proyecto (PM)**   |     5-10      | Operaciones diarias, rendimiento de los equipos  | 1.1, 2.1, 2.2, 6.1, 3.1       |
| **Gerente de Finanzas**        |      2-3      | Control de costes, exactitud de pagos            | 2,4, 1,3, 3,4, 7,5            |
| **Operador / Supervisor**      |     20-50     | Entrada de datos rápida, menos errores           | 6.1, 4.3, 6.5                 |
| **Gerente de Adquisiciones**   |      2-3      | Gestión de proveedores, negociación de contratos | 4.2, 3.5, 7.3                 |
| **Gerente de mantenimiento**   |      2-3      | Mantenimiento preventivo, programación           | 1.1, 6.4, 3.3                 |
| **Gerente de Seguridad (SST)** |      1-2      | Prevención de incidentes, cumplimiento           | 2,5, 4,5, 5,3                 |
| **Gerente de Logística**       |      1-2      | Optimización de inventario                       | 2.7                           |

---

## 3. Metas y métricas de éxito

### 3.1 Objetivos comerciales

| Gol                                                            | Objetivo                                             | Medición                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Reducir el tiempo de inactividad no planificado de los equipos | -30% dentro de los 6 meses posteriores al despliegue | Comparando registros `periodo_inoperatividad` antes/después                  |
| Detectar anomalías de combustible de forma proactiva           | Detecte más del 80 % de las anomalías en 24 horas    | Recuperación de detección de anomalías versus resultados de auditoría manual |
| Reducir el tiempo de entrada de informes diarios               | -50% de tiempo por informe                           | Encuesta de usuarios + análisis de sesión                                    |
| Mejorar la tasa de utilización de equipos                      | +10 % de utilización de toda la flota                | cálculos de utilización `parte_diario`                                       |
| Acelerar la toma de decisiones ejecutivas                      | Visibilidad entre sistemas en tiempo real            | Comentarios cualitativos del CEO                                             |

### 3.2 Objetivos técnicos

| Gol                                       | Objetivo                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Tiempo de respuesta de la función AI      | < 2 segundos para funciones basadas en reglas, < 10 segundos para funciones LLM |
| Precisión del modelo (cuando corresponda) | > 80 % de precisión en la detección de anomalías, > 70 % en las predicciones    |
| Aislamiento multiinquilino                | Todos los modelos y datos de IA estrictamente limitados al inquilino            |
| Estabilidad del sistema                   | Degradación cero del rendimiento del ERP existente                              |

---

## 4. Línea base del sistema actual

### 4.1 Activos de datos existentes

| Fuente de datos         | Modelo(s)                                                  | Registros (est.) | Relevancia                                          |
| ----------------------- | ---------------------------------------------------------- | :--------------: | --------------------------------------------------- |
| Informes diarios        | `parte_diario`, `parte_diario_detalle`                     |       10K+       | Horas, horómetro, producción, retrasos, combustible |
| Vales de combustible    | `vale_combustible`, `análisis_combustible`                 |       5K+        | Seguimiento del consumo, ratios gal/hr              |
| Mantenimiento           | `programa_mantenimiento`, `mantenimiento_equipo`           |       2K+        | Historial de mantenimiento programado/no programado |
| Registro de Equipos     | `equipo`, `tipo_equipo`                                    |       100+       | Inventario de flota, estado, especificaciones       |
| Contratos               | `contrato_adenda`, `contrato_obligacion`                   |       200+       | Términos, tarifas, obligaciones                     |
| Valoraciones            | `valorizacion_equipo`, `valorizacion_detalle`              |       1K+        | Cálculos de facturación mensual                     |
| Inoperabilidad          | `periodo_inoperatividad`                                   |       500+       | Registros de tiempo de inactividad con causas       |
| Operadores              | `operador`, `operador_habilidad`, `certificacion_operador` |       50+        | Habilidades, certificaciones, disponibilidad        |
| Incidentes de seguridad | `incidente_sst`, `reporte_acto_condicion`                  |       200+       | Registros de incidentes, causas fundamentales       |
| Pagos                   | `registro_pago`, `cuenta_por_pagar`                        |       1K+        | Historial de pagos, retrasos                        |
| Proyectos               | `proyecto`, `equipo_edt`                                   |       20+        | Desglose del trabajo, presupuestos                  |
| Proveedores             | `proveedor`, `evaluacion_proveedor`                        |       50+        | Evaluaciones de desempeño                           |

### 4.2 Capacidades de análisis existentes

El sistema ya cuenta con un servicio de analítica (`app/servicios/analitica.py`) que proporciona:

- Métricas de utilización de la flota (total, activa, % promedio, 5 principales, subutilizadas)
- Utilización por equipo (horas trabajadas, inactivo, costo de combustible/hora)
- Tendencias de utilización diaria.
- Métricas de combustible (consumo, ratio por hora, coste, índice de eficiencia)
- Métricas de mantenimiento (total, costo, pendiente)

**Brecha**: Estos son **descriptivos** (lo que pasó). Las funciones de IA agregan capacidades **predictivas** (qué sucederá), **prescriptivas** (qué hacer) y **cognitivas** (comprender el lenguaje natural).

### 4.3 Tareas programadas existentes

El servicio cron (`app/servicios/cron.py`) ya maneja:

- Alertas de vencimiento de mantenimiento (anticipación de 7 días)
- Alertas de vencimiento de contrato (anticipación de 30 días)
- Alertas de vencimiento de certificación de operador (30 días de anticipación)

**Oportunidad**: Amplíe esta infraestructura para el reentrenamiento de modelos de IA, escaneos de detección de anomalías y generación de alertas predictivas.

---

## 5. Catálogo de funciones

### Categoría 1: Análisis predictivo

> **Tema**: Pasar de operaciones reactivas a proactivas pronosticando el rendimiento, los costos y la demanda de los equipos.

---

#### Característica 1.1: Predicción de fallas del equipo

**Prioridad**: ALTA | **Complejidad**: Media | **Tecnología**: Árboles mejorados con gradiente (scikit-learn)

**Descripción**
Prediga la probabilidad de avería del equipo en los próximos 7, 14 y 30 días utilizando patrones históricos de retraso mecánico, registros de mantenimiento y tendencias horométricas. Muestre puntuaciones de riesgo en la página de detalles del equipo y en el panel de mantenimiento.

**Historia de usuario**

> Como **Gerente de mantenimiento**, quiero ver qué equipo tiene más probabilidades de fallar en los próximos 7 a 30 días para poder programar el mantenimiento preventivo antes de que ocurran averías.

**Criterios de aceptación**

- [ ] El sistema calcula una puntuación de riesgo de falla (0-100%) por unidad de equipo
- [] Las puntuaciones de riesgo se actualizan diariamente mediante un trabajo programado
- [] El panel muestra los equipos clasificados por riesgo de falla con gravedad codificada por colores (verde/amarillo/naranja/rojo)
- [ ] Al hacer clic en una fila de equipo se muestran los factores que contribuyen (por ejemplo, "Delta horométrica alta", "Mantenimiento atrasado", "Patrón de retraso reciente")
- [ ] Las alertas de umbral de riesgo (>70%) generan notificaciones para el Gerente de Mantenimiento
- [] El modelo se vuelve a entrenar semanalmente con nuevos datos.

**Fuentes de datos**

- `parte_diario` — horas_trabajadas, horometro_inicial/final, códigos de retraso
- `programa_mantenimiento` — fechas de finalización programadas vs. reales
- `periodo_inoperatividad` — eventos y causas históricos de tiempo de inactividad
- `equipo` — tipo_equipo, estado, fecha_ingreso (edad)

**Impacto empresarial**

- Reduce el tiempo de inactividad no planificado al permitir el mantenimiento proactivo
- Reducción estimada del 20 al 30 % en los costos de reparación de emergencia

---

#### Característica 1.2: Previsión de utilización

**Prioridad**: ALTA | **Complejidad**: Media | **Tecnología**: Profeta / SARIMAX

**Descripción**
Pronostique las tasas de utilización de la flota y por equipo para los próximos 30, 60 y 90 días en función de los patrones de uso históricos, las tendencias estacionales y los cronogramas de los proyectos.

**Historia de usuario**

> Como **Director**, quiero ver la utilización proyectada de la flota para el próximo trimestre para poder tomar decisiones informadas sobre la compra y el alquiler de equipos y la dotación de personal para el proyecto.

**Criterios de aceptación**

- [] El sistema genera pronósticos de utilización de 30/60/90 días por equipo y para toda la flota
- [] El gráfico de pronóstico superpone la tendencia histórica con intervalos de confianza
- [] Se puede acceder a los pronósticos desde el panel de análisis
- [ ] Modelo de cuentas para estacionalidad (temporadas de construcción) y cronogramas de proyectos.
- [] Seguimiento de la precisión del pronóstico: registros del sistema previstos versus reales para una mejora continua
- [] Alerta cuando la utilización prevista cae por debajo del umbral configurable (p. ej., <50 %)

**Fuentes de datos**

- `parte_diario` — datos de utilización diaria (horas_trabajadas / horas_disponibles)
- `contrato_adenda` — fechas de inicio/finalización del contrato que indican las ventanas de demanda
- `solicitud_equipo` — solicitudes de equipos como principales indicadores de demanda

**Impacto empresarial**

- Permite decisiones proactivas sobre el tamaño de la flota.
- Previene tanto los costos de equipos inactivos como la escasez de capacidad

---

#### Característica 1.3: Previsión del consumo de combustible

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: Profeta / Regresión lineal

**Descripción**
Prediga el consumo de combustible por equipo por semana/mes para respaldar la planificación presupuestaria y las adquisiciones precisas.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero pronósticos precisos del consumo de combustible para poder establecer presupuestos realistas y negociar acuerdos de compra de combustible al por mayor.

**Criterios de aceptación**

- [ ] Predicciones de consumo de combustible semanales y mensuales por equipo y por proyecto
- [ ] El pronóstico considera la línea base del tipo de equipo, los patrones de utilización y los factores estacionales.
- [] Vista comparativa del presupuesto: costo de combustible previsto versus presupuesto asignado
- [] Alertas cuando el gasto proyectado excede el umbral presupuestario (% configurable)
- [] Visualización de precisión histórica que muestra la precisión del pronóstico anterior

**Fuentes de datos**

- `vale_combustible` — cantidades de combustible, fechas, asignaciones de equipos
- `analisis_combustible` — datos de análisis de eficiencia de combustible
- `parte_diario` — horas trabajadas (intensidad de uso)
- `tipo_equipo` — tasas de consumo esperadas por tipo

**Impacto empresarial**

- Presupuestos de combustible más precisos (actualmente estimados manualmente)
- Identifica oportunidades de ahorro de costos a través de la optimización de adquisiciones.

---

#### Característica 1.4: Puntuación del riesgo de renovación del contrato

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Regresión logística / XGBoost

**Descripción**
Califique cada contrato activo según la probabilidad de renovación (0-100 %) según la utilización del equipo, el historial de pagos, la frecuencia de inoperabilidad y las puntuaciones de evaluación de proveedores.

**Historia de usuario**

> Como **Director**, quiero saber qué contratos corren el riesgo de no renovarse para poder abordar los problemas de manera proactiva y planificar los cambios de flota.

**Criterios de aceptación**

- [] Cada contrato activo muestra una puntuación de riesgo de renovación con factores contribuyentes
- [] Contratos ordenados por riesgo en una vista dedicada
- [ ] Los factores de riesgo son explicables (p. ej., "Baja utilización: 35%", "2 pagos atrasados", "Evaluación del proveedor: 2,1/5")
- [ ] Línea de tendencia que muestra cómo ha cambiado el riesgo durante el período del contrato
- [ ] Alertas para contratos de alto riesgo (>60% de probabilidad de no renovación)

**Fuentes de datos**

- `contrato_adenda` — términos del contrato, fechas, tarifas
- `valorizacion_equipo` — facturación y utilización mensual
- `registro_pago` — puntualidad del pago
- `periodo_inoperatividad` — frecuencia del tiempo de inactividad
- `evaluacion_proveedor` — puntuaciones de satisfacción de proveedores

**Impacto empresarial**

- Retención proactiva del contrato
- Mejor planificación de la flota cuando se prevén no renovaciones

---

#### Característica 1.5: Previsión de costes de mantenimiento

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Regresor de bosque aleatorio

**Descripción**
Prediga los costos de mantenimiento del próximo mes por tipo de equipo y por proyecto para respaldar la asignación presupuestaria.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero pronosticar los gastos de mantenimiento para poder asignar presupuestos con precisión y evitar sorpresas.

**Criterios de aceptación**

- [ ] Predicción de costos de mantenimiento mensual por tipo de equipo y por proyecto
- [ ] Desglose por tipo de mantenimiento (preventivo, correctivo, emergencia)
- [ ] Comparación con promedios y tendencias históricas
- [] Alertas de variación presupuestaria cuando los costos previstos exceden la asignación
- [ ] El modelo considera la antigüedad del equipo, la intensidad de uso y el historial de mantenimiento.

**Fuentes de datos**

- `programa_mantenimiento` — registros de mantenimiento con costos
- `equipo` — antigüedad y tipo de equipo
- `parte_diario` — intensidad de uso
- `centro_costo` — asignaciones presupuestarias

**Impacto empresarial**

- Reduce la variación presupuestaria en las líneas de mantenimiento.
- Permite una gestión proactiva de costes.

---

#### Característica 1.6: Previsión de la demanda de equipos

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Serie temporal + Regresión

**Descripción**
Prediga la demanda de tipo de equipo por proyecto para el próximo trimestre en función de los patrones históricos de solicitudes y las fases del proyecto.

**Historia de usuario**

> Como **Director**, quiero anticipar qué tipos de equipos se necesitarán el próximo trimestre para poder negociar previamente los alquileres y evitar retrasos en el proyecto.

**Criterios de aceptación**

- [ ] Previsión de demanda trimestral por tipo de equipo y proyecto
- [ ] Mapa de calor de demanda visual (tipo de equipo × mes)
- [ ] Comparación con la capacidad actual de la flota
- [ ] Análisis de deficiencias: "Necesitará 3 excavadoras adicionales en el segundo trimestre"
- [] Seguimiento de precisión histórica

**Fuentes de datos**

- `solicitud_equipo` — solicitudes históricas de equipos (tipo, cantidad, fechas)
- `equipo_edt` — asignaciones de equipo a proyecto
- `contrato_adenda` — períodos de contrato que indican la demanda

**Impacto empresarial**

- Reduce la adquisición de equipos de emergencia.
- Optimiza las decisiones de compra/alquiler a largo plazo

---

#### Característica 1.7: Predicción del valor de reventa de equipos

**Prioridad**: BAJA-MEDIA | **Complejidad**: Media | **Tecnología**: Regresor de bosque aleatorio

**Descripción**
Prediga el momento óptimo para vender maquinaria pesada propia pronosticando su valor de reventa futuro en comparación con los costos de mantenimiento proyectados y la curva de depreciación.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero que el sistema me diga exactamente cuándo una excavadora deja de ser rentable para conservar y mantener suficiente valor residual para vender, de modo que podamos maximizar nuestro retorno sobre los activos.

**Criterios de aceptación**

- [ ] Curva de depreciación prevista trazada contra los costos de mantenimiento proyectados.
- [ ] Calcula el "Punto de Reemplazo Óptimo" (punto de inflexión donde mantener la máquina cuesta más que reemplazarla).
- [ ] Considera las tendencias actuales del mercado para equipos pesados ​​usados ​​(web scraping o entrada de índice manual).
- [ ] Alerta 6 meses antes de la ventana de reemplazo óptima prevista.

**Fuentes de datos**

- `equipo` — precio de compra, antigüedad, modelo.
- `programa_mantenimiento` — costos de mantenimiento históricos y proyectados.
- `parte_diario` — horómetro acumulativo (desgaste).

**Impacto empresarial**

- Maximiza la rentabilidad del ciclo de vida de los activos.
- Transforma la renovación de la flota de una suposición reactiva a una estrategia financiera basada en datos.

---

#### Característica 1.7: Predicción de retraso en el pago

**Prioridad**: BAJA-MEDIA | **Complejidad**: Baja | **Tecnología**: Regresión logística

**Descripción**
Prediga qué valoraciones probablemente experimentarán retrasos en los pagos, por proveedor, para respaldar la planificación del flujo de caja.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero saber qué pagos es probable que se retrasen para poder administrar el flujo de caja de manera proactiva y escalarlo temprano.

**Criterios de aceptación**

- [ ] Cada valoración pendiente muestra una probabilidad de retraso (%)
- [] Lista clasificada de pagos "en riesgo" en el panel de finanzas
- [ ] Factores contribuyentes visibles (historial de proveedores, monto de valoración, temporada)
- [] Integración con vistas de programación de pagos existentes

**Fuentes de datos**

- `registro_pago` — fechas de pago históricas versus fechas de vencimiento
- `valorizacion_equipo` — importes y fechas de valoración
- `proveedor`: historial de pagos a proveedores

**Impacto empresarial**

- Mejora de la gestión del flujo de caja.
- Escalamiento más temprano para pagos en riesgo

---

### Categoría 2: Detección de anomalías

> **Tema**: Identifique proactivamente problemas de calidad de datos, posibles fraudes y anomalías operativas antes de que se conviertan en problemas costosos.

---

#### Característica 2.1 — Anomalías en el consumo de combustible

**Prioridad**: ALTA | **Complejidad**: Baja-Media | **Tecnología**: Bosque de aislamiento / Puntuación Z

**Descripción**
Detecte proporciones anormales de galones por hora en comparación con las líneas base del tipo de equipo. Señala posibles robos de combustible, ineficiencias mecánicas o errores de entrada de datos.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero recibir alertas cuando algún equipo muestre un consumo anormal de combustible para poder investigar posibles robos o problemas mecánicos de inmediato.

**Criterios de aceptación**

- [ ] El sistema calcula galones/hora de referencia por tipo de equipo a partir de datos históricos
- [ ] Cada entrada de vale de combustible se compara con la línea de base
- [ ] Anomalías marcadas con gravedad: ADVERTENCIA (1,5-2 veces el valor inicial), CRÍTICA (>2 veces el valor inicial)
- [] Alertas de anomalía enviadas a través del sistema de notificación con enlace al bono específico
- [] Vista del panel que muestra todas las anomalías activas con tendencias
- [ ] Umbral de sensibilidad configurable por tipo de equipo
- [ ] Despido por falso positivo con seguimiento de motivos

**Fuentes de datos**

- `vale_combustible` — cantidad_galones, id_equipo, fecha
- `parte_diario` — horas_trabajadas para el mismo periodo
- `tipo_equipo` — valores de referencia esperados en gal/hr

**Impacto empresarial**

- Los puntos de referencia de la industria sugieren que entre el 5% y el 15% de los costos de combustible se pierden por robo o desperdicio.
- Incluso una tasa de detección del 50% representa ahorros significativos

---

#### Característica 2.2: Detección de manipulación del horómetro/odómetro

**Prioridad**: ALTA | **Complejidad**: Baja | **Tecnología**: basada en reglas + media móvil

**Descripción**
Detecte lecturas imposibles del horómetro/odómetro: inversiones (final <inicial), saltos poco realistas (por ejemplo, más de 50 horas en un día), progresión cero durante las horas de trabajo informadas y desviaciones significativas del promedio móvil.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero que el sistema detecte automáticamente lecturas horométricas sospechosas para que la precisión de la facturación y el seguimiento del equipo no se vean comprometidos.

**Criterios de aceptación**

- [] Validación en tiempo real en la entrada del informe diario: advierte al operador antes del envío
- [] El escaneo por lotes posterior al envío detecta lecturas que se escapan
- [ ] Reglas de detección:
  - Inversión: `horometro_final < horometro_inicial`
  - Brecha: `horometro_inicial de hoy != horometro_final de ayer`
  - Excesivo: `horometro_final - horometro_inicial > 24` (imposibilidad física)
  - Trabajo cero: `horas_trabajadas > 0` pero `horometro_delta = 0`
- [] Los registros marcados aparecen en una cola de revisión de "Calidad de los datos"
- [ ] Clasificación de gravedad: ERROR (imposible), ADVERTENCIA (sospechoso)
- [ ] Impacto en los cálculos de valoración resaltados

**Fuentes de datos**

- `parte_diario` — horometro_inicial, horometro_final, horas_trabajadas
- Reportes diarios secuenciales por equipo (series de tiempo)

**Impacto empresarial**

- Previene errores de facturación causados por datos incorrectos del horómetro
- Disuade la manipulación de datos
- Mejora la precisión de la programación de mantenimiento (basada en horómetro)

---

#### Característica 2.3: Indicadores de calidad del informe diario

**Prioridad**: MEDIA-ALTA | **Complejidad**: Baja | **Tecnología**: basada en reglas + detección de valores atípicos

**Descripción**
Marque informes diarios con patrones sospechosos que indiquen problemas de calidad de los datos: cero horas con producción reportada, campos obligatorios faltantes, horas que exceden la duración del turno o valores atípicos estadísticos en las métricas de producción.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero que los informes diarios con problemas de calidad se marquen automáticamente para poder centrar mi tiempo de revisión en los informes que necesitan atención.

**Criterios de aceptación**

- [ ] Puntuación de calidad (A/B/C/D) asignada a cada informe diario
- [] Categorías de banderas: INCONSISTENCIA, MISSING_DATA, OUTLIER, IMPOSSIBLE_VALUE
- [ ] Banderas específicas:
  - Cero horas pero producción distinta de cero.
  - Horas > turno máximo (por ejemplo, >14 horas)
  - Falta operador o asignación de proyecto
  - Valores de producción >2σ de la media por tipo de equipo
- [] El panel de PM muestra un resumen de calidad del informe diario con desglose
- [ ] Seguimiento de tendencias de calidad por operador y proyecto

**Fuentes de datos**

- `parte_diario` — todos los campos (horas, producción, retrasos, operador)
- `parte_diario_detalle` — desglose detallado
- Distribuciones históricas por tipo de equipo y proyecto.

**Impacto empresarial**

- Reduce el tiempo de PM dedicado a revisar los informes diarios en ~40%
- Mejora la calidad general de los datos para análisis posteriores.

---

#### Característica 2.4 — Anomalías en el cálculo de valoración

**Prioridad**: MEDIA-ALTA | **Complejidad**: Baja | **Tecnología**: puntuación Z frente a media histórica

**Descripción**
Señale las valoraciones que se desvíen significativamente de los rangos esperados por tipo de contrato, tipo de equipo y patrones históricos.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero recibir alertas cuando una valoración parezca anormalmente alta o baja en comparación con las expectativas para poder verificar los cálculos antes de la aprobación.

**Criterios de aceptación**

- [ ] Cada valoración comparada con la media histórica ± 2σ para el mismo equipo/tipo de contrato
- [] Indicadores de anomalía: DEMASIADO ALTO, DEMASIADO BAJO, PRIMERA_OCCURRENCIA (sin línea de base)
- [ ] Factores contribuyentes mostrados (por ejemplo, "25% por encima del promedio de 6 meses para este contrato")
- [] La bandera aparece en el flujo de trabajo de aprobación de valoración.
- [ ] Informe resumido de anomalías mensual para Finanzas

**Fuentes de datos**

- `valorizacion_equipo` — montos calculados, equipo, contrato
- `contrato_adenda` — tipo de tarifa y tarifas
- Distribuciones de valoración histórica.

**Impacto empresarial**

- Previene errores de facturación y disputas de pago
- Aumenta la confianza en el proceso de valoración mensual.

---

#### Característica 2.5: Agrupación de incidentes de seguridad

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Agrupación DBSCAN

**Descripción**
Detecte grupos de incidentes de seguridad por ubicación, período de tiempo y tipo que puedan indicar problemas de seguridad sistémicos que requieran intervención.

**Historia de usuario**

> Como **Gerente de seguridad**, quiero identificar patrones en incidentes de seguridad (grupos por proyecto, tiempo o tipo) para poder implementar medidas preventivas específicas.

**Criterios de aceptación**

- [] La detección de clústeres se ejecuta semanalmente en datos de incidentes
- [ ] Clústeres identificados por: proyecto, tipo de incidente, ventana de tiempo, gravedad
- [] Mapa visual de conglomerados que muestra las concentraciones de incidentes
- [] Alerta cuando se detecta un nuevo clúster (3+ incidentes de tipo similar en 30 días en el mismo proyecto)
- [] El informe del grupo incluye acciones recomendadas según los tipos de incidentes.

**Fuentes de datos**

- `incidente_sst` — registros de incidentes (tipo, ubicación, fecha, gravedad)
- `reporte_acto_condicion` — informes de cuasi accidentes
- `proyecto` — ubicaciones del proyecto

**Impacto empresarial**

- Identifica problemas de seguridad sistémicos antes de que causen incidentes graves.
- Admite documentación de cumplimiento normativo

---

#### Característica 2.6: Degradación del desempeño del proveedor

**Prioridad**: MEDIA | **Complejidad**: Baja | **Tecnología**: Media móvil + Umbral

**Descripción**
Alerta cuando la confiabilidad, el tiempo de actividad del equipo o los tiempos de respuesta de un proveedor caen significativamente con respecto a su base histórica.

**Historia de usuario**

> Como **Gerente de Adquisiciones**, quiero una alerta temprana cuando el desempeño de un proveedor esté disminuyendo para poder intervenir antes de que afecte las operaciones.

**Criterios de aceptación**

- [] Puntuación de rendimiento móvil de 90 días por proveedor (compuesto de tiempo de actividad, respuesta y calidad)
- [] Alerta cuando la puntuación cae >15% desde el inicio de 6 meses
- [ ] Visualización de tendencias por proveedor
- [] Integración con vistas de evaluación de proveedores existentes
- [ ] Factores de degradación detallados (por ejemplo, "El tiempo de actividad disminuyó del 95 % al 82 %")

**Fuentes de datos**

- `evaluacion_proveedor` — puntuaciones de evaluación manual
- `periodo_inoperatividad` — tiempo de inactividad del equipo por equipo del proveedor
- `programa_mantenimiento` — tiempos de respuesta de mantenimiento

**Impacto empresarial**

- Gestión proactiva de proveedores.
- Base basada en datos para la renegociación de contratos o cambio de proveedor.

---

#### Característica 2.7: Predicción de desabastecimiento de inventario

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: Suavizado exponencial

**Descripción**
Prediga cuándo se agotarán los artículos logísticos (piezas, consumibles) en función de las tendencias de consumo, los tiempos de reordenamiento y los patrones estacionales.

**Historia de usuario**

> Como **Gerente de Logística**, quiero saber qué artículos tienen tendencia a agotarse para poder reordenarlos antes de que se agoten y detengamos las operaciones.

**Criterios de aceptación**

- [] Fecha de agotamiento prevista por artículo según la tasa de consumo
- [ ] Artículos ordenados por urgencia (días hasta agotar existencias)
- [ ] Considera el tiempo de entrega para reordenar
- [] Alerta en umbrales configurables (por ejemplo, "10 días para agotarse")
- [ ] Ajuste de consumo estacional

**Fuentes de datos**

- `producto` — niveles actuales de existencias
- `movimiento_inventario` — historial de consumo
- `solicitud_material` — señales de demanda

**Impacto empresarial**

- Evita paradas operativas por falta de piezas.
- Optimiza los costos de mantenimiento de inventario.

---

### Categoría 3: Investigación de operaciones y optimización

> **Tema**: Aplicar la optimización matemática a problemas de asignación, programación y gestión de recursos que actualmente se resuelven mediante juicio manual.

---

#### Característica 3.1: Optimizador de asignación de equipo a proyecto

**Prioridad**: ALTA | **Complejidad**: Alta | **Tecnología**: Programación lineal (PuLP / scipy)

**Descripción**
Resuelva el problema de asignación: asigne N unidades de equipo disponibles a M demandas del proyecto, minimizando el costo total (transporte + tiempo de inactividad + penalizaciones por desajuste) y al mismo tiempo satisfaciendo todas las restricciones.

**Historia de usuario**

> Como **Director**, quiero que el sistema recomiende la asignación óptima de equipos entre proyectos, minimizando los costos y garantizando que se satisfagan todas las necesidades del proyecto.

**Criterios de aceptación**

- [ ] Entrada: equipos disponibles (con ubicación actual), demandas del proyecto (tipo, cantidad, fechas)
- [ ] Salida: matriz de asignación recomendada con costo total
- [ ] Restricciones: compatibilidad del tipo de equipo, ventanas de disponibilidad, costos de transporte
- [ ] Comparación con asignación actual: “Ahorro potencial: S/. X,XXX/mes”
- [] Modo What-if: ajustar las entradas y resolver
- [ ] El usuario puede aceptar/rechazar/modificar recomendaciones

**Fuentes de datos**

- `equipo` — inventario de flota, asignaciones actuales, estado
- `solicitud_equipo` — demandas del proyecto
- `proyecto` — ubicaciones del proyecto
- `contrato_adenda` — tarifas de alquiler

**Impacto empresarial**

- Una asignación óptima puede reducir los costes de la flota entre un 10% y un 20%
- Elimina los equipos inactivos y satisface todas las demandas.

---

#### Característica 3.1b: Optimización dinámica de precios para alquileres salientes

**Prioridad**: BAJA-MEDIA | **Complejidad**: Alta | **Tecnología**: Aprendizaje por refuerzo/Modelos de elasticidad

**Descripción**
Si ARAMSA alquila sus propios equipos inactivos a terceros (subarrendamiento), este algoritmo sugiere el precio de alquiler óptimo en función de la demanda actual del mercado, la disponibilidad de la competencia y la depreciación de la máquina específica.

**Historia de usuario**

> Como **Gerente Comercial**, quiero que el sistema sugiera la tarifa de alquiler más rentable para nuestra maquinaria inactiva para no dejar dinero sobre la mesa cuando la demanda es alta y no perder acuerdos cuando la demanda es baja.

**Criterios de aceptación**

- [] Analiza las tasas históricas de ganancias/pérdidas de alquiler frente a los precios cotizados.
- [] Sugiere tarifas diarias/por hora para alquileres salientes según la estacionalidad y la utilización actual de la flota (inventarios).
- [ ] Cálculo del "precio mínimo" que garantiza que el alquiler cubra los costos mínimos de depreciación y mantenimiento.

**Fuentes de datos**

- `cotizacion_proveedor` (Histórico de cotizaciones de salida si está disponible).
- `equipo`: disponibilidad actual y costos de mantenimiento.

**Impacto empresarial**

- Maximiza los ingresos de la flota propia durante los períodos de menor actividad del proyecto.
- Reemplaza las hojas de tarifas estáticas con tarifas dinámicas que maximizan las ganancias.

---

#### Característica 3.2: Optimizador de asignación de equipos de operador

**Prioridad**: ALTA | **Complejidad**: Alta | **Tecnología**: Algoritmo húngaro / CSP

**Descripción**
Asigne de manera óptima operadores a los equipos según sus habilidades, certificaciones, disponibilidad, historial de desempeño y ubicación, maximizando la eficiencia operativa general.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero que el sistema recomiende el mejor operador para cada equipo según sus calificaciones y su historial de desempeño.

**Criterios de aceptación**

- [ ] Puntuación coincidente por par operador-equipo basada en:
  - Certificaciones requeridas versus certificaciones de operador
  - Competencia con el tipo de equipo
  - Rendimiento histórico en equipos similares.
  - Disponibilidad y preferencias de turno.
- [] Recomendaciones clasificadas para cada asignación de equipo
- [ ] Cumplimiento de restricciones: sin doble reserva, cumplimiento de la certificación
- [ ] Matriz de asignación visual
- [] Capacidad de anulación con seguimiento de motivos

**Fuentes de datos**

- `operador` — perfiles de operador
- `operador_habilidad` — habilidades y niveles de competencia
- `certificacion_operador` — certificaciones con fechas de vencimiento
- `disponibilidad_operador` — horarios de disponibilidad
- `parte_diario` — rendimiento histórico por tipo de equipo

**Impacto empresarial**

- Un mejor ajuste entre el operador y el equipo mejora la productividad
- Garantiza el cumplimiento de la certificación automáticamente.

---

#### Característica 3.3: Optimización del programa de mantenimiento

**Prioridad**: ALTA | **Complejidad**: Alta | **Tecnología**: Programación de restricciones (OR-Tools)

**Descripción**
Minimice el tiempo de inactividad de toda la flota programando el mantenimiento durante períodos de baja utilización, equilibrando la urgencia del mantenimiento con las necesidades operativas.

**Historia de usuario**

> Como **Gerente de mantenimiento**, quiero un programa de mantenimiento optimizado que minimice el tiempo de inactividad de la flota programando el trabajo durante los períodos de baja utilización.

**Criterios de aceptación**

- [ ] Entrada: fechas de vencimiento de mantenimiento (a partir de umbrales horométricos), pronósticos de utilización, disponibilidad de la tripulación
- [ ] Resultado: calendario de mantenimiento optimizado que minimiza el tiempo de inactividad total de la flota
- [ ] Restricciones: máximos mantenimientos simultáneos, capacidad de la tripulación, prioridad de los equipos críticos
- [ ] Comparación: "La programación optimizada ahorra X horas de tiempo productivo en comparación con la programación por orden de llegada"
- [] Calendario de arrastrar y soltar para ajustes manuales
- [] Reoptimización cuando cambian las entradas

**Fuentes de datos**

- `programa_mantenimiento` — programas y tipos de mantenimiento
- `parte_diario` — patrones de utilización (identifica ventanas de bajo uso)
- `equipo` — criticidad del equipo y asignaciones de proyectos

**Impacto empresarial**

- Reduce el tiempo productivo perdido por mantenimiento entre un 15 y un 25 %.
- Equilibra la carga de trabajo de mantenimiento entre la tripulación

---

#### Característica 3.4: Optimización del calendario de pagos

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Programación de LP

**Descripción**
Optimice el calendario de pagos para maximizar el flujo de caja respetando los plazos contractuales y aprovechando los descuentos por pago anticipado cuando estén disponibles.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero un cronograma de pagos optimizado que maximice nuestra posición de efectivo y al mismo tiempo cumpla con todas las obligaciones a tiempo.

**Criterios de aceptación**

- [ ] Entrada: pagos pendientes con fechas de vencimiento, montos y condiciones de descuento
- [ ] Salida: calendario de pagos optimizado con posición de caja diaria proyectada
- [ ] Restricciones: fechas de vencimiento, saldo mínimo de caja, umbrales de descuento por pago anticipado
- [ ] Comparación de escenarios: “Calendario optimizado ahorra S/. X,XXX en descuentos/intereses”
- [] Anulación manual con advertencias de violación de restricciones

**Fuentes de datos**

- `cuenta_por_pagar` — cuentas por pagar con fechas de vencimiento
- `registro_pago` — historial de pagos
- `caja_banco` — posición de caja actual

**Impacto empresarial**

- Mejora de la gestión del flujo de caja.
- Captar descuentos por pago anticipado cuando sea beneficioso

---

#### Característica 3.5: Comparación de tasas de contrato

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: Clasificación estadística + percentil

**Descripción**
Analice las tarifas de contratos históricas por tipo de equipo, modalidad y proveedor para proporcionar puntos de referencia de negociación e identificar tarifas por encima o por debajo del mercado.

**Historia de usuario**

> Como **Gerente de Adquisiciones**, quiero saber cómo se compara la tarifa de un contrato propuesto con nuestras tarifas históricas y puntos de referencia del mercado para poder negociar mejores condiciones.

**Criterios de aceptación**

- [ ] Tarifas de referencia por tipo de equipo + modalidad (horario, diario, mensual)
- [ ] Clasificación percentil: "Esta tasa está en el percentil 75 de sus contratos"
- [ ] Análisis de tendencias: tasas en el tiempo
- [ ] Comparación de proveedores: mismo tipo de equipo entre proveedores
- [] Comparación de autocompletar en la creación de nuevos contratos
- [] Alerta cuando la tasa propuesta está por encima del percentil 80

**Fuentes de datos**

- `contrato_adenda` — tarifas históricas por tipo y modalidad
- `tipo_equipo` — clasificaciones de equipos
- `proveedor` — información del proveedor
- `cotizacion_proveedor` — datos de cotización

**Impacto empresarial**

- Soporte de negociación basado en datos.
- Identifica contratos sobrevalorados para renegociación.

---

#### Característica 3.6: Ajuste del tamaño de la flota

**Prioridad**: MEDIA-ALTA | **Complejidad**: Alta | **Tecnología**: Análisis de decisiones multicriterio

**Descripción**
Recomiende qué equipo agregar, quitar o reemplazar según los datos de utilización, los costos de mantenimiento, los pronósticos de demanda y el análisis de antigüedad.

**Historia de usuario**

> Como **Director**, quiero recomendaciones basadas en datos sobre la composición de la flota (qué equipos conservar, agregar o eliminar gradualmente) para optimizar los costos totales de la flota.

**Criterios de aceptación**

- [ ] Puntuación por equipo: valor (utilización × ingresos) frente a coste (mantenimiento + tiempo de inactividad + depreciación)
- [ ] Recomendaciones a nivel de flota: "Eliminar 2 camiones volquete infrautilizados y agregar 1 excavadora"
- [ ] Datos de respaldo para cada recomendación
- [] Simulador What-if: cambiar la composición de la flota y ver el impacto proyectado
- [ ] Generación de informe de revisión anual

**Fuentes de datos**

- `equipo` — inventario de flota, antigüedad, tipo
- `parte_diario` — datos de utilización
- `programa_mantenimiento` — costos de mantenimiento
- `periodo_inoperatividad` — historial de tiempo de inactividad
- `valorizacion_equipo` — contribución a los ingresos
- `solicitud_equipo` — patrones de demanda

**Impacto empresarial**

- Previene el desperdicio de capital en equipos infrautilizados
- Garantiza que la flota coincida con los patrones de demanda reales.

---

#### Característica 3.7 — Programador de minimización de "alquiler muerto" (despacho diario)

**Prioridad**: ALTA | **Complejidad**: Alta | **Tecnología**: programación heurística/laboral

**Descripción**
Optimizar el despacho diario de equipos a los frentes de trabajo en base a mínimos contractuales. Garantiza que los equipos alquilados accedan a su Tarifa Horaria con Horas Mínimas antes que utilizar maquinaria propia o alquileres sin cuotas.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero que el sistema les diga a mis despachadores exactamente qué máquinas usar hoy para no dejar accidentalmente una máquina inactiva por la que ya estamos obligados a pagar un mínimo de 180 horas al mes.

**Criterios de aceptación**

- [ ] Lee los términos del contrato (CORP-GEM-F-001 / Anexo B) para identificar máquinas con cuotas horarias/diarias mínimas.
- [] Realiza un seguimiento de las horas acumuladas actuales frente al objetivo de cuota mensual en tiempo real.
- [ ] Genera una recomendación de despacho diario priorizando las máquinas en riesgo de no alcanzar sus mínimos.
- [] Alertas cuando la demanda del proyecto es demasiado baja para satisfacer todas las cuotas mínimas en la flota alquilada.
- [] Opción para anular manualmente con seguimiento de motivos.

**Fuentes de datos**

- `contrato_adenda` — tipos de tarifas y cláusulas mínimas de hora/día.
- `parte_diario` — horas acumuladas trabajadas en el ciclo de facturación actual.
- `solicitud_equipo` — demanda diaria/frentes de trabajo.

**Impacto empresarial**

- Eliminación directa de penalizaciones “Stand-by” pagadas a terceros proveedores.
- Maximiza el ROI en contratos de alquiler rígidos.

---

#### Característica 3.8: Ruta óptima para camiones cisterna de combustible (Ruta para vehículos)

**Prioridad**: MEDIA | **Complejidad**: Alta | **Tecnología**: Problema de enrutamiento de inventario (IRP)

**Descripción**
Calcule la ruta diaria óptima para el camión cisterna de combustible (Cisterna de Combustible) a través de grandes sitios de proyectos, garantizando que toda la maquinaria pesada se reabastezca de combustible justo a tiempo y minimizando la distancia de viaje del camión cisterna.

**Historia de usuario**

> Como **Gerente de Logística**, quiero una ruta optimizada para nuestro camión cisterna de combustible para que ninguna excavadora se quede sin gasolina a mitad de turno y el camión cisterna no pierda tiempo conduciendo sin rumbo por un proyecto de carretera de 50 km.

**Criterios de aceptación**

- [ ] Entrada: Ubicaciones GPS (o frentes de trabajo asignados) de maquinaria pesada activa.
- [ ] Entrada: Niveles de combustible actuales previstos (usando modelos con Característica 1.3).
- [ ] Salida: Ruta paso a paso o lista de secuencia para el operador del camión cisterna.
- [ ] Restricción: Capacidad del buque cisterna vs. demanda total de reabastecimiento de combustible.
- [ ] Concilia automáticamente la finalización de la ruta con los Vales de Combustible reales (CORP-LA-F-004) presentados.

**Fuentes de datos**

- `vale_combustible` — eventos de reabastecimiento de combustible históricos y actuales.
- `parte_diario` — utilización correlacionada con el consumo de combustible.
- `equipo_edt` — ubicación actual/asignación del frente de trabajo.

**Impacto empresarial**

- Evita costosas paradas operativas por falta de combustible en los equipos.
- Optimiza el tiempo del operador del camión cisterna y el uso de combustible.
- Refuerza el circuito de auditoría de los bonos de combustible.

---

### Categoría 4: Lenguaje Natural y LLM

> **Tema**: Haga que todo el ERP sea accesible a través de lenguaje natural, automatice el análisis de documentos y genere narrativas legibles por humanos a partir de datos.

---

#### Característica 4.1: BitCorp Copilot (Asistente ERP conversacional)

**Prioridad**: ALTA | **Complejidad**: Alta | **Tecnología**: Claude API + SQL/llamada de función

**Descripción**
Interfaz de chat donde cualquier usuario puede hacer preguntas en español y obtener respuestas en vivo de la base de datos. El copiloto traduce el lenguaje natural en consultas, las ejecuta de forma segura (solo lectura) y devuelve respuestas formateadas con tablas, gráficos y recomendaciones.

**Historia de usuario**

> Como **CEO/Director**, quiero hacer las preguntas sobre ERP en español sencillo, como "¿Cuantos equipos están inoperativos hoy y por qué?" — y obtenga respuestas instantáneas sin tener que navegar por varias páginas.

**Criterios de aceptación**

- [] Panel de chat accesible desde cualquier página de ERP (barra lateral deslizable o widget flotante)
- [] Admite consultas en lenguaje natural en español
- [] Tipos de consulta: recuentos, agregaciones, comparaciones, rangos de tiempo, listas filtradas
- [ ] Formatos de respuesta: texto plano, tablas, resumen estadístico
- [ ] Sólo lectura: no se modifican datos a través del chat
- [] Consciente del contexto: comprende la terminología del dominio ERP
- [ ] Memoria de conversación dentro de la sesión
- [] Consultar el registro de auditoría por seguridad
- [ ] Alternativa: "No pude entender eso. Intente preguntar sobre equipos, contratos, proyectos u operaciones".
- [] Ejemplos de indicaciones proporcionadas para nuevos usuarios

**Consultas de ejemplo**

- "¿Cuantas horas de trabajo el equipo EX-001 en enero?"
- "¿Cual es el equipo con mayor consumo de combustible este mes?"
- "Muestrame los contratos que vencen en los próximos 30 días"
- "¿Qué operadores tienen certificaciones vencidas?"
- "Comparar utilización de febrero vs marzo por tipo de equipo"

**Fuentes de datos**

- Todos los esquemas de bases de datos accesibles mediante generación SQL de solo lectura
- Metadatos de esquema para la comprensión de consultas.

**Impacto empresarial**

- Hace que se pueda acceder a más de 120 páginas de ERP a través de una única interfaz
- Reduce el tiempo de obtención de información de minutos a segundos
- El mayor "factor sorpresa" para demostraciones ejecutivas

---

#### Característica 4.2: Analizador de cláusulas contractuales

**Prioridad**: ALTA | **Complejidad**: Media | **Tecnología**: Claude API (análisis de documentos)

**Descripción**
Sube un PDF del contrato y haz que el sistema extraiga información clave: tipo de tarifa, tarifas, mínimos, penalizaciones, obligaciones y fechas importantes. Complete automáticamente los campos de creación de contratos a partir de los datos extraídos.

**Historia de usuario**

> Como **Gerente de Adquisiciones**, quiero cargar un contrato en PDF y que el sistema extraiga todos los términos clave para no tener que leer manualmente más de 30 páginas y correr el riesgo de perder obligaciones.

**Criterios de aceptación**

- [] Interfaz de carga de PDF en la página de creación de contrato
- [ ] Extractos: tipo de tarifa, tarifas, garantías mínimas, cláusulas penales, fechas de inicio/fin, partidos, obligaciones
- [] Campos extraídos presentados para su revisión antes de completar automáticamente el formulario
- [ ] Destaca cláusulas o términos inusuales que se desvían de los contratos estándar
- [ ] Admite contratos de varias páginas en español
- [] Puntuaciones de confianza por campo extraído
- [] Se requiere revisión humana antes de guardar (sin guardado automático)

**Fuentes de datos**

- PDF de contrato cargados
- Esquema `contrato_adenda` para mapeo de campos
- Contratos históricos como línea base de referencia.

**Impacto empresarial**

- Reduce el tiempo de revisión de contratos de horas a minutos
- Capta obligaciones que podrían omitirse en la revisión manual

---

#### Característica 4.3: Generador de narrativa de informes diarios

**Prioridad**: MEDIA | **Complejidad**: Baja | **Tecnología**: Claude API

**Descripción**
Generar automáticamente el campo "observaciones" en los informes diarios a partir de los datos numéricos ya ingresados (horas, producción, retrasos, consumo de combustible).

**Historia de usuario**

> Como **Operador**, quiero que el sistema sugiera una narrativa de observaciones basada en los números que ya ingresé para poder enviar informes más rápido con documentación más completa.

**Criterios de aceptación**

- [ ] Botón "Generar Observaciones" en el formulario de informe diario
- [ ] La narrativa incluye: resumen del estado del equipo, eventos notables, explicaciones de retrasos.
- [ ] Generado en español apropiado para informes de campo
- [] Editable antes del envío (solo sugerencia)
- [ ] Contextual: hace referencia a retrasos específicos, anomalías en la producción
- [ ] NO reemplaza la capacidad del operador para escribir observaciones manuales

**Fuentes de datos**

- Campos del formulario `parte_diario` (entrada actual)
- `parte_diario_detalle` — retrasos y averías en la producción
- Informes históricos para el mismo equipo (patrones)

**Impacto empresarial**

- Reduce el tiempo de finalización del informe entre 5 y 10 minutos por informe
- Mejora la calidad de la documentación para el seguimiento de auditoría.

---

#### Característica 4.4: Resumen ejecutivo de valoración

**Prioridad**: MEDIA | **Complejidad**: Baja | **Tecnología**: Claude API

**Descripción**
Genere automáticamente un resumen ejecutivo en lenguaje sencillo de los datos financieros de valoración mensuales, destacando métricas, variaciones y tendencias clave.

**Historia de usuario**

> Como **Director**, quiero un resumen en lenguaje sencillo de cada valoración mensual (no solo números) que me diga qué es importante y qué necesita atención.

**Criterios de aceptación**

- [ ] Botón "Generar resumen" en la vista de valoración
- [] El resumen incluye: monto total de valoración, comparación con el mes anterior, variaciones notables, aspectos destacados del equipo
- [ ] Escrito en español amigable para ejecutivos
- [ ] Información útil resaltada (p. ej., "Equipo EX-003 infrautilizado en un 25 %; considere la reasignación")
- [ ] Exportable como parte del informe de valoración en PDF

**Fuentes de datos**

- `valorizacion_equipo` — valoraciones actuales e históricas
- `valorizacion_detalle` — detalles de la línea de pedido
- `contrato_adenda` — términos del contrato para contexto

**Impacto empresarial**

- Ahorra tiempo ejecutivo en reuniones de revisión de valoración.
- Destaca problemas que podrían estar ocultos en hojas de cálculo.

---

#### Característica 4.5: Seguridad 5: Asistente de causa raíz

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Claude API + RAG

**Descripción**
Guíe el análisis de la causa raíz de los 5 por qué para incidentes de seguridad sugiriendo causas raíz basadas en incidentes históricos similares (RAG – Generación Aumentada de Recuperación).

**Historia de usuario**

> Como **Gerente de Seguridad**, quiero un análisis de los 5 por qués asistido por IA que sugiera las causas fundamentales de incidentes pasados similares para que podamos aprovechar el conocimiento institucional.

**Criterios de aceptación**

- [] Disponible en el formulario de informe de incidentes durante la entrada 5-Why
- [] Recupera incidentes históricos similares por tipo, ubicación, equipo
- [] Sugiere posibles causas fundamentales basadas en conclusiones de incidentes similares.
- [] Cada sugerencia vinculada al incidente fuente para su verificación.
- [] El operador puede aceptar, modificar o rechazar sugerencias.
- [] Aprende de las sugerencias aceptadas para mejorar futuras recomendaciones.

**Fuentes de datos**

- `incidente_sst` — registros de incidentes
- `reporte_acto_condicion` — campos por_que_1 a por_que_5
- Análisis históricos de causa raíz (integrados para RAG)

**Impacto empresarial**

- Acelera la investigación de incidentes
- Previene incidentes recurrentes al sacar a la luz patrones históricos

---

#### Característica 4.6: Narrativa de evaluación de proveedores

**Prioridad**: BAJA-MEDIA | **Complejidad**: Baja | **Tecnología**: Claude API

**Descripción**
Genere automáticamente resúmenes de evaluación estructurados a partir de datos de puntuación de proveedores, creando informes de evaluación profesionales y coherentes.

**Historia de usuario**

> Como **Gerente de Adquisiciones**, quiero narrativas de evaluación de proveedores generadas automáticamente que pueda incluir en los informes de adquisiciones y compartir con la gerencia.

**Criterios de aceptación**

- [ ] Botón "Generar evaluación" en la página de evaluación de proveedores
- [] La narrativa cubre: puntuación general, fortalezas, debilidades, comparación con pares, recomendación.
- [] Estructura consistente en todas las evaluaciones de proveedores.
- [] Editable antes de la finalización
- [ ] Comparación histórica: "El rendimiento mejoró un 12% respecto a la última evaluación"

**Fuentes de datos**

- `evaluacion_proveedor` — datos de puntuación en todas las categorías
- Evaluaciones históricas para análisis de tendencias.
- `proveedor` — información del perfil del proveedor

**Impacto empresarial**

- Documentación de evaluación consistente y profesional.
- Ahorra ~30 minutos por informe de evaluación

---

#### Característica 4.7: Búsqueda inteligente entre módulos

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: Claude API (enrutamiento por intención)

**Descripción**
Barra de búsqueda unificada que dirige consultas en lenguaje natural al módulo correcto con filtros aplicados previamente. Actúa como una alternativa ligera al Copilot completo.

**Historia de usuario**

> Como **cualquier usuario**, quiero escribir lo que estoy buscando en una barra de búsqueda, como "contratos de excavadoras vencidos", y ser llevado directamente a la página correcta con los filtros aplicados.

**Criterios de aceptación**

- [] Barra de búsqueda global en la navegación superior
- [] Entiende la intención: tipo de entidad (equipo, contrato, operador, etc.) + filtros (intervalo de fechas, estado, tipo)
- [] Rutas a la página del módulo correcto con filtros aplicados previamente
- [] Alternativa: si la intención no está clara, muestra resultados categorizados de todos los módulos
- [] Búsquedas recientes guardadas para un acceso rápido
- [] Admite entrada de texto y voz (meta ambiciosa)

**Fuentes de datos**

- Registro de módulos (mapeo de entidades a rutas)
- Filtrar esquema por módulo.
- Historial de consultas para personalización.

**Impacto empresarial**

- Reduce el tiempo de navegación en más de 120 páginas
- Reduce la curva de aprendizaje para nuevos usuarios.

---

### Categoría 5: Visión por computadora

> **Tema**: Extraiga datos estructurados de imágenes y fotografías para reducir la entrada manual de datos y mejorar los procesos de verificación.

---

#### Característica 5.1: Análisis fotográfico del informe diario

**Prioridad**: MEDIA-ALTA | **Complejidad**: Media | **Tecnología**: API de Claude Vision

**Descripción**
Analice fotografías de equipos adjuntas a informes diarios para evaluar el estado, detectar daños visibles y verificar la identidad del equipo.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero un análisis de IA de las fotografías diarias del equipo para poder detectar tendencias de daños y verificar el estado del equipo sin revisar cada foto manualmente.

**Criterios de aceptación**

- [] Las fotos adjuntas a los informes diarios se analizan automáticamente
- [ ] Resultados del análisis: evaluación de la condición (buena/regular/mala), problemas visibles detectados, verificación de la identidad del equipo
- [] Alertas de daños cuando se detectan nuevos daños en comparación con fotos anteriores
- [] Seguimiento de la tendencia de la condición por equipo a lo largo del tiempo
- [] Análisis visible en la página de revisión del informe diario
- [ ] PM puede marcar falsos positivos

**Fuentes de datos**

- `parte_diario_foto` — fotos del equipo
- `equipo` — imágenes de referencia del equipo y detalles

**Impacto empresarial**

- Early damage detection prevents costly repairs
- Seguimiento automatizado del estado para disputas de arrendamiento/devolución

---

#### Característica 5.1b: Inspección automatizada de entrega y devolución de equipos

**Prioridad**: ALTA | **Complejidad**: Media | **Tecnología**: API de Claude Vision

**Descripción**
Agilizar el proceso de "Acta de Entrega" (CORP-GEM-F-010) mediante el uso de visión por computadora para leer los indicadores del tablero (horómetro, nivel de combustible) y escanear el exterior en busca de daños específicamente durante los eventos de entrega/devolución.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero tomar una fotografía del tablero y de la máquina durante la entrega, y hacer que la IA registre instantáneamente el nivel de combustible, el horómetro y las abolladuras preexistentes para que nunca tengamos disputas con los proveedores al regresar.

**Criterios de aceptación**

- [] UI móvil primero para el evento de entrega.
- [] La IA extrae la lectura exacta del horómetro y el porcentaje del indicador de combustible de las fotos del tablero.
- [ ] Análisis diferencial: compara fotos de "Devolución" con fotos de "Entrega" para resaltar nuevos daños.
- [ ] Autocompleta el formulario CORP-GEM-F-010.

**Fuentes de datos**

- Fotografías de Entrega y Devolución (dashboards y exterior 360).
- `parte_diario` para cruzar las lecturas finales del horómetro.

**Impacto empresarial**

- Reduce drásticamente los costos de disputas con terceros proveedores sobre daños y niveles de combustible.
- Acelera el proceso de desmovilización.

---

#### Característica 5.2: OCR del comprobante de combustible

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: API de Claude Vision

**Descripción**
Fotografía de los vales de combustible y fecha de extracción del auto, galones, precio y proveedor. Valide de forma cruzada los datos extraídos con las entradas manuales.

**Historia de usuario**

> Como **Operador**, quiero tomar una foto del comprobante de combustible y que el sistema complete los detalles automáticamente para pasar menos tiempo ingresando datos.

**Criterios de aceptación**

- [] Cámara/interfaz de carga en el formulario de vale de combustible
- [ ] Extractos: fecha, cantidad (galones), precio unitario, total, nombre del proveedor, número de comprobante
- [] Rellena previamente los campos del formulario con datos extraídos
- [ ] Indicadores de confianza por campo (verde = confianza alta, amarillo = revisión)
- [] Validación cruzada contra entradas manuales cuando ambas existen
- [] Alertas de discrepancia cuando el OCR y la entrada manual no coinciden

**Fuentes de datos**

- Fotos del bono de combustible (capturadas o cargadas)
- `vale_combustible` — campos de formulario para población

**Impacto empresarial**

- Reduce el tiempo de entrada de datos del comprobante de combustible entre un 60 y un 80 %.
- Proporciona una capa de verificación contra errores manuales.

---

#### Característica 5.3 — Verificación de fotos de lista de verificación

**Prioridad**: BAJA-MEDIA | **Complejidad**: Media | **Tecnología**: API de Claude Vision

**Descripción**
Para los elementos de la lista de verificación que requieren fotografías, verifique que la fotografía muestre el componente correcto y la condición esperada.

**Historia de usuario**

> Como **Gerente de seguridad**, quiero estar seguro de que las fotografías de la lista de verificación realmente muestren el componente requerido en la condición esperada, no solo fotografías aleatorias tomadas para satisfacer el requisito.

**Criterios de aceptación**

- [] Las fotos de los elementos de la lista de verificación `requiere_foto` se analizan automáticamente
- [ ] Verificación: ¿la foto coincide con el tipo de componente esperado?
- [] Evaluación de la condición basada en los requisitos de los elementos de la lista de verificación
- [] Marcar fotos sospechosas (componente incorrecto, borrosas, duplicadas de otro elemento)
- [] Resultado de la verificación visible en la revisión de la lista de verificación

**Fuentes de datos**

- `checklist_detalle` — elementos de la lista de verificación con la bandera `requiere_foto`
- Fotos asociadas
- Descripciones de elementos de la lista de verificación para el contexto

**Impacto empresarial**

- Garantiza la calidad del cumplimiento de la lista de verificación.
- Reduce la aprobación de las inspecciones de seguridad.

---

#### Característica 5.4 — OCR de facturas para cuentas por pagar

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: API de Claude Vision

**Descripción**
Escanee facturas de proveedores y complete automáticamente los campos de cuentas por pagar (cuenta_por_pagar), reduciendo la entrada manual de datos y los errores de transcripción.

**Historia de usuario**

> Como **miembro del equipo de Finanzas**, quiero cargar una imagen de factura y que el sistema extraiga todos los detalles automáticamente para poder procesar las cuentas por pagar más rápido y con menos errores.

**Criterios de aceptación**

- [] Cargar interfaz en la página de creación de cuentas por pagar
- [ ] Extractos: nombre del proveedor/RUC, número de factura, fecha, rubros, montos, impuestos, total
- [] Mapea el proveedor extraído a los registros de "proveedor" existentes
- [ ] Pre-llenado de campos del formulario `cuenta_por_pagar`
- [] Puntuación de confianza por campo
- [] Revisión y confirmación humana antes de guardar
- [] Soporte de carga por lotes para múltiples facturas

**Fuentes de datos**

- Imágenes/escaneos de facturas
- `proveedor` — coincidencia de nombres de proveedores
- `cuenta_por_pagar` — campos de destino

**Impacto empresarial**

- Reduce el tiempo de procesamiento de facturas entre un 50 y un 70 %.
- Elimina errores de transcripción

---

### Categoría 6: Automatización inteligente

> **Tema**: Reduzca la entrada manual de datos, automatice las decisiones rutinarias y agregue protecciones inteligentes a los flujos de trabajo cotidianos.

---

#### Característica 6.1: Precarga de informe diario inteligente

**Prioridad**: ALTA | **Complejidad**: Baja | **Tecnología**: Basado en reglas + Coincidencia de patrones

**Descripción**
Transfiera automáticamente el horometro_final de ayer como horometro_inicial de hoy y sugiera el mismo operador, proyecto, turno y equipo según patrones recientes.

**Historia de usuario**

> Como **Operador**, quiero que el formulario de informe diario venga precargado con mis valores habituales para que solo tenga que actualizar lo que cambió, no volver a ingresar todo desde cero.

**Criterios de aceptación**

- [ ] `horometro_inicial` autocompletado desde el `horometro_final` del día anterior
- [ ] Operador, proyecto, turno sugerido del patrón de los últimos 3 días
- [ ] Equipo preseleccionado si el operador normalmente trabaja con el mismo
- [] Valores precargados claramente marcados como "sugeridos" (estilo diferente)
- [] Borrar con un clic para restablecer sugerencias
- [] Funciona tanto para la creación de nuevos informes diarios como para su continuación.

**Fuentes de datos**

- `parte_diario` — registros del día anterior para el mismo equipo/operador
- Historial de informes recientes del usuario (últimos 7 días)

**Impacto empresarial**

- Reducción estimada de más del 50 % en el tiempo de entrada de informes diarios
- Reduce los errores de entrada de datos (especialmente la continuidad del horometro)
- Máxima satisfacción del usuario para los operadores (ahorro de tiempo diario)

---

#### Característica 6.2: Enrutamiento de aprobación inteligente

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: basado en reglas + árbol de decisión

**Descripción**
Enrute automáticamente las solicitudes de aprobación al aprobador correcto según la cantidad, el tipo, el proyecto y la jerarquía organizativa. Predecir la probabilidad de aprobación basándose en patrones históricos.

**Historia de usuario**

> Como **solicitante**, quiero que mis aprobaciones se envíen automáticamente a la persona adecuada según el tipo y la cantidad, sin que tenga que averiguar quién aprueba qué.

**Criterios de aceptación**

- [] Reglas de enrutamiento basadas en: tipo de solicitud, umbral de monto, proyecto, departamento
- [] Escalamiento automático para montos superiores al umbral
- [ ] Indicador de probabilidad de aprobación (por ejemplo, "Basado en solicitudes similares, tasa de aprobación del 85%)"
- [] Enrutamiento alternativo cuando el aprobador principal no está disponible
- [] UI de administración de reglas de enrutamiento para administradores
- [] Registro de auditoría para decisiones de enrutamiento

**Fuentes de datos**

- `aprobacion_solicitud` — historial de aprobación
- `aprobacion_plantilla` — plantillas de aprobación
- Jerarquía de usuarios y roles.

**Impacto empresarial**

- Reduce el tiempo del ciclo de aprobación
- Elimina errores de enrutamiento y cuellos de botella

---

#### Característica 6.3: Autocompletar contrato a partir de cotización

**Prioridad**: MEDIA | **Complejidad**: Baja | **Tecnología**: Mapeo de campos basado en reglas

**Descripción**
Al crear un nuevo contrato, complete automáticamente los campos coincidentes de la cotización del proveedor seleccionado, lo que reduce la entrada de datos duplicados.

**Historia de usuario**

> Como **Gerente de adquisiciones**, quiero que los campos del contrato se completen automáticamente a partir de la cotización aceptada para no volver a ingresar información que ya se capturó.

**Criterios de aceptación**

- [] Botón "Crear contrato a partir de cotización" en la página de detalles de la cotización
- [ ] Automapas: tipos de equipos, cantidades, tarifas propuestas, proveedores, fechas
- [] Comparación lado a lado: valores de cotización versus campos de contrato
- [] Anulación manual para cualquier campo
- [ ] Destaca campos que difieren de la cotización

**Fuentes de datos**

- `cotizacion_proveedor` — detalles de la cotización
- `contrato_adenda` — campos del contrato para completar

**Impacto empresarial**

- Elimina la entrada de datos duplicados
- Reduce el tiempo de creación de contratos y los errores.

---

#### Característica 6.4: Activador de mantenimiento inteligente

**Prioridad**: ALTA | **Complejidad**: Baja-Media | **Tecnología**: ML basado en reglas + adaptable

**Descripción**
Cree automáticamente registros de mantenimiento cuando se alcancen los umbrales horométricos, con umbrales adaptativos basados en la condición del equipo y los patrones de uso.

**Historia de usuario**

> Como **Gerente de mantenimiento**, quiero que el mantenimiento se active automáticamente cuando el equipo alcance los intervalos de servicio, con umbrales adaptativos que tengan en cuenta las condiciones reales.

**Criterios de aceptación**

- [ ] Umbrales base por tipo de equipo (por ejemplo, cada 250 horas)
- [] Ajuste adaptativo: aumentar la frecuencia para equipos de alto uso, disminuir para equipos de bajo uso
- [] Crea automáticamente una tarea de mantenimiento con detalles precargados
- [ ] Notificación al equipo de mantenimiento cuando se desencadenan incendios.
- [] Panel que muestra los próximos activadores (horómetro de distancia hasta el siguiente servicio)
- [] Anulación: el administrador de mantenimiento puede ajustar los umbrales por equipo
- [ ] Considera el horometro real de `parte_diario`, no solo el tiempo del calendario

**Fuentes de datos**

- `parte_diario` — lecturas acumuladas del horómetro
- `programa_mantenimiento` — cronogramas y umbrales de mantenimiento
- `equipo` — tipo de equipo y especificaciones

**Impacto empresarial**

- Evita la falta de mantenimiento que provoca averías
- Pasa del mantenimiento basado en calendario al mantenimiento basado en el uso

---

#### Característica 6.5 — Clasificación automática del código de retraso

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: TF-IDF + Vecino más cercano (o Claude API)

**Descripción**
Sugiera automáticamente el código de retraso apropiado cuando un operador ingresa una descripción de retraso en texto libre, lo que reduce los errores de clasificación.

**Historia de usuario**

> Como **Operador**, quiero que el sistema sugiera el código de demora correcto cuando describo lo que sucedió, para no tener que buscar en un largo menú desplegable de códigos que no memorizo.

**Criterios de aceptación**

- [] Campo de entrada de texto donde el operador describe el retraso en texto libre
- [] Los 3 códigos de retraso principales sugeridos con puntuaciones de confianza
- [] El operador selecciona el código correcto (o escribe más para obtener mejores sugerencias)
- [] Aprendizaje: rastrea qué sugerencias se aceptan/rechazan
- [] Admite entrada de texto en español
- [] Regresar al menú desplegable completo si no se encuentra una buena coincidencia

**Fuentes de datos**

- `catalogo` — catálogo de códigos de retraso con descripciones
- `parte_diario_detalle` — descripciones de retrasos históricos y códigos seleccionados

**Impacto empresarial**

- Informes de retrasos más rápidos y precisos
- Reduce la clasificación errónea del código de retraso

---

#### Característica 6.6 — Verificación de cordura de valoración

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: Intervalos de confianza estadísticos

**Descripción**
Verificación independiente basada en ML después del cálculo de valoración: señala discrepancias entre los montos calculados y los rangos esperados según patrones históricos.

**Historia de usuario**

> Como **Gerente de Finanzas**, quiero una verificación independiente de la cordura de los cálculos de valoración: una segunda opinión que detecte errores en la lógica de cálculo antes de aprobarlos.

**Criterios de aceptación**

- [] Se ejecuta automáticamente después del cálculo de valoración
- [] Compara: cantidad calculada versus cantidad prevista en función de los insumos (horas, tarifas, tipo de equipo)
- [ ] Señala discrepancias que superan el umbral configurable (p. ej., ±15 %)
- [] Muestra el rango esperado con intervalo de confianza
- [] Indicador de pasa/falla en la pantalla de aprobación de valoración
- [ ] Explicación detallada de cualquier discrepancia

**Fuentes de datos**

- `valorizacion_equipo` — valoraciones calculadas
- `parte_diario` — horas de entrada/utilización
- `contrato_adenda` — tarifas y condiciones
- Valoraciones históricas para la línea de base.

**Impacto empresarial**

- La capa de verificación independiente reduce los errores de facturación
- Aumenta la confianza en el proceso de valoración.

---

#### Característica 6.7: Puntuación de prioridad de caducidad de documentos

**Prioridad**: MEDIA | **Complejidad**: Baja | **Tecnología**: Modelo de riesgo ponderado

**Descripción**
Mejore las alertas de vencimiento existentes con puntuación de riesgo de ML: clasifique qué vencimientos representan el mayor riesgo operativo según la criticidad del equipo, la importancia del tipo de documento y los patrones de uso.

**Historia de usuario**

> Como **Gerente de Proyecto**, quiero saber qué documentos vencidos son más importantes para renovar primero (no solo una lista plana de todos los elementos vencidos) para poder concentrarme en lo que más importa.

**Criterios de aceptación**

- [ ] Puntuación de riesgo (1-10) por documento/certificado vencido
- [ ] Factores de puntuación: utilización del equipo (uso elevado = mayor prioridad), tipo de documento (crítico para la seguridad = mayor), requisitos del proyecto
- [] Lista de prioridades ordenada: los vencimientos de mayor riesgo primero
- [ ] Urgencia codificada por colores: ROJO (vencido, alto riesgo), NARANJA (vencido pronto, alto riesgo), AMARILLO (vencido, bajo riesgo)
- [] Integración con el sistema de notificación existente.
- [ ] Pesos configurables por tipo de documento

**Fuentes de datos**

- `certificacion_operador` — certificaciones de operador con vencimiento
- `contrato_adenda` — fechas del contrato
- `equipo` — documentos del equipo (SOAT, inspecciones)
- `parte_diario` — utilización del equipo (para ponderación de criticidad)

**Impacto empresarial**

- Centra la atención en los vencimientos de mayor riesgo.
- Previene paros operativos debido a documentos críticos vencidos

---

### Categoría 7: Inteligencia Estratégica

> **Tema**: Transformar datos operativos en conocimientos estratégicos para la toma de decisiones ejecutivas.

---

#### Característica 7.1: Panel de control del costo total de propiedad (TCO)

**Prioridad**: ALTA | **Complejidad**: Media-Alta | **Tecnología**: Agregación estadística + ML de tendencias

**Descripción**
Calcule el TCO real por unidad de equipo: costo de alquiler + combustible + mantenimiento + costo del tiempo de inactividad + transporte, con comparación y tendencias.

**Historia de usuario**

> Como **Director**, quiero ver el costo total real de cada equipo (no solo el alquiler, sino también el combustible, el mantenimiento y el tiempo de inactividad) para poder identificar qué activos son rentables y cuáles son una fuente de dinero.

**Criterios de aceptación**

- [ ] TCO por equipo: alquiler + combustible + mantenimiento + tiempo de inactividad (calculado como pérdida de ingresos) + transporte
- [ ] TCO por hora/día/mes para comparar entre diferentes tamaños de equipos
- [] Comparación entre pares: mismo tipo de equipo, mismo tipo entre proveedores
- [ ] Gráficos de tendencias: TCO a lo largo del tiempo por equipo
- [ ] Resumen y tendencias del TCO a nivel de flota
- [] Desglose desde nivel de flota → tipo de equipo → equipo individual
- [] Exportar a PDF/Excel para presentaciones en foros

**Fuentes de datos**

- `valorizacion_equipo` — costos de alquiler
- `vale_combustible` — costos de combustible
- `programa_mantenimiento` — costos de mantenimiento
- `periodo_inoperatividad` — registros de tiempo de inactividad
- `contrato_adenda` — tarifas contratadas para el cálculo del coste del tiempo de inactividad

**Impacto empresarial**

- Primera visión completa de los costos reales de los equipos.
- Permite tomar decisiones sobre flotas basadas en datos

---

#### Característica 7.2: Análisis de rentabilidad del proyecto

**Prioridad**: ALTA | **Complejidad**: Media | **Tecnología**: Agregación + Pronóstico

**Descripción**
Realice un seguimiento de la contribución de los costos de los equipos a la rentabilidad del proyecto, comparando los costos reales con los presupuestos con la posición prevista al final del período.

**Historia de usuario**

> Como **Director**, quiero ver cómo los costos de los equipos impactan la rentabilidad de cada proyecto (y pronosticar dónde terminaremos al cierre del período) para poder intervenir tempranamente en proyectos que exceden el presupuesto.

**Criterios de aceptación**

- [ ] Desglose de costos de equipos por proyecto: alquiler, combustible, mantenimiento, por unidad de equipo
- [ ] Comparación entre presupuesto y real con análisis de varianza
- [] Costo previsto al final del período basado en la tasa de ejecución actual
- [] Alerta cuando los costos proyectados exceden el umbral presupuestario
- [] Comparación entre proyectos
- [] Desglose de los factores de costos específicos

**Fuentes de datos**

- `centro_costo` — presupuestos por proyecto/centro de costos
- `valorizacion_equipo` — costos reales del equipo
- `vale_combustible` — costos de combustible por proyecto
- `equipo_edt` — asignaciones de equipo a proyecto

**Impacto empresarial**

- Intervención temprana en proyectos que exceden el presupuesto.
- Mejor gestión de costos a nivel de proyecto

---

#### Característica 7.3: Cuadro de mando de proveedores mejorado con ML

**Prioridad**: MEDIA-ALTA | **Complejidad**: Media | **Tecnología**: compuesto ponderado con pesos ajustados automáticamente

**Descripción**
Puntuación automatizada de proveedores que combina métricas objetivas (tiempo de actividad del equipo, tasas de inoperabilidad, respuesta de mantenimiento, puntualidad de la entrega) con evaluaciones manuales, utilizando ponderaciones ajustadas automáticamente en función de la importancia de las métricas.

**Historia de usuario**

> Como **Gerente de Adquisiciones**, quiero un cuadro de mando de proveedores completo y actualizado automáticamente que combine datos concretos con evaluaciones manuales para poder tomar decisiones de adquisiciones objetivas.

**Criterios de aceptación**

- [ ] Puntuación compuesta por proveedor (0-100)
- [ ] Métricas objetivas (calculadas automáticamente): % de tiempo de actividad del equipo, tasa de inoperabilidad, tiempo de respuesta de mantenimiento, puntualidad de entrega
- [ ] Métricas subjetivas (de evaluaciones): calificación de calidad, comunicación, profesionalismo
- [] Ajuste de ponderación automático basado en la variación de la métrica (las métricas de alta variación obtienen una mayor ponderación)
- [ ] Tendencia histórica por proveedor
- [] Clasificación de pares dentro de la categoría de tipo de equipo
- [] Integración con vistas de evaluación de proveedores existentes

**Fuentes de datos**

- `evaluacion_proveedor` — puntuaciones de evaluación manual
- `periodo_inoperatividad` — tiempo de inactividad del equipo por proveedor
- `programa_mantenimiento` — datos de respuesta de mantenimiento
- `contrato_adenda` — datos de entrega y cumplimiento

**Impacto empresarial**

- Comparación objetiva de proveedores para decisiones de adquisiciones.
- Identifica proveedores de alto y bajo rendimiento.

---

#### Característica 7.4: Mapa de riesgo operativo

**Prioridad**: MEDIA-ALTA | **Complejidad**: Media | **Tecnología**: Puntuación de riesgo compuesta

**Descripción**
Mapa de calor visual que muestra el riesgo en todos los proyectos combinando incidentes de seguridad, mantenimiento vencido, vencimientos de documentos y tasas de inoperabilidad en una puntuación de riesgo unificada.

**Historia de usuario**

> Como **Director**, quiero una única imagen que muestre qué proyectos tienen el mayor riesgo operativo en todas las dimensiones (seguridad, mantenimiento, cumplimiento y rendimiento) para poder centrar la atención ejecutiva donde más se necesita.

**Criterios de aceptación**

- [] Puntuación de riesgo (1-10) por proyecto en 4 dimensiones: seguridad, mantenimiento, cumplimiento y rendimiento
- [] Mapa de calor visual: proyectos × dimensiones de riesgo, codificados por colores
- [ ] Puntuación general del riesgo del proyecto (compuesto ponderado)
- [] Desglose: haga clic en el proyecto para ver los factores de riesgo que contribuyen
- [ ] Tendencia semanal: ¿el riesgo mejora o empeora?
- [ ] Umbrales configurables para niveles de riesgo
- [] Alerta cuando algún proyecto cruza el umbral de riesgo crítico

**Fuentes de datos**

- `incidente_sst` — incidentes de seguridad por proyecto
- `programa_mantenimiento` — mantenimiento vencido por proyecto
- Datos de caducidad: documentos caducados por proyecto.
- `periodo_inoperatividad` — tasas de tiempo de inactividad por proyecto

**Impacto empresarial**

- Visibilidad del riesgo a nivel ejecutivo en una sola vista
- Permite la gestión proactiva de riesgos.

---

#### Característica 7.5: Comentario de IA sobre presupuesto versus real

**Prioridad**: MEDIA | **Complejidad**: Baja-Media | **Tecnología**: Claude API + Datos financieros

**Descripción**
Genere automáticamente comentarios en lenguaje natural sobre las variaciones de costos, explicando por qué ocurrieron y prediciendo la posición al final del período.

**Historia de usuario**

> Como **Director**, quiero comentarios generados por IA sobre las variaciones presupuestarias, no solo números, sino explicaciones de por qué los costos fueron superiores o inferiores y qué esperar en el futuro.

**Criterios de aceptación**

- [ ] Botón "Generar comentario" sobre el presupuesto versus el informe real
- [] El comentario cubre: las 3 variaciones principales con explicaciones, factores contribuyentes, dirección de la tendencia.
- [ ] Predicción: "Al ritmo de ejecución actual, el proyecto X finalizará S/. Y por encima o por debajo del presupuesto"
- [ ] Idioma: español amigable para ejecutivos
- [] Consciente del contexto: hace referencia a eventos específicos (por ejemplo, "El tiempo de inactividad del equipo EX-005 en la semana 3 generó el 40% de la variación de mantenimiento")
- [ ] Exportable con el informe financiero

**Fuentes de datos**

- `centro_costo` — presupuestos
- `valorizacion_equipo`, `vale_combustible`, `programa_mantenimiento` — costos reales
- `periodo_inoperatividad` — eventos contribuyentes

**Impacto empresarial**

- Transforma informes financieros de números a narrativas.
- Ahorra tiempo ejecutivo al comprender las variaciones.

---

#### Característica 7.6: Uso compartido de equipos entre proyectos

**Prioridad**: MEDIA | **Complejidad**: Media | **Tecnología**: O Coincidencia/Asignación

**Descripción**
Identifique equipos inactivos en un proyecto que podrían satisfacer la demanda de otro proyecto, incluido el análisis de costos de transferencia y el cálculo de beneficios netos.

**Historia de usuario**

> Como **Director**, quiero ver oportunidades para compartir equipos entre proyectos: qué equipo está inactivo, dónde, quién lo necesita y si vale la pena el costo de la transferencia.

**Criterios de aceptación**

- [ ] Panel que muestra: equipos inactivos (con ubicación) + demandas insatisfechas (con ubicación)
- [] Recomendaciones de coincidencia: "EX-003 inactivo en el Proyecto A puede satisfacer la demanda en el Proyecto B"
- [ ] Análisis de costos: costo de transferencia versus alquiler de una nueva unidad
- [ ] Cálculo del beneficio neto por recomendación
- [] Un clic para iniciar el flujo de trabajo de transferencia de equipos
- [] Filtra por tipo de equipo, ventana de tiempo, proyecto.

**Fuentes de datos**

- `equipo` — asignaciones actuales y estado
- `parte_diario` — utilización (identifica el equipo verdaderamente inactivo)
- `solicitud_equipo` — demandas incumplidas
- `proyecto` — ubicaciones del proyecto (para estimación de costos de transferencia)

**Impacto empresarial**

- Reduce los costos de equipos inactivos.
- Evita alquileres innecesarios de equipos nuevos.

---

## 6. Funciones de exhibición ("Factor sorpresa")

Estas tres características están diseñadas para brindar la máxima impresión ejecutiva y combinan múltiples capacidades.

### WOW 1: BitCorp Copilot: ERP conversacional

**Fusiona**: Función 4.1 (Copilot) + datos relevantes de todas las categorías

El CEO escribe en español: _"Muestrame los equipos con mas combustible de lo normal este mes y cuanto nos cuesta"_ y recibe:

1. Una tabla formateada de equipos con consumo anormal de combustible (de la Característica 2.1)
2. Cálculo del impacto en los costos por equipo.
3. Acciones sugeridas ("Investigar EX-007 — 2,3x consumo base, ahorro potencial de S/. 4.200/mes")
4. Navegación con un clic a las páginas relevantes

**Por qué impresiona**: Hace que todo el ERP de 120 páginas sea accesible a través de una conversación. Cualquier duda, cualquier dato, respuesta instantánea.

---

### WOW 2: Simulador digital de flota gemela

**Fusiona**: Funciones 3.1 (Asignación de equipos) + 3.6 (Adecuado tamaño de la flota) + 1.2 (Previsión de utilización)

**Nueva capacidad**: herramienta hipotética en la que el director general introduce un escenario ("Agregar 3 excavadoras, retirar 2 camiones volquete de la flota") y el sistema simula el impacto en:

- Tasas de utilización de la flota (próximos 6 meses)
- Costes totales (alquiler + mantenimiento + combustible)
- Cobertura del proyecto (qué proyectos ganan/pierden capacidad)
- Cambios en la carga de mantenimiento.

Utiliza simulación Monte Carlo con distribuciones históricas reales, junto con el solucionador de asignación OR.

**Por qué impresiona**: transforma el ERP de un sistema de mantenimiento de registros a una herramienta de planificación estratégica. Decisiones respaldadas por resultados simulados, no por intuiciones.

**Criterios de aceptación**

- [] Generador de escenarios: agregar/eliminar/reemplazar unidades de equipo
- [ ] Simulación de 6 meses con intervalos de confianza
- [ ] Comparación lado a lado: flota actual versus flota propuesta
- [ ] Métricas de impacto: utilización, coste, cobertura, mantenimiento
- [] Guardar y comparar múltiples escenarios
- [] Monte Carlo con más de 1000 iteraciones para mayor confianza estadística
- [ ] Visual: curvas de utilización, cascada de costos, matriz de cobertura

---

### WOW 3: Radar de anomalías: panel de señales múltiples

**Fusiona**: Funciones 2.1 (Combustible) + 2.2 (Horómetro) + 2.3 (Calidad del informe) + 2.4 (Valoración) + 2.5 (Seguridad) + 2.6 (Proveedor)

**Nueva capacidad**: Panel de control único de "radar de amenazas" que fusiona todos los detectores de anomalías en una vista unificada con:

- Puntuación de gravedad de anomalías en tiempo real (1-10)
- Resúmenes de investigación generados por LLM por anomalía
- Desglose de registros de origen con un solo clic
- Acciones correctivas sugeridas
- Tendencias históricas de frecuencia de anomalías.

**Por qué impresiona**: visualmente atractivo, proactivo y completo. Una pantalla para ver todo lo que necesita atención.

**Criterios de aceptación**

- [] Panel unificado con tarjetas de anomalías agrupadas por tipo
- [] Puntuación de gravedad (1-10) por anomalía con código de colores
- [] Resumen de investigación generado por LLM por anomalía (Claude API)
- [] Enlace del registro fuente para cada anomalía
- [ ] Acciones correctivas sugeridas por tipo de anomalía
- [] Filtrar por: tipo, gravedad, proyecto, rango de fechas
- [ ] Gráfico de tendencias: frecuencia de anomalías en el tiempo
- [] Flujo de trabajo de resolución de anomalías (reconocer → investigar → resolver)

---

## 7. Fases de implementación

### Fase 1: Ganancias rápidas (semanas 1 a 4)

**Objetivo**: Ofrecer valor inmediato al usuario con funciones basadas en reglas que no requieren capacitación en aprendizaje automático.

| Característica                                         | Esfuerzo | Dependencias |
| ------------------------------------------------------ | :------: | ------------ |
| 6.1 Precarga del informe diario inteligente            | 3-5 días | Ninguno      |
| 2.2 Manipulación del horómetro/odómetro                | 3-4 días | Ninguno      |
| 2.1 Anomalías en el consumo de combustible             | 4-5 días | Ninguno      |
| 6.7 Puntuación de prioridad de caducidad de documentos | 2-3 días | Ninguno      |
| 6.4 Activador de mantenimiento inteligente             | 4-5 días | Ninguno      |

**Requisitos previos**: Configure la estructura del paquete `app/servicios/ml/` y el enrutador `app/api/ia.py`.

**Criterios de salida**: las 5 funciones implementadas, probadas y visibles en la interfaz de usuario del ERP.

---

### Fase 2: Core ML (semanas 5 a 12)

**Objetivo**: entrenar e implementar los primeros modelos de aprendizaje automático utilizando datos históricos.

| Característica                      |  Esfuerzo   | Dependencias                                                 |
| ----------------------------------- | :---------: | ------------------------------------------------------------ |
| 1.1 Predicción de fallas del equipo | 2-3 semanas | `parte_diario` histórico suficiente + datos de mantenimiento |
| 1.2 Previsión de utilización        | 1-2 semanas | Más de 6 meses de datos de informes diarios                  |
| 3.1 Asignación de equipo a proyecto | 2-3 semanas | Datos de equipos y proyectos                                 |
| 3.2 Asignación de operador-equipo   | 1-2 semanas | Habilidades del operador y datos de certificación            |

**Requisitos previos**: Fase 1 completa, infraestructura de aprendizaje automático (canal de capacitación de modelos, control de versiones, cron de reentrenamiento).

**Nuevas dependencias**: `scikit-learn`, `profhet`, `scipy`/`pulp`

**Criterios de salida**: modelos entrenados, validados (>70% de precisión en datos reservados) y predicciones de entrega.

---

### Fase 3: Integración LLM (semanas 8-14)

**Objetivo**: Integrar Claude API para funciones de lenguaje natural. Puede superponerse con la Fase 2.

| Característica                              |  Esfuerzo   | Dependencias                                         |
| ------------------------------------------- | :---------: | ---------------------------------------------------- |
| 4.1 Copiloto de BitCorp (Asistente de NL)   | 3-4 semanas | Metadatos de esquema, capa de seguridad de consultas |
| 4.2 Analizador de cláusulas contractuales   | 1-2 semanas | Infraestructura de carga de PDF                      |
| 5.1 Análisis fotográfico del informe diario | 1-2 semanas | El almacenamiento de fotografías ya existe           |
| 5.2 Comprobante de combustible OCR          | 1-2 semanas | Componente de cámara/carga                           |

**Requisitos previos**: Claude API aprovisionada, presupuesto de uso aprobado, paquete `app/servicios/llm/`.

**Nuevas dependencias**: SDK de Python `antrópico`

**Criterios de salida**: El copiloto responde consultas con precisión, el OCR reduce el tiempo de entrada de datos en un 50 %+.

---

### Fase 4: Inteligencia Avanzada (Semanas 12-24)

**Objetivo**: implementar las funciones más complejas y las tres capacidades de exhibición "sorprendentes".

| Característica                                    |  Esfuerzo   | Dependencias                                          |
| ------------------------------------------------- | :---------: | ----------------------------------------------------- |
| 7.1 Panel de control del coste total de propiedad | 2-3 semanas | Todas las fuentes de datos de costes integradas       |
| 7.4 Mapa de riesgo operacional                    | 2-3 semanas | Detectores de anomalías de la Fase 1                  |
| 3.3 Optimización del programa de mantenimiento    | 2-3 semanas | OR-Tools, previsiones de utilización de la fase 2     |
| WOW 2: Simulador digital de flota gemela          | 3-4 semanas | Solucionador de asignaciones + previsión de la Fase 2 |
| WOW 3: Panel de radar de anomalías                | 2-3 semanas | Todos los detectores de anomalías de la Fase 1        |

**Requisitos previos**: Fases 1 a 3 completas (se basa en capacidades anteriores).

**Nuevas dependencias**: `ortools` (Google OR-Tools)

**Criterios de salida**: Demostración ejecutiva lista con las tres características sorprendentes funcionales.

---

### Funciones restantes (posteriores a la fase 4)

Las funciones que no se encuentran en las fases 1 a 4 tienen prioridad para iteraciones posteriores:

- 1.3, 1.4, 1.5, 1.6, 1.7 (modelos predictivos adicionales)
- 2.3, 2.4, 2.5, 2.6, 2.7 (detectores de anomalías adicionales)
- 3.4, 3.5 (funciones OR adicionales)
- 4.3, 4.4, 4.5, 4.6, 4.7 (funciones LLM adicionales)
- 5.3, 5.4 (características CV adicionales)
- 6.2, 6.3, 6.5, 6.6 (automatización adicional)
- 7.2, 7.3, 7.5, 7.6 (características estratégicas adicionales)

---

## 8. Arquitectura técnica

### 8.1 Nuevos paquetes de backend

```
aplicación/
├── servicios/
│ ├── ml/ # NUEVO: capa de servicio ML
│ │ ├── __init__.py
│ │ ├── modelo_base.py # Clase base para modelos ML
│ │ ├── prediccion_fallas.py # Característica 1.1
│ │ ├── pronostico_utilizacion.py # Característica 1.2
│ │ ├── anomalia_combustible.py # Característica 2.1
│ │ ├── detección_horometro.py # Característica 2.2
│ │ ├── optimizacion_asignacion.py # Característica 3.1
│ │ └── ...
│ ├── llm/ # NUEVO: capa de integración LLM
│ │ ├── __init__.py
│ │ ├── cliente_claude.py # Envoltorio del cliente Claude API
│ │ ├── copiloto.py # Característica 4.1
│ │ ├── analizador_contrato.py # Característica 4.2
│ │ ├── vision.py # Características 5.x
│ │ └── ...
│ └── ia/ # NUEVO: Orquestación de IA
│ ├── __init__.py
│ ├── prefill_inteligente.py # Característica 6.1
│ ├── trigger_mantenimiento.py # Característica 6.4
│ ├── prioridad_vencimiento.py # Característica 6.7
│ └── ...
├──api/
│ └── ia.py # NUEVO: rutas API de función AI
├──esquemas/
│ └── ia.py # NUEVO: AI presenta DTO
```

### 8.2 Nuevas dependencias de Python

| Paquete          | Versión | Utilizado para                                   |
| ---------------- | ------- | ------------------------------------------------ |
| `scikit-aprende` | ≥1,4    | Clasificación, regresión, detección de anomalías |
| `profeta`        | ≥1,1    | Previsión de series temporales                   |
| `picante`        | ≥1,12   | Optimización, estadísticas                       |
| `pulpa`          | ≥2,7    | Programación lineal                              |
| `oherramientas`  | ≥9,8    | Programación de restricciones (Fase 4)           |
| `antrópico`      | ≥0,40   | Cliente Claude API                               |

### 8.3 Cambios de infraestructura

| Cambiar                   | Descripción                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| Almacenamiento de modelos | Modelos serializados en Redis o sistema de archivos (por inquilino)    |
| Trabajos cron             | Agregar programas de reentrenamiento de modelos y escaneo de anomalías |
| Limitación de tasa API    | Límites de uso de Claude API por inquilino por día                     |
| Carga de archivos         | Carga de PDF e imágenes para funciones de CV (ampliar las existentes)  |

### 8.4 Cumplimiento de arrendamientos múltiples

Todas las funciones de IA **DEBEN** mantener el aislamiento de los inquilinos:

- Modelos de aprendizaje automático entrenados por inquilino con datos específicos del inquilino
- No hay fuga de datos entre inquilinos en entrenamiento o inferencia
- Las llamadas a la API de Claude incluyen el contexto del inquilino, nunca datos entre inquilinos.
- Almacenamiento de modelos codificado por ID de inquilino
- Los puntos finales API imponen el alcance de los inquilinos a través del middleware existente

---

## 9. Dependencias y riesgos

### 9.1 Riesgos técnicos

| Riesgo                                                | Probabilidad | Impacto | Mitigación                                                                                                            |
| ----------------------------------------------------- | :----------: | :-----: | --------------------------------------------------------------------------------------------------------------------- |
| Datos históricos insuficientes para los modelos ML    |    Medio     |  Alto   | Comience con enfoques basados ​​en reglas; establecer umbrales mínimos de datos para la activación del modelo         |
| La latencia de la API de Claude afecta la UX          |     Bajo     |  Medio  | Procesamiento asíncrono, transmisión de respuestas, almacenamiento en caché de respuestas                             |
| Precisión del modelo por debajo del umbral útil       |    Medio     |  Medio  | Mejora iterativa; recurrir al sistema basado en reglas cuando el aprendizaje automático tiene un rendimiento inferior |
| Complejidad del aislamiento del modelo multiinquilino |     Bajo     |  Alto   | Patrones arquitectónicos claros; pruebas automatizadas por inquilino                                                  |
| Claude API sobrecostos                                |    Medio     |  Medio  | Límites de uso por inquilino, almacenamiento en caché, optimización rápida                                            |

### 9.2 Riesgos comerciales

| Riesgo                                                 | Probabilidad | Impacto | Mitigación                                                                                                     |
| ------------------------------------------------------ | :----------: | :-----: | -------------------------------------------------------------------------------------------------------------- |
| Resistencia de los usuarios a las sugerencias de IA    |    Medio     |  Medio  | Sólo sugerencias, nunca acciones automáticas; indicadores claros de confianza                                  |
| Fatiga de falsos positivos (detección de anomalías)    |     Alto     |  Medio  | Sensibilidad ajustable, bucle de retroalimentación falso positivo                                              |
| Dependencia excesiva de la IA para decisiones críticas |     Bajo     |  Alto   | IA únicamente como asesoramiento; se requiere aprobación humana para todas las acciones                        |
| Calidad de los datos insuficiente para la formación    |    Medio     |  Alto   | Las mejoras en la calidad de los datos en la Fase 1 (características 2.2, 2.3) alimentan las fases posteriores |

### 9.3 Requisitos previos

| Requisito previo                                 | Requerido para                                      | Estado                                    |
| ------------------------------------------------ | --------------------------------------------------- | ----------------------------------------- |
| Más de 6 meses de datos de informes diarios      | Capacitación en ML (Fase 2)                         | Para verificar                            |
| Claude API y presupuesto de Claude               | Características del LLM (Fase 3)                    | Aprovisionar                              |
| Infraestructura cron existente                   | Trabajos programados                                | Disponible (`app/servicios/cron.py`)      |
| Infraestructura de almacenamiento de fotografías | Características del CV (Fase 3)                     | Disponible (`parte_diario_foto`)          |
| Patrones de servicio de análisis                 | Arquitectura de servicios de aprendizaje automático | Disponible (`app/servicios/analitica.py`) |

---

## 10. Aprobación y aprobación

### Revisión de prioridad de funciones

Por favor revise cada categoría y marque su decisión:

| Categoría                     | Características | Decisión                                     |
| ----------------------------- | :-------------: | -------------------------------------------- |
| 1. Análisis predictivo        |    1,1 – 1,7    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 2. Detección de anomalías     |    2.1 – 2.7    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 3. Optimización y O           |    3.1 – 3.6    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 4. Lenguaje Natural y LLM     |    4.1 – 4.7    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 5. Visión por computadora     |    5.1 – 5.4    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 6. Automatización inteligente |    6.1 – 6.7    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |
| 7. Inteligencia Estratégica   |    7,1 – 7,6    | [ ] Aprobado / [ ] Diferido / [ ] Modificado |

### Fase de aprobación

| Fase                      | Línea de tiempo | Decisión                      |
| ------------------------- | --------------- | ----------------------------- |
| Fase 1: Ganancias rápidas | Semanas 1-4     | [ ] Aprobado / [ ] Modificado |
| Fase 2: ML central        | Semanas 5-12    | [ ] Aprobado / [ ] Modificado |
| Fase 3: Integración LLM   | Semanas 8-14    | [ ] Aprobado / [ ] Modificado |
| Fase 4: Avanzado          | Semanas 12-24   | [ ] Aprobado / [ ] Modificado |

### Cerrar sesión

| Rol                      | Nombre | Fecha | Firma |
| ------------------------ | ------ | ----- | ----- |
| Propietario del producto |        |       |       |
| Líder Técnico            |        |       |       |
| Director/Patrocinador    |        |       |       |

---

### Notas y comentarios

_Espacio para comentarios de órdenes de compra, modificaciones de funciones, cambios de prioridad y requisitos adicionales._

---

> **Documento generado**: 2026-03-05
> **Próxima acción**: revisión del propietario del producto y selección de funciones
> **Contacto**: Equipo de ingeniería
