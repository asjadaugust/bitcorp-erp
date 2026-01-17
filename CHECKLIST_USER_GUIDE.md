# Guía de Usuario - Inspecciones de Checklist

## 📱 Para Operadores de Campo

Esta guía te ayudará a realizar inspecciones de equipos usando tu tablet o teléfono.

---

## 🚀 Inicio Rápido

### 1. Ingresa al Sistema

1. Abre el navegador en tu tablet
2. Ve a: http://[servidor]:3420
3. Ingresa con tu usuario y contraseña
4. En el menú lateral, selecciona **"Checklists"**

### 2. Crear Nueva Inspección

1. Click en **"Nueva Inspección"** (botón azul)
2. Sigue los 4 pasos

---

## 📋 Paso a Paso: Realizar una Inspección

### **PASO 1: Configuración** 🔧

**¿Qué necesitas hacer?**

- Selecciona el tipo de equipo que vas a inspeccionar
- Ingresa el número del equipo
- Ingresa tu número de trabajador

**Ejemplo**:

```
Plantilla: Inspección Diaria - Excavadora
Equipo: 101
Inspector: 25 (tu número de trabajador)
```

**¿Cómo continuar?**

- Click en **"Siguiente"** cuando llenes todos los datos

---

### **PASO 2: Datos Iniciales** 📝

**¿Qué necesitas hacer?**

- Verifica la fecha (ya viene con hoy)
- Ingresa la hora de inicio
- Escribe dónde está el equipo (ubicación)
- Anota el horómetro del equipo
- Anota el odómetro (si aplica)

**Ejemplo**:

```
Fecha: 04/01/2026 (automático)
Hora: 08:00
Ubicación: Obra San Juan - Zona A
Horómetro: 1234.5 horas
Odómetro: 45678 km
```

**¿Cómo continuar?**

- Click en **"Iniciar Inspección"** (botón verde)
- Esto crea la inspección y te lleva a los items

---

### **PASO 3: Revisar Cada Item** ✅❌

Este es el paso más importante. Aquí revisarás el equipo punto por punto.

#### **¿Qué ves en pantalla?**

- **Número del item**: "Item 1 de 18"
- **Barra de progreso**: Te muestra cuánto llevas
- **Categoría**: SEGURIDAD, MOTOR, HIDRAULICO, etc.
- **Alerta CRÍTICO**: Si ves esto en rojo, es un item muy importante
- **Descripción**: Qué tienes que revisar
- **Instrucciones**: Cómo revisar ese item

#### **¿Qué tienes que hacer?**

1. **Lee la descripción**
   - Ejemplo: "Verificar cinturón de seguridad en buen estado"

2. **Revisa físicamente el equipo**
   - Inspecciona esa parte del equipo

3. **Marca el estado** (elige una opción):
   - ✅ **Conforme**: Está bien, todo OK
   - ❌ **No Conforme**: Tiene problemas, no funciona bien
   - **N/A**: No aplica (el equipo no tiene esa parte)

4. **Agrega observaciones** (opcional pero recomendado):
   - Si está Conforme: "En perfecto estado", "Funciona bien"
   - Si No Conforme: Explica qué está mal

5. **Si marcas No Conforme**:
   - Debes elegir una **Acción Requerida**:
     - **Ninguna**: Solo observar
     - **Observar**: Revisar en próxima inspección
     - **Reparar**: Necesita reparación
     - **Reemplazar**: Necesita cambio de pieza

6. **Tomar foto** (opcional):
   - Si el item es crítico o está fallando
   - Click en "Tomar Foto"
   - _Nota: Función disponible próximamente_

#### **Navegación**:

- **⬅️ Anterior**: Volver al item anterior
- **Siguiente ➡️**: Ir al siguiente item
- **Guardar Borrador**: Guardar y continuar después

#### **⚠️ MUY IMPORTANTE - Items CRÍTICOS**

Algunos items tienen la etiqueta **"CRÍTICO"** en rojo.

**¿Qué significa?**

- Son items relacionados con seguridad
- Si fallan, el equipo NO se puede usar
- Ejemplos: cinturón de seguridad, bocina, luces, frenos

**¿Qué pasa si marco un item crítico como No Conforme?**

- El equipo será marcado como **NO OPERATIVO**
- El equipo NO debe ser usado hasta repararlo
- La inspección resultará **RECHAZADA**

**Ejemplo de items críticos**:

```
✅ CRÍTICO | Cinturón de seguridad → Conforme (OK, equipo seguro)
❌ CRÍTICO | Bocina no funciona → No Conforme (EQUIPO NO PUEDE USARSE)
✅ CRÍTICO | Luces funcionando → Conforme (OK)
```

