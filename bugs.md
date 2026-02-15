# Jira Tickets - Project BIT (CRM)

This document contains the tickets pulled from the BitCorp Jira (bitcorp-erp.atlassian.net) and a technical plan to solve each one.

---

| ID | Summary | Status | Priority |
| :--- | :--- | :--- | :--- |
| **BIT-7** | Agregar el botoncito "Guardar Cambios" | In Progress | Medium |
| **BIT-8** | Agregar un seleccionador de proyecto | To Do | High |
| **BIT-9** | Corregir formulario para guardar (Proveedores) | To Do | High |
| **BIT-10** | Corregir formulario para crear proveedores | To Do | High |
| **BIT-11** | Log de proveedores no registra cambios | To Do | Medium |
| **BIT-12** | Agregar sección "Documentos proveedor" | To Do | Medium |
| **BIT-13** | Autorrellenar datos con input RUC | To Do | Low |

---

## Detailed Tickets & Solution Plans

### [BIT-7] Agregar el botoncito "Guardar Cambios"
**Description**: URL: `http://localhost:3420/equipment/1/edit`. Al final del formulario agregar el botoncito “Guardar cambios” para todos los formularios.
**Current State**: Buttons only exist in the page header.
**Solution Plan**:
- **File**: `frontend/src/app/features/equipment/equipment-form.component.ts`
- **File**: `frontend/src/app/features/providers/provider-form.component.ts`
- **Findings**: The form action buttons (Save/Cancel) are currently located only in the page header. For long forms, this requires scrolling back to the top.
- **Change**: Add a `<div class="form-actions-footer">` at the end of the `<form>` tag in the template with "Guardar Cambios" and "Cancelar" buttons.
- **Style**: Add CSS for `.form-actions-footer` to align buttons to the right with proper spacing (sticky recommended).

### [BIT-8] Agregar un seleccionador de proyecto
**Description**: La elección solo debe permitir seleccionar un proyecto. Incluye una imagen referencial de un menú desplegable de proyectos.
**Current State**: A `ProjectSelectorComponent` exists in `MainLayoutComponent` but may be inactive or lack the required UX.
**Solution Plan**:
- **File**: `frontend/src/app/layouts/components/project-selector/project-selector.component.ts`
- **Findings**: The current implementation uses a standard HTML `<select>` element which lacks the premium "dropdown" feel requested.
- **Change**: Enhance the UI to match the "menú desplegable" (dropdown) requirement. Ensure it correctly filters the global application state via `TenantService`.
- **Logic**: Verify that `availableProjects()` are correctly fetched from the backend on login.

### [BIT-9] Corregir formulario para guardar (Proveedores)
**Description**: URL: `http://localhost:3420/providers/2`. Error en el guardado de datos del formulario de proveedores.
**Current State**: Several fields like `contact_name` and `bank_accounts` are commented out in the frontend because the backend entity doesn't support them.
**Solution Plan**:
- **File**: `backend/src/models/provider.model.ts` & `backend/src/services/provider.service.ts`
- **Findings**: 
    1. **Field Mismatch**: Frontend uses `isActive` but backend expects `is_active`. This causes status updates to fail silently.
    2. **Missing UI fields**: `nombre_comercial`, `telefono`, and `correo_electronico` are defined in the backend but commented out/missing in the frontend form template.
- **Change**: Sync the backend entity with the required frontend fields.
- **File**: `frontend/src/app/features/providers/provider-form.component.ts`
- **Change**: Add missing inputs for commercial name, phone, and email. Fix the `isActive` -> `is_active` mapping in `onSubmit()`.

### [BIT-10] Corregir formulario para crear proveedores
**Description**: URL: `http://localhost:3420/providers/new`. Problema al intentar crear un nuevo proveedor.
**Current State**: Creation fails, likely due to validation mismatches (e.g., RUC length or missing required fields).
**Solution Plan**:
- **File**: `frontend/src/app/features/providers/provider-form.component.ts`
- **Findings**: Creation fails because the payload structure sent to `ProviderService.create()` doesn't match the `ProviderCreateDto` (specifically the `is_active` field and potentially missing required fields if not handled by `FormGroup`).
- **Change**: Add better validation feedback and ensure `is_active` defaults correctly. Verify the payload sent to `ProviderService.create()`.

### [BIT-11] Log de proveedores no registra cambios
**Description**: URL: `http://localhost:3420/providers/2/log`. El registro de cambios (log) no funciona correctamente.
**Current State**: No logging mechanism found in the backend for provider changes.
**Solution Plan**:
- **Backend**: Create a `ProviderAuditLog` entity and repository.
- **Findings**: There is currently NO persistence layer for provider changes. The `ProviderService` only logs to console.
- **Backend**: Update `ProviderService.update()` to record changes in the audit table.
- **Frontend**: Create `ProviderLogComponent` and add a route in `providers.routes.ts`.
- **Frontend**: Fetch and display logs using a new method in `ProviderService`.

### [BIT-12] Agregar sección "Documentos proveedor"
**Description**: URL: `http://localhost:3420/providers/2`. Se requiere añadir una nueva sección para gestionar documentos.
**Current State**: Feature missing; commented out in some parts of the code.
**Solution Plan**:
- **Backend**: Implement file upload support for providers (similar to equipment).
- **Findings**: The `Provider` entity lacks a relationship or field for document attachments.
- **Frontend**: Add a documentation table to `ProviderFormComponent` using the same logic as `EquipmentFormComponent`.

### [BIT-13] Autorrellenar datos con solo el input RUC
**Description**: No description provided, but the summary implies fetching data from an external RUC service.
**Solution Plan**:
- **Backend**: Implement a Proxy service to a RUC API (like Sunat API).
- **Findings**: Feature requested but no infrastructure exists.
- **Frontend**: Add a search button next to the RUC field in `ProviderFormComponent` that calls this API and patches the `razon_social` and `direccion` fields.
