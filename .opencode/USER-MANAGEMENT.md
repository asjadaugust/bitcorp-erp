> LOCAL CACHE — Primary read source for Claude Code (zero-MCP-call fast path).
> Canonical source: https://bitcorp-erp.atlassian.net/wiki/spaces/BitCorp/pages/196820 (User Management & Roles)
> To refresh: `atlassian-docs refresh user-management`
> Last synced: 2026-03-05

# BitCorp ERP - User Management & Role Hierarchy

## Overview

BitCorp ERP implements a **5-tier role hierarchy** with clear permission boundaries. This document defines who can create users, role-based permissions, user-project assignments, and management workflows.

**Date**: January 17, 2026  
**Status**: Architectural Standard  
**Applies To**: All BitCorp ERP modules

---

## Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [Permission Matrix](#permission-matrix)
3. [User Creation Rules](#user-creation-rules)
4. [User-Project Assignment](#user-project-assignment)
5. [Authentication & Password Policy](#authentication--password-policy)
6. [User Lifecycle Management](#user-lifecycle-management)
7. [Special Roles](#special-roles)
8. [Backend Implementation](#backend-implementation)
9. [Frontend Implementation](#frontend-implementation)
10. [Security & Audit](#security--audit)

---

## Role Hierarchy

### 5-Tier Role Structure

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN_SISTEMA (Platform Administrator)                 │
│  - Manages BitCorp platform (SaaS layer)                │
│  - Creates companies and company admins                 │
│  - Access to sistema database only                      │
│  - Cannot access company business data directly         │
└─────────────────────────────────────────────────────────┘
                         │
                         ├─> Creates companies
                         │
┌─────────────────────────────────────────────────────────┐
│  ADMIN (Company Administrator)                          │
│  - Manages entire company                               │
│  - Full access to all projects and data                │
│  - Can create all roles (DIRECTOR, JEFE_EQUIPO,         │
│    OPERADOR, HR, Accounting, etc.)                      │
│  - Company-wide reporting and configuration             │
└─────────────────────────────────────────────────────────┘
                         │
                         ├─> Creates directors and staff
                         │
┌─────────────────────────────────────────────────────────┐
│  DIRECTOR (Project Director)                            │
│  - Oversees one or multiple projects                    │
│  - Approves contracts, valuations, major decisions      │
│  - Can create JEFE_EQUIPO and OPERADOR for their       │
│    projects (with ADMIN approval)                       │
│  - Cross-project visibility within their portfolio      │
└─────────────────────────────────────────────────────────┘
                         │
                         ├─> Manages team leads
                         │
┌─────────────────────────────────────────────────────────┐
│  JEFE_EQUIPO (Team Lead / Supervisor)                   │
│  - Manages daily operations for specific projects       │
│  - Approves daily reports (partes diarios)              │
│  - Assigns equipment and operators                      │
│  - Can create OPERADOR for their team (limited)         │
│  - Project-specific reporting                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ├─> Supervises operators
                         │
┌─────────────────────────────────────────────────────────┐
│  OPERADOR (Field Operator)                              │
│  - Field workers (equipment operators, drivers)         │
│  - Submits daily reports (partes diarios)               │
│  - Updates equipment status, hours, fuel                │
│  - Read-only access to their assigned equipment         │
│  - No user creation permissions                         │
└─────────────────────────────────────────────────────────┘
```

### Role Comparison Table

| Role              | Scope            | Can Create Users?       | Access Level          | Projects            |
| ----------------- | ---------------- | ----------------------- | --------------------- | ------------------- |
| **ADMIN_SISTEMA** | Platform-wide    | Yes (companies + ADMIN) | Sistema DB only       | N/A                 |
| **ADMIN**         | Company-wide     | Yes (all roles)         | Full company access   | All projects        |
| **DIRECTOR**      | Multi-project    | Limited (with approval) | Project portfolio     | Assigned projects   |
| **JEFE_EQUIPO**   | Project-specific | Limited (OPERADOR only) | Single project + team | Single project      |
| **OPERADOR**      | Task-specific    | No                      | Own tasks only        | Assigned to project |

---

## Permission Matrix

### Module-Level Permissions

| Module                          | ADMIN                          | DIRECTOR                   | JEFE_EQUIPO                  | OPERADOR                     |
| ------------------------------- | ------------------------------ | -------------------------- | ---------------------------- | ---------------------------- |
| **Usuarios** (Users)            | Create, Edit, Delete, View All | View Assigned Projects     | View Team Only               | View Self Only               |
| **Proyectos** (Projects)        | Create, Edit, Delete, View All | View Assigned, Edit Own    | View Assigned                | View Assigned                |
| **Equipos** (Equipment)         | Full Access                    | Approve Requests, View All | Request, Assign, View        | View Assigned, Update Status |
| **Contratos** (Contracts)       | Full Access                    | Create, Approve, View All  | View Project Contracts       | View Assigned Equipment      |
| **Valorizaciones** (Valuations) | Full Access                    | Approve, View All          | Create Partial, View Project | View Own Reports             |
| **Proveedores** (Suppliers)     | Create, Edit, Delete, View All | View All                   | View Project Suppliers       | View Assigned                |
| **Reportes** (Reports)          | All Reports                    | Project Reports            | Team Reports                 | Personal Reports             |
| **Configuración** (Settings)    | Full System Config             | Project Config             | Limited Config               | No Access                    |

### Action-Level Permissions

**Equipment Management**:

```typescript
const EQUIPMENT_PERMISSIONS = {
  ADMIN: ['create', 'edit', 'delete', 'view_all', 'assign', 'transfer', 'retire'],
  DIRECTOR: ['approve_request', 'view_all', 'assign_to_project'],
  JEFE_EQUIPO: ['request', 'assign_operator', 'view_project', 'update_status'],
  OPERADOR: ['view_assigned', 'update_hours', 'update_fuel', 'submit_report'],
};
```

**Contract Management**:

```typescript
const CONTRACT_PERMISSIONS = {
  ADMIN: ['create', 'edit', 'delete', 'approve', 'sign', 'view_all', 'cancel'],
  DIRECTOR: ['create', 'approve', 'view_all', 'request_changes'],
  JEFE_EQUIPO: ['view_project', 'submit_for_approval'],
  OPERADOR: ['view_assigned'],
};
```

**User Management**:

```typescript
const USER_PERMISSIONS = {
  ADMIN_SISTEMA: ['create_company', 'create_admin', 'suspend_company', 'view_all_companies'],
  ADMIN: [
    'create_user',
    'edit_user',
    'delete_user',
    'view_all_users',
    'assign_roles',
    'assign_projects',
  ],
  DIRECTOR: ['view_project_users', 'request_new_user'],
  JEFE_EQUIPO: ['view_team', 'request_operator'],
  OPERADOR: ['view_self', 'edit_own_profile'],
};
```

---

## User Creation Rules

### Who Can Create Whom?

```
ADMIN_SISTEMA
  └─> Can create:
      ├─ Companies (in sistema.empresas)
      └─ Company ADMIN (first user in new company DB)

ADMIN (Company Administrator)
  └─> Can create:
      ├─ DIRECTOR (project directors)
      ├─ JEFE_EQUIPO (team leads)
      ├─ OPERADOR (field workers)
      ├─ HR (human resources staff)
      ├─ CONTABILIDAD (accounting staff)
      ├─ ALMACEN (warehouse staff)
      └─ Any custom company role

DIRECTOR (Project Director)
  └─> Can request (ADMIN approves):
      ├─ JEFE_EQUIPO (for their projects)
      └─ OPERADOR (for their projects)

JEFE_EQUIPO (Team Lead)
  └─> Can request (DIRECTOR approves):
      └─ OPERADOR (for their team only)

OPERADOR
  └─> Cannot create users
```

### User Creation Workflow

#### Scenario 1: ADMIN Creates User (Direct Creation)

```
1. ADMIN navigates to "Gestión de Usuarios"
   └─> Click "Crear Nuevo Usuario"

2. ADMIN fills user form
   ├─ Personal Info: nombre_completo, email, telefono
   ├─ Login Info: username, password_temporal
   ├─ Role: Select from [DIRECTOR, JEFE_EQUIPO, OPERADOR, HR, etc.]
   └─ Project Assignment: Select projects (optional)

3. System validates
   ├─ Username unique in company
   ├─ Email unique in company
   └─ Role is valid

4. System creates user
   ├─ INSERT INTO usuarios (username, email, password_hash, rol, ...)
   ├─ Hash password with bcrypt (salt rounds = 10)
   └─ Set activo = true, requiere_cambio_password = true

5. System assigns to projects (if selected)
   └─> INSERT INTO usuarios_proyectos (id_usuario, id_proyecto, ...)

6. System sends welcome email
   ├─ Login URL
   ├─ Username
   ├─ Temporary password
   └─> Instruct to change password on first login

7. Audit log
   └─> Record user creation event
```

#### Scenario 2: DIRECTOR Requests User (Approval Required)

```
1. DIRECTOR navigates to "Mi Equipo"
   └─> Click "Solicitar Nuevo Usuario"

2. DIRECTOR fills request form
   ├─ Personal Info: nombre_completo, email
   ├─ Requested Role: JEFE_EQUIPO or OPERADOR
   ├─ Project: Select from assigned projects
   ├─ Justification: Text field (required)
   └─> Start Date: fecha_inicio

3. System creates request
   └─> INSERT INTO solicitudes_usuario (id_solicitante, rol_solicitado, estado='PENDIENTE', ...)

4. System notifies ADMIN
   └─> Email + in-app notification

5. ADMIN reviews request
   ├─> Option 1: Approve → Create user (same as Scenario 1)
   ├─> Option 2: Reject → Record reason, notify DIRECTOR
   └─> Option 3: Request changes → Ask for more info

6. If approved, user created
   └─> Follow steps 4-7 from Scenario 1

7. Notify DIRECTOR
   └─> "Your request for [nombre] has been approved"
```

### User Creation Validation Rules

```typescript
// backend/src/services/usuarios.service.ts

async crearUsuario(data: CrearUsuarioDTO, creadorRol: string) {
  // 1. Validate creator permissions
  if (creadorRol === 'OPERADOR') {
    throw new ForbiddenException('OPERADOR no puede crear usuarios');
  }

  if (creadorRol === 'JEFE_EQUIPO' && data.rol !== 'OPERADOR') {
    throw new ForbiddenException('JEFE_EQUIPO solo puede solicitar OPERADOR');
  }

  if (creadorRol === 'DIRECTOR' && !['JEFE_EQUIPO', 'OPERADOR'].includes(data.rol)) {
    throw new ForbiddenException('DIRECTOR solo puede solicitar JEFE_EQUIPO o OPERADOR');
  }

  // 2. Validate username uniqueness
  const existeUsername = await this.dataSource.query(
    'SELECT id_usuario FROM usuarios WHERE username = $1',
    [data.username]
  );
  if (existeUsername.length > 0) {
    throw new ConflictException('Username ya existe');
  }

  // 3. Validate email uniqueness
  const existeEmail = await this.dataSource.query(
    'SELECT id_usuario FROM usuarios WHERE email = $1',
    [data.email]
  );
  if (existeEmail.length > 0) {
    throw new ConflictException('Email ya existe');
  }

  // 4. Hash password
  const passwordHash = await bcrypt.hash(data.password_temporal, 10);

  // 5. Create user
  const result = await this.dataSource.query(
    `INSERT INTO usuarios
      (username, email, password_hash, nombre_completo, rol, activo, requiere_cambio_password)
     VALUES ($1, $2, $3, $4, $5, true, true)
     RETURNING id_usuario`,
    [data.username, data.email, passwordHash, data.nombre_completo, data.rol]
  );

  const idUsuario = result[0].id_usuario;

  // 6. Assign to projects
  if (data.proyectos && data.proyectos.length > 0) {
    for (const idProyecto of data.proyectos) {
      await this.dataSource.query(
        `INSERT INTO usuarios_proyectos (id_usuario, id_proyecto)
         VALUES ($1, $2)`,
        [idUsuario, idProyecto]
      );
    }
  }

  // 7. Send welcome email
  await this.emailService.enviarBienvenida({
    email: data.email,
    nombre: data.nombre_completo,
    username: data.username,
    password_temporal: data.password_temporal,
  });

  // 8. Audit log
  await this.auditService.registrar({
    accion: 'CREAR_USUARIO',
    id_usuario: idUsuario,
    detalles: { rol: data.rol, creado_por: creadorRol },
  });

  return { id_usuario: idUsuario };
}
```

---

## User-Project Assignment

### Assignment Patterns

**Pattern 1: Direct Assignment (by ADMIN)**

```sql
-- ADMIN assigns user to projects
INSERT INTO usuarios_proyectos (id_usuario, id_proyecto, rol_proyecto, fecha_asignacion)
VALUES (123, 5, 'JEFE_EQUIPO', NOW());
```

**Pattern 2: Inherited Assignment (by Project Hierarchy)**

```sql
-- When user assigned to parent project, auto-assign to child projects
WITH proyecto_jerarquia AS (
  SELECT id_proyecto FROM proyectos
  WHERE id_proyecto_padre = 5  -- Parent project
)
INSERT INTO usuarios_proyectos (id_usuario, id_proyecto, fecha_asignacion)
SELECT 123, id_proyecto, NOW() FROM proyecto_jerarquia;
```

**Pattern 3: Temporary Assignment (Equipment Operation)**

```sql
-- Temporarily assign OPERADOR to project for specific equipment
INSERT INTO usuarios_proyectos (id_usuario, id_proyecto, fecha_inicio, fecha_fin, temporal)
VALUES (456, 8, '2026-01-20', '2026-03-31', TRUE);
```

### usuarios_proyectos Table Schema

```sql
CREATE TABLE usuarios_proyectos (
  id_usuario_proyecto SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_proyecto INTEGER NOT NULL REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,

  -- Assignment details
  rol_proyecto VARCHAR(50),              -- Role specific to this project (optional)
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  fecha_inicio DATE,                     -- Assignment start date
  fecha_fin DATE,                        -- Assignment end date (NULL = indefinite)
  temporal BOOLEAN DEFAULT FALSE,        -- Temporary assignment flag

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  asignado_por INTEGER REFERENCES usuarios(id_usuario),

  -- Metadata
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(id_usuario, id_proyecto)
);

CREATE INDEX idx_usuarios_proyectos_usuario ON usuarios_proyectos(id_usuario);
CREATE INDEX idx_usuarios_proyectos_proyecto ON usuarios_proyectos(id_proyecto);
CREATE INDEX idx_usuarios_proyectos_activo ON usuarios_proyectos(activo);
```

### Project Access Control

**Query: Get User's Accessible Projects**

```sql
-- Get all projects user can access
SELECT p.id_proyecto, p.nombre_proyecto, p.codigo_proyecto,
       up.rol_proyecto, up.fecha_inicio, up.fecha_fin
FROM proyectos p
INNER JOIN usuarios_proyectos up ON p.id_proyecto = up.id_proyecto
WHERE up.id_usuario = $1
  AND up.activo = TRUE
  AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE);
```

**Query: Check if User Has Access to Project**

```sql
-- Verify user access (middleware)
SELECT EXISTS(
  SELECT 1 FROM usuarios_proyectos
  WHERE id_usuario = $1
    AND id_proyecto = $2
    AND activo = TRUE
    AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
) AS tiene_acceso;
```

---

## Authentication & Password Policy

### Password Requirements

| Policy                    | Value                                       |
| ------------------------- | ------------------------------------------- | -------- |
| **Minimum Length**        | 8 characters                                |
| **Required Characters**   | At least 1 uppercase, 1 lowercase, 1 number |
| **Allowed Special Chars** | `!@#$%^&\*()\_+-=[]{}                       | ;:,.<>?` |
| **Password History**      | Cannot reuse last 3 passwords               |
| **Expiration**            | 90 days (configurable per company)          |
| **Lockout Threshold**     | 5 failed attempts                           |
| **Lockout Duration**      | 15 minutes                                  |

### Password Validation

```typescript
// backend/src/utils/password-validator.ts

export function validarPassword(password: string): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  if (password.length < 8) {
    errores.push('Password debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errores.push('Password debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errores.push('Password debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errores.push('Password debe contener al menos un número');
  }

  // Optional: Check against common passwords list
  const commonPasswords = ['Password123', '12345678', 'Qwerty123'];
  if (commonPasswords.includes(password)) {
    errores.push('Password demasiado común, elige uno más seguro');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
```

### First Login Flow

```
1. User receives welcome email with username + temporary password
2. User navigates to login page → Enters credentials
3. Backend checks usuarios.requiere_cambio_password = TRUE
4. Backend returns: { success: true, requiere_cambio_password: true }
5. Frontend redirects to "Cambiar Password" page
6. User enters:
   ├─ Current password (temporary)
   ├─ New password
   └─ Confirm new password
7. Backend validates new password (8 chars, uppercase, lowercase, number)
8. Backend updates:
   ├─ UPDATE usuarios SET password_hash = $1, requiere_cambio_password = FALSE
   └─ INSERT INTO password_history (id_usuario, password_hash, created_at)
9. User redirected to dashboard
```

### Password Reset Flow

```
1. User clicks "Olvidé mi contraseña"
2. User enters email
3. Backend generates reset token
   └─> token = crypto.randomBytes(32).toString('hex')
   └─> INSERT INTO password_reset_tokens (id_usuario, token_hash, expira_en)
4. Backend sends email with reset link
   └─> https://app.bitcorp.com/reset-password?token=ABC123
5. User clicks link (valid for 1 hour)
6. User enters new password
7. Backend validates token not expired
8. Backend updates password
   └─> UPDATE usuarios SET password_hash = $1
9. Backend invalidates token
   └─> DELETE FROM password_reset_tokens WHERE token_hash = $1
```

---

## User Lifecycle Management

### User States

```
ACTIVO → User active, can log in
SUSPENDIDO → User suspended, cannot log in (temporary)
INACTIVO → User inactive (left company, on leave)
ELIMINADO → User deleted (soft delete, data retained for audit)
```

### State Transitions

```typescript
// backend/src/services/usuarios.service.ts

async suspenderUsuario(idUsuario: number, razon: string) {
  // 1. Update user status
  await this.dataSource.query(
    `UPDATE usuarios
     SET activo = FALSE, estado = 'SUSPENDIDO', fecha_suspension = NOW()
     WHERE id_usuario = $1`,
    [idUsuario]
  );

  // 2. Invalidate all active sessions
  await this.dataSource.query(
    `DELETE FROM sesiones WHERE id_usuario = $1`,
    [idUsuario]
  );

  // 3. Audit log
  await this.auditService.registrar({
    accion: 'SUSPENDER_USUARIO',
    id_usuario: idUsuario,
    detalles: { razon },
  });
}

async reactivarUsuario(idUsuario: number) {
  await this.dataSource.query(
    `UPDATE usuarios
     SET activo = TRUE, estado = 'ACTIVO', fecha_suspension = NULL
     WHERE id_usuario = $1`,
    [idUsuario]
  );

  await this.auditService.registrar({
    accion: 'REACTIVAR_USUARIO',
    id_usuario: idUsuario,
  });
}

async eliminarUsuario(idUsuario: number) {
  // Soft delete: Keep data for audit trail
  await this.dataSource.query(
    `UPDATE usuarios
     SET activo = FALSE, estado = 'ELIMINADO', fecha_eliminacion = NOW()
     WHERE id_usuario = $1`,
    [idUsuario]
  );

  // Invalidate sessions
  await this.dataSource.query(
    `DELETE FROM sesiones WHERE id_usuario = $1`,
    [idUsuario]
  );

  await this.auditService.registrar({
    accion: 'ELIMINAR_USUARIO',
    id_usuario: idUsuario,
  });
}
```

---

## Special Roles

### HR (Human Resources)

**Purpose**: Manage personnel records and user lifecycle

**Permissions**:

- ✅ Create OPERADOR users
- ✅ Edit user personal information (phone, address, emergency contact)
- ✅ Manage user documents (licenses, certifications, medical exams)
- ✅ Access HR reports (attendance, training, certifications)
- ❌ Cannot create ADMIN, DIRECTOR, JEFE_EQUIPO
- ❌ Cannot modify user roles
- ❌ Cannot access financial data (contracts, valuations)

**Database Flag**:

```sql
-- usuarios table
ALTER TABLE usuarios ADD COLUMN es_hr BOOLEAN DEFAULT FALSE;
```

### CONTABILIDAD (Accounting)

**Purpose**: Financial operations and reporting

**Permissions**:

- ✅ View all contracts and valuations
- ✅ Approve valuations for payment
- ✅ Export financial reports
- ✅ Manage supplier invoices and payment records
- ❌ Cannot create or modify equipment
- ❌ Cannot create users
- ❌ Cannot assign projects

### ALMACEN (Warehouse Manager)

**Purpose**: Equipment inventory and maintenance tracking

**Permissions**:

- ✅ Manage equipment inventory (own fleet - equipos propios)
- ✅ Record maintenance activities
- ✅ Track spare parts and consumables
- ✅ Update equipment availability
- ❌ Cannot approve contracts
- ❌ Cannot create valuations

---

## Backend Implementation

### usuarios Table Schema

```sql
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,

  -- Login credentials
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Personal info
  nombre_completo VARCHAR(200) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  documento_identidad VARCHAR(20),  -- DNI, Passport

  -- Role & status
  rol VARCHAR(50) NOT NULL,  -- ADMIN, DIRECTOR, JEFE_EQUIPO, OPERADOR
  activo BOOLEAN DEFAULT TRUE,
  estado VARCHAR(20) DEFAULT 'ACTIVO',  -- ACTIVO | SUSPENDIDO | INACTIVO | ELIMINADO

  -- Special role flags
  es_hr BOOLEAN DEFAULT FALSE,
  es_contabilidad BOOLEAN DEFAULT FALSE,
  es_almacen BOOLEAN DEFAULT FALSE,

  -- Security
  requiere_cambio_password BOOLEAN DEFAULT TRUE,
  password_expira_en DATE,
  intentos_fallidos INTEGER DEFAULT 0,
  bloqueado_hasta TIMESTAMP,

  -- Audit fields
  fecha_suspension TIMESTAMP,
  fecha_eliminacion TIMESTAMP,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  config_json JSONB  -- User preferences, UI settings, etc.
);

CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
```

### User Service Example

```typescript
// backend/src/services/usuarios.service.ts

@Injectable({ scope: Scope.REQUEST })
export class UsuariosService {
  constructor(@Inject(REQUEST) private request: Request) {}

  async listarUsuarios(filtros: {
    rol?: string;
    activo?: boolean;
    id_proyecto?: number;
    page?: number;
    limit?: number;
  }) {
    const { dataSource } = this.request.tenantContext;
    const { rol, activo, id_proyecto, page = 1, limit = 10 } = filtros;

    let query = `
      SELECT u.id_usuario, u.username, u.email, u.nombre_completo, u.rol, 
             u.activo, u.ultimo_acceso,
             ARRAY_AGG(DISTINCT p.nombre_proyecto) as proyectos
      FROM usuarios u
      LEFT JOIN usuarios_proyectos up ON u.id_usuario = up.id_usuario AND up.activo = TRUE
      LEFT JOIN proyectos p ON up.id_proyecto = p.id_proyecto
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (rol) {
      query += ` AND u.rol = $${paramIndex}`;
      params.push(rol);
      paramIndex++;
    }

    if (activo !== undefined) {
      query += ` AND u.activo = $${paramIndex}`;
      params.push(activo);
      paramIndex++;
    }

    if (id_proyecto) {
      query += ` AND up.id_proyecto = $${paramIndex}`;
      params.push(id_proyecto);
      paramIndex++;
    }

    query += `
      GROUP BY u.id_usuario
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const usuarios = await dataSource.query(query, params);

    // Transform to DTO (snake_case)
    return usuarios.map((u) => ({
      id_usuario: u.id_usuario,
      username: u.username,
      email: u.email,
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      activo: u.activo,
      ultimo_acceso: u.ultimo_acceso,
      proyectos: u.proyectos || [],
    }));
  }
}
```

---

## Frontend Implementation

### User List Component

```typescript
// frontend/src/app/modules/usuarios/components/usuario-list.component.ts

export class UsuarioListComponent implements OnInit {
  usuarios: Usuario[] = [];
  filtroRol: string = '';
  filtroActivo: boolean = true;

  // Current user permissions
  canCreateUser: boolean = false;
  canEditUser: boolean = false;

  constructor(
    private usuariosService: UsuariosService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPermissions();
    this.loadUsuarios();
  }

  loadPermissions() {
    const currentUser = this.authService.getCurrentUser();
    this.canCreateUser = ['ADMIN', 'DIRECTOR'].includes(currentUser.rol);
    this.canEditUser = ['ADMIN'].includes(currentUser.rol);
  }

  loadUsuarios() {
    this.usuariosService
      .listarUsuarios({
        rol: this.filtroRol || undefined,
        activo: this.filtroActivo,
      })
      .subscribe((response) => {
        this.usuarios = response.data;
      });
  }
}
```

### User Creation Form

```typescript
// frontend/src/app/modules/usuarios/components/usuario-create.component.ts

export class UsuarioCreateComponent {
  usuarioForm: FormGroup;
  availableRoles: string[] = [];
  availableProjects: Project[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService
  ) {
    this.initForm();
    this.loadAvailableRoles();
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      nombre_completo: ['', Validators.required],
      rol: ['', Validators.required],
      password_temporal: ['', [Validators.required, Validators.minLength(8)]],
      proyectos: [[]],
    });
  }

  loadAvailableRoles() {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser.rol === 'ADMIN') {
      this.availableRoles = [
        'DIRECTOR',
        'JEFE_EQUIPO',
        'OPERADOR',
        'HR',
        'CONTABILIDAD',
        'ALMACEN',
      ];
    } else if (currentUser.rol === 'DIRECTOR') {
      this.availableRoles = ['JEFE_EQUIPO', 'OPERADOR'];
    } else if (currentUser.rol === 'JEFE_EQUIPO') {
      this.availableRoles = ['OPERADOR'];
    }
  }

  onSubmit() {
    if (this.usuarioForm.invalid) return;

    this.usuariosService.crearUsuario(this.usuarioForm.value).subscribe({
      next: (response) => {
        this.notificationService.success('Usuario creado exitosamente');
        this.router.navigate(['/usuarios']);
      },
      error: (error) => {
        this.notificationService.error(error.error.error.message);
      },
    });
  }
}
```

---

## Security & Audit

### Audit Log Schema

```sql
CREATE TABLE audit_log_usuarios (
  id_log SERIAL PRIMARY KEY,
  accion VARCHAR(100) NOT NULL,  -- CREAR_USUARIO, EDITAR_USUARIO, SUSPENDER_USUARIO, etc.
  id_usuario_afectado INTEGER REFERENCES usuarios(id_usuario),
  id_usuario_ejecutor INTEGER REFERENCES usuarios(id_usuario),

  -- Details
  detalles JSONB,  -- { rol_anterior: 'OPERADOR', rol_nuevo: 'JEFE_EQUIPO', ... }
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_usuarios_accion ON audit_log_usuarios(accion);
CREATE INDEX idx_audit_log_usuarios_fecha ON audit_log_usuarios(created_at);
CREATE INDEX idx_audit_log_usuarios_afectado ON audit_log_usuarios(id_usuario_afectado);
```

### Audit Events

| Event                 | Trigger          | Logged Data                            |
| --------------------- | ---------------- | -------------------------------------- |
| **CREAR_USUARIO**     | User created     | username, rol, created_by, proyectos   |
| **EDITAR_USUARIO**    | User updated     | changed_fields, old_values, new_values |
| **SUSPENDER_USUARIO** | User suspended   | razon, suspended_by                    |
| **REACTIVAR_USUARIO** | User reactivated | reactivated_by                         |
| **ELIMINAR_USUARIO**  | User deleted     | deleted_by, razon                      |
| **CAMBIAR_ROL**       | Role changed     | rol_anterior, rol_nuevo, changed_by    |
| **ASIGNAR_PROYECTO**  | Project assigned | id_proyecto, assigned_by               |
| **REMOVER_PROYECTO**  | Project removed  | id_proyecto, removed_by                |
| **CAMBIAR_PASSWORD**  | Password changed | changed_by (self or admin)             |
| **RESETEAR_PASSWORD** | Password reset   | reset_by, via (email or admin)         |

---

## Best Practices

### DO ✅

1. **Always validate role permissions** before allowing user creation
2. **Hash passwords with bcrypt** (salt rounds = 10 minimum)
3. **Send welcome emails** with temporary passwords
4. **Enforce password change** on first login
5. **Log all user management operations** to audit trail
6. **Soft delete users** (keep for audit, don't hard delete)
7. **Use request-scoped services** for multi-tenant context
8. **Validate email uniqueness** per company database
9. **Implement account lockout** after 5 failed login attempts
10. **Review user access quarterly** (remove inactive users)

### DON'T ❌

1. **Don't allow OPERADOR** to create users
2. **Don't expose password hashes** in API responses
3. **Don't share user sessions** across companies
4. **Don't skip password validation** (8 chars, uppercase, lowercase, number)
5. **Don't allow duplicate usernames** in company database
6. **Don't hard delete users** (breaks audit trail)
7. **Don't store passwords** in plain text anywhere
8. **Don't allow users to access** other companies' data
9. **Don't skip email verification** for new users (future enhancement)
10. **Don't forget to invalidate sessions** when user suspended

---

## Related Documentation

- [MULTITENANCY.md](./MULTITENANCY.md) - Multi-tenant architecture and database isolation
- [API-PATTERNS.md](./API-PATTERNS.md) - Backend patterns for user management
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Core architectural principles
- [.opencode/skill/bitcorp-prd-analyzer/SKILL.md](./.opencode/skill/bitcorp-prd-analyzer/SKILL.md) - Business domain knowledge (roles from PRD)

---

## Version History

- **v1.0.0** (2026-01-17): Initial user management documentation
  - 5-tier role hierarchy (ADMIN_SISTEMA → ADMIN → DIRECTOR → JEFE_EQUIPO → OPERADOR)
  - Permission matrix for all modules
  - User creation rules and workflows
  - User-project assignment patterns
  - Authentication and password policy
  - Special roles (HR, CONTABILIDAD, ALMACEN)
  - Security and audit logging

---

**Clear role boundaries prevent security issues and ensure smooth operations.**