Si la bocina no funciona, aunque todo lo demás esté bien, el equipo será marcado como no operativo.

---

### **PASO 4: Resumen y Completar** 📊

Después de revisar todos los items, verás un resumen.

#### **¿Qué ves?**

- **Estadísticas**:
  - Total de items revisados
  - Cuántos están conformes (✅)
  - Cuántos NO conformes (❌)
  - Cuántos críticos fallaron (⚠️)

- **Advertencias**:
  - Si hay items críticos fallados, verás una **ALERTA ROJA**:
    ```
    ⚠️ ADVERTENCIA: Se detectaron fallas en items críticos.
    El equipo NO debe ser utilizado hasta su reparación.
    ```

#### **¿Qué tienes que hacer?**

1. **Revisa las estadísticas**
   - Verifica que los números sean correctos

2. **Agrega observaciones generales** (opcional):
   - Comentarios adicionales sobre el equipo
   - Ejemplo: "Equipo en general en buen estado, solo requiere ajuste de bocina"

3. **Marca si requiere mantenimiento**:
   - ☐ El equipo requiere mantenimiento
   - Marca esto si hay algo que reparar

4. **Completa la inspección**:
   - Click en **"Completar Inspección"** (botón verde)
   - Confirma en el diálogo
   - El sistema automáticamente:
     - Calcula el resultado final
     - Determina si el equipo es operativo
     - Guarda todo en el sistema

---

## 🎯 Consejos Prácticos

### Para Usar la Tablet

1. **Touch grande**: Los botones son grandes para que sea fácil presionar con el dedo

2. **Una mano**: Puedes sostener la tablet con una mano y usar con la otra

3. **No necesitas lápiz**: Todo está diseñado para usar con el dedo

4. **Pantalla vertical u horizontal**: Funciona en ambas orientaciones

### Para Trabajar en Campo

1. **Guarda frecuentemente**:
   - Usa "Guardar Borrador" cada ciertos items
   - Si pierdes señal, no perderás tu trabajo

2. **Puedes continuar después**:
   - Si tienes que parar, guarda el borrador
   - Vuelve después a "Inspecciones"
   - Busca la que está "En Progreso"
   - Click en el botón ▶️ para continuar

3. **Lee las instrucciones**:
   - Cada item puede tener instrucciones específicas
   - Síguelas para hacer bien la inspección

4. **Sé honesto**:
   - Si algo está mal, márcalo
   - Es mejor reparar ahora que tener un accidente después

### Qué Hacer Si...

**Si cometiste un error en un item anterior**:

- Usa el botón "⬅️ Anterior"
- Cambia la respuesta
- El sistema guardará el cambio
- Continúa con "Siguiente ➡️"

**Si no sabes cómo revisar algo**:

- Lee las instrucciones del item
- Consulta con tu supervisor
- Usa "Guardar Borrador" y consulta después

**Si pierdes señal de internet**:

- El trabajo ya guardado está seguro
- Intenta guardar cuando tengas señal
- _Próximamente_: Modo offline que guarda en el dispositivo

**Si el equipo tiene muchas fallas**:

- Marca cada item honestamente
- No te preocupes si hay muchos "No Conforme"
- El supervisor revisará y decidirá qué hacer

---

## 📊 Después de la Inspección

### Ver el Resultado

1. Después de completar, te redirigirá a la **vista de detalle**
2. Aquí verás:
   - El resultado final: APROBADO / RECHAZADO
   - Si el equipo es operativo o no
   - Todas tus respuestas organizadas por categoría
   - Las fotos que tomaste

### Estados del Resultado

**🟢 APROBADO**:

- Todo conforme
- Equipo operativo
- Se puede usar normalmente

**🟡 APROBADO CON OBSERVACIONES**:

- Algunos items no conformes
- PERO ningún item crítico falló
- Equipo operativo con precaución
- Requiere atención pero puede usarse

**🔴 RECHAZADO**:

- Uno o más items CRÍTICOS fallaron
- **Equipo NO operativo**
- **NO usar hasta reparar**
- Supervisor recibirá notificación

### ¿Qué Pasa Después?

1. **Si APROBADO**:
   - Puedes usar el equipo
   - Continúa tu trabajo

2. **Si APROBADO CON OBSERVACIONES**:
   - Puedes usar el equipo
   - Ten cuidado con los items observados
   - Reporta a tu supervisor

3. **Si RECHAZADO**:
   - ⛔ **NO uses el equipo**
   - Reporta inmediatamente a tu supervisor
   - Se creará una orden de mantenimiento
   - El equipo va a taller

---

## ❓ Preguntas Frecuentes

### P: ¿Cuánto tiempo toma una inspección?

**R**: Depende del equipo, pero típicamente:

- Excavadora: 10-15 minutos
- Cargador: 8-12 minutos
- Volquete: 8-12 minutos

### P: ¿Puedo hacer inspecciones sin internet?

**R**: Actualmente necesitas conexión. Próximamente: modo offline.

### P: ¿Qué pasa si marco mal algo?

**R**: Si no completaste la inspección, puedes volver atrás y corregir.
Si ya completaste, contacta a tu supervisor.

### P: ¿Debo tomar fotos de todo?

**R**: No es obligatorio, pero recomendado para:

- Items críticos que fallaron
- Daños visibles
- Condiciones inusuales

### P: ¿Puedo saltarme items?

**R**: No. Debes revisar todos los items. Si algo no aplica, marca "N/A".

### P: ¿Qué hago si encuentro un problema no listado?

**R**: Agrégalo en "Observaciones Generales" al final, o contacta a tu supervisor.

### P: ¿Con qué frecuencia debo inspeccionar?

**R**: Depende del tipo de checklist:

- **DIARIO**: Antes de usar el equipo cada día
- **SEMANAL**: Una vez por semana
- **MENSUAL**: Una vez al mes
- **ANTES_USO**: Cada vez antes de usar

---

## 🆘 Ayuda y Soporte

**Si tienes problemas técnicos**:

- Contacta al departamento de IT
- Teléfono: [número]
- Email: it@bitcorp.pe

**Si tienes dudas sobre inspección**:

- Contacta a tu supervisor de equipo
- Teléfono: [número]

**Emergencias**:

- Si encuentras un problema de seguridad crítico
- Reporta inmediatamente
- No uses el equipo

---

## ✅ Checklist para Operadores

Antes de empezar tu jornada:

- [ ] Tengo mi tablet/teléfono cargado
- [ ] Tengo conexión a internet
- [ ] Tengo mi usuario y contraseña
- [ ] Sé el número de mi equipo asignado
- [ ] Tengo tiempo para hacer la inspección (10-15 min)
- [ ] Puedo acceder físicamente al equipo
- [ ] Tengo luz suficiente para revisar

Durante la inspección:

- [ ] Reviso cada item físicamente
- [ ] Marco el estado honestamente
- [ ] Agrego observaciones importantes
- [ ] Si es crítico y falla, lo marco claramente
- [ ] Guardo frecuentemente
- [ ] Completo todos los items

Después de la inspección:

- [ ] Verifico el resultado
- [ ] Si RECHAZADO, reporto a supervisor
- [ ] No uso el equipo si no es operativo
- [ ] Firmo/confirmo la inspección

---

## 📌 Recordatorios Importantes

### ⚠️ SEGURIDAD PRIMERO

- Si algo parece peligroso, márcalo
- No arriesgues tu seguridad por completar rápido
- Un equipo NO operativo significa NO USAR

### 📝 SÉ DETALLADO

- Las observaciones ayudan al mantenimiento
- Describe qué está mal específicamente
- Ejemplo: No digas "Falla", di "Bocina no suena cuando se presiona"

### ⏰ HAZLO A TIEMPO

- Inspecciones DIARIAS: Antes de usar el equipo
- No empieces a trabajar sin inspeccionar
- Es por tu seguridad y la de tus compañeros

### 💾 GUARDA TU TRABAJO

- Usa "Guardar Borrador" frecuentemente
- No confíes solo en tu conexión
- Si dudas, guarda

---

## 🎓 Video Tutoriales

_Próximamente_:

- ▶️ Cómo hacer tu primera inspección
- ▶️ Qué hacer si encuentras una falla crítica
- ▶️ Cómo tomar fotos efectivas
- ▶️ Consejos para inspecciones rápidas

---

## 📧 Feedback

¿Tienes sugerencias para mejorar las inspecciones?
Envía tus ideas a: feedback@bitcorp.pe

---

**¡Gracias por mantener nuestros equipos seguros! 🛠️**

Tu trabajo de inspección es fundamental para:

- La seguridad de todos
- Prevenir accidentes
- Mantener los equipos en buen estado
- Evitar paradas costosas

**Cada inspección cuenta. Cada detalle importa.**

---

_Última actualización: Enero 2026_
_Versión: 1.0_
_Bitcorp ERP - Sistema de Inspecciones_
