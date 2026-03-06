> LOCAL CACHE — Primary read source for Claude Code (zero-MCP-call fast path).
> Canonical source: https://bitcorp-erp.atlassian.net/wiki/spaces/BitCorp/pages/164198 (API Patterns & Standards)
> To refresh: `atlassian-docs refresh api-patterns`
> Last synced: 2026-03-05

# BitCorp ERP - API Development Patterns

## Overview

This document defines **mandatory patterns and standards** for BitCorp ERP backend API development. All controllers, services, and DTOs must follow these patterns to ensure consistency, predictability, and maintainability.

**Date**: January 17, 2026  
**Status**: Architectural Standard  
**Applies To**: All backend modules (NestJS/Express + TypeORM)

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [API Response Contract](#api-response-contract)
3. [Field Naming Standards](#field-naming-standards)
4. [Controller Patterns](#controller-patterns)
5. [Service Layer Patterns](#service-layer-patterns)
6. [DTO Transformation](#dto-transformation)
7. [Tenant-Aware Queries](#tenant-aware-queries)
8. [Error Handling](#error-handling)
9. [Pagination](#pagination)
10. [Validation](#validation)
11. [Testing Patterns](#testing-patterns)

---

## Core Principles

### From ARCHITECTURE.md

1. **Explicit Over Implicit**: Transform data explicitly, wrap responses explicitly
2. **Consistency Beats Cleverness**: Prefer repeating a known pattern over inventing a new one
3. **Controllers**: Parse input, call services, apply DTOs, return standardized responses
4. **Services**: Contain business logic, query database, optionally transform to DTOs
5. **DTOs**: Never return raw entities, always use DTOs with snake_case fields

### Key Rules

| Rule                  | Enforcement                                                      |
| --------------------- | ---------------------------------------------------------------- |
| **No Raw Entities**   | ❌ `return entity` → ✅ `return toDTO(entity)`                   |
| **Standard Response** | ✅ Always `{ success, data, pagination/error }`                  |
| **snake_case API**    | ✅ All API responses use snake_case fields                       |
| **Spanish Database**  | ✅ All table/column names in Spanish                             |
| **Tenant Context**    | ✅ Every request must have tenant context (except public routes) |
| **Explicit DTOs**     | ✅ One DTO per response type (list, detail, create, update)      |

---

## API Response Contract

### Standard Response Formats

All API endpoints MUST return one of these formats:

#### 1. List Response (Paginated)

```typescript
interface ListResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

**Example**:

```json
{
  "success": true,
  "data": [
    {
      "id_equipo": 123,
      "codigo_equipo": "EXC-001",
      "tipo_equipo": "EXCAVADORA",
      "marca": "Caterpillar",
      "modelo": "320D",
      "estado": "DISPONIBLE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

#### 2. Single Entity Response

```typescript
interface SingleResponse<T> {
  success: true;
  data: T;
}
```

**Example**:

```json
{
  "success": true,
  "data": {
    "id_equipo": 123,
    "codigo_equipo": "EXC-001",
    "tipo_equipo": "EXCAVADORA",
    "marca": "Caterpillar",
    "modelo": "320D",
    "placa_serie": "ABC-123",
    "estado": "DISPONIBLE",
    "proveedor": {
      "id_proveedor": 5,
      "razon_social": "Maquinarias del Sur SAC"
    }
  }
}
```

#### 3. Create/Update Response

```typescript
interface CreateResponse {
  success: true;
  data: {
    id: number;
    message?: string;
  };
}
```

**Example**:

```json
{
  "success": true,
  "data": {
    "id": 456,
    "message": "Equipo creado exitosamente"
  }
}
```

#### 4. Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Example**:

```json
{
  "success": false,
  "error": {
    "code": "EQUIPO_NOT_FOUND",
    "message": "Equipo no encontrado",
    "details": {
      "id_equipo": 999
    }
  }
}
```

### Response Helper Functions

```typescript
// backend/src/utils/response-helper.ts

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

export function sendCreated(res: Response, id: number, message?: string) {
  return res.status(201).json({
    success: true,
    data: { id, message },
  });
}
```

---

## Field Naming Standards

### Database → API Transformation

| Source                    | Target              | Example                        |
| ------------------------- | ------------------- | ------------------------------ |
| **Database (Spanish)**    | Spanish, snake_case | `fechaInicio` → `fecha_inicio` |
| **Entity (TypeORM)**      | Spanish, camelCase  | `fechaInicio`                  |
| **DTO (API Response)**    | Spanish, snake_case | `fecha_inicio`                 |
| **Frontend (TypeScript)** | Spanish, snake_case | `fecha_inicio`                 |

### Transformation Rules

```typescript
// ❌ WRONG: Return raw entity (camelCase)
return entity; // { fechaInicio: "2026-01-01", nombreProyecto: "..." }

// ✅ CORRECT: Transform to DTO (snake_case)
return toDTO(entity); // { fecha_inicio: "2026-01-01", nombre_proyecto: "..." }
```

### Field Naming Examples

| Entity Field (camelCase) | DTO Field (snake_case) |
| ------------------------ | ---------------------- |
| `idEquipo`               | `id_equipo`            |
| `codigoEquipo`           | `codigo_equipo`        |
| `tipoEquipo`             | `tipo_equipo`          |
| `fechaInicio`            | `fecha_inicio`         |
| `razonSocial`            | `razon_social`         |
| `precioUnitario`         | `precio_unitario`      |
| `horasTrabajadas`        | `horas_trabajadas`     |

---

## Controller Patterns

### Standard Controller Structure

```typescript
// backend/src/controllers/equipos.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { EquiposService } from '../services/equipos.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendError,
  sendCreated,
} from '../utils/response-helper';
import { EquipoCreateDTO, EquipoUpdateDTO, EquipoQueryDTO } from '../types/dto/equipos.dto';

@Controller('api/equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  /**
   * GET /api/equipos
   * List all equipment (paginated)
   */
  @Get()
  async listarEquipos(@Query() query: EquipoQueryDTO, @Req() req: Request, @Res() res: Response) {
    try {
      const { page = 1, limit = 10, tipo_equipo, estado } = query;

      // Service returns { data, total }
      const result = await this.equiposService.listarEquipos({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        tipo_equipo,
        estado,
      });

      return sendPaginatedSuccess(res, result.data, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
      });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_ERROR', error.message);
    }
  }

  /**
   * GET /api/equipos/:id
   * Get single equipment by ID
   */
  @Get(':id')
  async obtenerEquipo(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const equipo = await this.equiposService.obtenerEquipoPorId(parseInt(id));

      if (!equipo) {
        return sendError(res, 404, 'EQUIPO_NOT_FOUND', 'Equipo no encontrado', { id });
      }

      return sendSuccess(res, equipo);
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_ERROR', error.message);
    }
  }

  /**
   * POST /api/equipos
   * Create new equipment
   */
  @Post()
  async crearEquipo(@Body() body: EquipoCreateDTO, @Req() req: Request, @Res() res: Response) {
    try {
      // Validate user permissions (controller responsibility)
      const currentUser = req.user;
      if (!['ADMIN', 'ALMACEN'].includes(currentUser.rol)) {
        return sendError(res, 403, 'FORBIDDEN', 'No tienes permisos para crear equipos');
      }

      const result = await this.equiposService.crearEquipo(body);

      return sendCreated(res, result.id_equipo, 'Equipo creado exitosamente');
    } catch (error) {
      if (error.code === 'DUPLICATE_CODIGO') {
        return sendError(res, 409, 'DUPLICATE_CODIGO', 'Código de equipo ya existe');
      }
      return sendError(res, 500, 'INTERNAL_ERROR', error.message);
    }
  }

  /**
   * PUT /api/equipos/:id
   * Update equipment
   */
  @Put(':id')
  async actualizarEquipo(
    @Param('id') id: string,
    @Body() body: EquipoUpdateDTO,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const currentUser = req.user;
      if (!['ADMIN', 'ALMACEN'].includes(currentUser.rol)) {
        return sendError(res, 403, 'FORBIDDEN', 'No tienes permisos para editar equipos');
      }

      const updated = await this.equiposService.actualizarEquipo(parseInt(id), body);

      if (!updated) {
        return sendError(res, 404, 'EQUIPO_NOT_FOUND', 'Equipo no encontrado');
      }

      return sendSuccess(res, { message: 'Equipo actualizado exitosamente' });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_ERROR', error.message);
    }
  }

  /**
   * DELETE /api/equipos/:id
   * Delete (soft delete) equipment
   */
  @Delete(':id')
  async eliminarEquipo(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const currentUser = req.user;
      if (currentUser.rol !== 'ADMIN') {
        return sendError(res, 403, 'FORBIDDEN', 'Solo ADMIN puede eliminar equipos');
      }

      const deleted = await this.equiposService.eliminarEquipo(parseInt(id));

      if (!deleted) {
        return sendError(res, 404, 'EQUIPO_NOT_FOUND', 'Equipo no encontrado');
      }

      return sendSuccess(res, { message: 'Equipo eliminado exitosamente' });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_ERROR', error.message);
    }
  }
}
```

### Controller Responsibilities

| Responsibility           | Examples                                          |
| ------------------------ | ------------------------------------------------- |
| **Parse Input**          | Extract query params, body, path params           |
| **Validate Permissions** | Check if user has required role/permissions       |
| **Call Services**        | Delegate business logic to service layer          |
| **Apply DTOs**           | Transform service response to API format          |
| **Return Responses**     | Use response helpers (sendSuccess, sendError)     |
| **Handle Errors**        | Catch exceptions and return standard error format |

### Controller DON'Ts

- ❌ Don't contain business logic (move to services)
- ❌ Don't query database directly (use services)
- ❌ Don't return raw entities (always use DTOs)
- ❌ Don't skip error handling (always try/catch)
- ❌ Don't hardcode responses (use response helpers)

---

## Service Layer Patterns

### Standard Service Structure

```typescript
// backend/src/services/equipos.service.ts

import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { equipoToDTO, equipoListToDTO } from '../utils/dto-transformer';
import { EquipoDTO, EquipoListDTO } from '../types/dto/equipos.dto';

@Injectable({ scope: Scope.REQUEST }) // ✅ IMPORTANT: Request-scoped for tenant context
export class EquiposService {
  private dataSource: DataSource;

  constructor(@Inject(REQUEST) private request: Request) {
    // Get tenant-specific database connection
    this.dataSource = this.request.tenantContext.dataSource;
  }

  /**
   * List equipment with filters and pagination
   */
  async listarEquipos(params: {
    page: number;
    limit: number;
    tipo_equipo?: string;
    estado?: string;
  }): Promise<{ data: EquipoListDTO[]; total: number }> {
    const { page, limit, tipo_equipo, estado } = params;
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = `
      SELECT e.*, p.razon_social as proveedor_nombre
      FROM equipos e
      LEFT JOIN proveedores p ON e.id_proveedor = p.id_proveedor
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (tipo_equipo) {
      query += ` AND e.tipo_equipo = $${paramIndex}`;
      queryParams.push(tipo_equipo);
      paramIndex++;
    }

    if (estado) {
      query += ` AND e.estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }

    // Count total (for pagination)
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const countResult = await this.dataSource.query(countQuery, queryParams);
    const total = parseInt(countResult[0].total);

    // Get paginated data
    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const equipos = await this.dataSource.query(query, queryParams);

    // Transform to DTOs (snake_case)
    const equiposDTOs = equipoListToDTO(equipos);

    return { data: equiposDTOs, total };
  }

  /**
   * Get single equipment by ID
   */
  async obtenerEquipoPorId(idEquipo: number): Promise<EquipoDTO | null> {
    const result = await this.dataSource.query(
      `SELECT e.*, 
              p.id_proveedor, p.razon_social as proveedor_nombre, p.ruc as proveedor_ruc,
              COUNT(pd.id_parte_diario) as total_partes_diarios
       FROM equipos e
       LEFT JOIN proveedores p ON e.id_proveedor = p.id_proveedor
       LEFT JOIN partes_diarios_equipo pd ON e.id_equipo = pd.id_equipo
       WHERE e.id_equipo = $1
       GROUP BY e.id_equipo, p.id_proveedor`,
      [idEquipo]
    );

    if (result.length === 0) {
      return null;
    }

    // Transform to DTO
    return equipoToDTO(result[0]);
  }

  /**
   * Create new equipment
   */
  async crearEquipo(data: {
    codigo_equipo: string;
    tipo_equipo: string;
    marca: string;
    modelo: string;
    anio_fabricacion?: number;
    placa_serie?: string;
    tipo_propiedad: 'PROPIOS' | 'TERCEROS';
    id_proveedor?: number;
  }): Promise<{ id_equipo: number }> {
    // Business logic: Validate codigo_equipo uniqueness
    const existe = await this.dataSource.query(
      'SELECT id_equipo FROM equipos WHERE codigo_equipo = $1',
      [data.codigo_equipo]
    );

    if (existe.length > 0) {
      throw { code: 'DUPLICATE_CODIGO', message: 'Código de equipo ya existe' };
    }

    // Business logic: If TERCEROS, must have proveedor
    if (data.tipo_propiedad === 'TERCEROS' && !data.id_proveedor) {
      throw { code: 'MISSING_PROVEEDOR', message: 'Equipos de terceros requieren proveedor' };
    }

    // Insert equipment
    const result = await this.dataSource.query(
      `INSERT INTO equipos 
        (codigo_equipo, tipo_equipo, marca, modelo, anio_fabricacion, placa_serie, 
         tipo_propiedad, id_proveedor, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DISPONIBLE')
       RETURNING id_equipo`,
      [
        data.codigo_equipo,
        data.tipo_equipo,
        data.marca,
        data.modelo,
        data.anio_fabricacion,
        data.placa_serie,
        data.tipo_propiedad,
        data.id_proveedor,
      ]
    );

    return { id_equipo: result[0].id_equipo };
  }

  /**
   * Update equipment
   */
  async actualizarEquipo(
    idEquipo: number,
    data: Partial<{
      tipo_equipo: string;
      marca: string;
      modelo: string;
      estado: string;
    }>
  ): Promise<boolean> {
    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.tipo_equipo) {
      fields.push(`tipo_equipo = $${paramIndex}`);
      values.push(data.tipo_equipo);
      paramIndex++;
    }

    if (data.marca) {
      fields.push(`marca = $${paramIndex}`);
      values.push(data.marca);
      paramIndex++;
    }

    if (data.modelo) {
      fields.push(`modelo = $${paramIndex}`);
      values.push(data.modelo);
      paramIndex++;
    }

    if (data.estado) {
      fields.push(`estado = $${paramIndex}`);
      values.push(data.estado);
      paramIndex++;
    }

    if (fields.length === 0) {
      return false; // No fields to update
    }

    fields.push(`updated_at = NOW()`);
    values.push(idEquipo);

    const query = `UPDATE equipos SET ${fields.join(', ')} WHERE id_equipo = $${paramIndex}`;
    const result = await this.dataSource.query(query, values);

    return result.rowCount > 0;
  }

  /**
   * Delete (soft delete) equipment
   */
  async eliminarEquipo(idEquipo: number): Promise<boolean> {
    // Business logic: Check if equipment is in use (has active contracts)
    const enUso = await this.dataSource.query(
      `SELECT id_contrato FROM contratos_alquiler 
       WHERE id_equipo = $1 AND estado_contrato IN ('ACTIVO', 'LEGALIZADO')`,
      [idEquipo]
    );

    if (enUso.length > 0) {
      throw {
        code: 'EQUIPO_EN_USO',
        message: 'No se puede eliminar equipo con contratos activos',
      };
    }

    // Soft delete
    const result = await this.dataSource.query(
      `UPDATE equipos SET estado = 'ELIMINADO', updated_at = NOW() WHERE id_equipo = $1`,
      [idEquipo]
    );

    return result.rowCount > 0;
  }
}
```

### Service Responsibilities

| Responsibility             | Examples                                                   |
| -------------------------- | ---------------------------------------------------------- |
| **Business Logic**         | Validate business rules, calculate values                  |
| **Database Queries**       | SELECT, INSERT, UPDATE, DELETE via DataSource              |
| **Data Transformation**    | Entity → DTO transformation (or return raw for controller) |
| **Transaction Management** | Wrap multiple operations in transactions                   |
| **Error Handling**         | Throw business exceptions with error codes                 |

### Service Best Practices

- ✅ Use request-scoped services (`@Injectable({ scope: Scope.REQUEST })`)
- ✅ Get DataSource from `req.tenantContext` (tenant-aware)
- ✅ Validate business rules before database operations
- ✅ Throw meaningful errors with error codes
- ✅ Use parameterized queries ($1, $2) to prevent SQL injection
- ✅ Implement pagination at service level
- ✅ Transform to DTOs in service or let controller handle it (be consistent)

---

## DTO Transformation

### DTO Definition

```typescript
// backend/src/types/dto/equipos.dto.ts

// List DTO (minimal fields for list view)
export interface EquipoListDTO {
  id_equipo: number;
  codigo_equipo: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  estado: string;
  proveedor_nombre?: string;
}

// Detail DTO (full fields for detail view)
export interface EquipoDTO {
  id_equipo: number;
  codigo_equipo: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  anio_fabricacion?: number;
  placa_serie?: string;
  tipo_propiedad: 'PROPIOS' | 'TERCEROS';
  estado: string;
  horimetro_actual?: number;
  fecha_incorporacion?: string;
  proveedor?: {
    id_proveedor: number;
    razon_social: string;
    ruc: string;
  };
  total_partes_diarios?: number;
  created_at: string;
  updated_at: string;
}

// Create DTO (input validation)
export interface EquipoCreateDTO {
  codigo_equipo: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  anio_fabricacion?: number;
  placa_serie?: string;
  tipo_propiedad: 'PROPIOS' | 'TERCEROS';
  id_proveedor?: number;
}

// Update DTO (partial fields)
export interface EquipoUpdateDTO {
  tipo_equipo?: string;
  marca?: string;
  modelo?: string;
  estado?: string;
}

// Query DTO (for filters)
export interface EquipoQueryDTO {
  page?: string | number;
  limit?: string | number;
  tipo_equipo?: string;
  estado?: string;
}
```

### Transformation Functions

```typescript
// backend/src/utils/dto-transformer.ts

import { EquipoDTO, EquipoListDTO } from '../types/dto/equipos.dto';

/**
 * Transform database row to EquipoListDTO (snake_case)
 */
export function equipoListToDTO(equipos: any[]): EquipoListDTO[] {
  return equipos.map((e) => ({
    id_equipo: e.id_equipo,
    codigo_equipo: e.codigo_equipo,
    tipo_equipo: e.tipo_equipo,
    marca: e.marca,
    modelo: e.modelo,
    estado: e.estado,
    proveedor_nombre: e.proveedor_nombre || null,
  }));
}

/**
 * Transform database row to EquipoDTO (snake_case, nested objects)
 */
export function equipoToDTO(equipo: any): EquipoDTO {
  return {
    id_equipo: equipo.id_equipo,
    codigo_equipo: equipo.codigo_equipo,
    tipo_equipo: equipo.tipo_equipo,
    marca: equipo.marca,
    modelo: equipo.modelo,
    anio_fabricacion: equipo.anio_fabricacion,
    placa_serie: equipo.placa_serie,
    tipo_propiedad: equipo.tipo_propiedad,
    estado: equipo.estado,
    horimetro_actual: equipo.horimetro_actual,
    fecha_incorporacion: equipo.fecha_incorporacion
      ? equipo.fecha_incorporacion.toISOString().split('T')[0]
      : null,
    proveedor: equipo.id_proveedor
      ? {
          id_proveedor: equipo.id_proveedor,
          razon_social: equipo.proveedor_nombre,
          ruc: equipo.proveedor_ruc,
        }
      : null,
    total_partes_diarios: parseInt(equipo.total_partes_diarios || 0),
    created_at: equipo.created_at?.toISOString() || null,
    updated_at: equipo.updated_at?.toISOString() || null,
  };
}

/**
 * Generic camelCase to snake_case transformer
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const snakeCaseObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseObj[snakeKey] = toSnakeCase(value);
    }
    return snakeCaseObj;
  }

  return obj;
}
```

---

## Tenant-Aware Queries

### Always Use Tenant DataSource

```typescript
// ✅ CORRECT: Use tenant-specific connection
@Injectable({ scope: Scope.REQUEST })
export class EquiposService {
  private dataSource: DataSource;

  constructor(@Inject(REQUEST) private request: Request) {
    this.dataSource = this.request.tenantContext.dataSource;
  }

  async listarEquipos() {
    // This query runs on company-specific database
    return await this.dataSource.query('SELECT * FROM equipos');
  }
}

// ❌ WRONG: Use global connection (ignores tenant context)
@Injectable() // Singleton scope - wrong!
export class EquiposService {
  constructor(private dataSource: DataSource) {} // Global connection

  async listarEquipos() {
    return await this.dataSource.query('SELECT * FROM equipos'); // Which database?
  }
}
```

### Cross-Company Queries (Sistema DB)

```typescript
// Special case: Query sistema database for platform operations
@Injectable({ scope: Scope.REQUEST })
export class EmpresasService {
  constructor(
    @Inject(REQUEST) private request: Request,
    @Inject('SISTEMA_DATA_SOURCE') private sistemaDataSource: DataSource
  ) {}

  async listarEmpresas() {
    // Query sistema database (not company database)
    return await this.sistemaDataSource.query(
      'SELECT id_empresa, razon_social, estado FROM empresas WHERE estado = $1',
      ['ACTIVO']
    );
  }
}
```

---

## Error Handling

### Error Codes Standard

| Code               | HTTP Status | Usage                       |
| ------------------ | ----------- | --------------------------- |
| `NOT_FOUND`        | 404         | Resource not found          |
| `DUPLICATE_KEY`    | 409         | Unique constraint violation |
| `FORBIDDEN`        | 403         | User lacks permissions      |
| `UNAUTHORIZED`     | 401         | Authentication required     |
| `VALIDATION_ERROR` | 400         | Input validation failed     |
| `INTERNAL_ERROR`   | 500         | Unexpected server error     |
| `DATABASE_ERROR`   | 500         | Database query failed       |

### Service Error Handling

```typescript
// Service throws business exceptions
async crearEquipo(data: any) {
  // Business rule validation
  if (!data.codigo_equipo) {
    throw { code: 'VALIDATION_ERROR', message: 'Código de equipo requerido' };
  }

  // Check duplicates
  const existe = await this.dataSource.query(
    'SELECT id FROM equipos WHERE codigo = $1',
    [data.codigo_equipo]
  );

  if (existe.length > 0) {
    throw { code: 'DUPLICATE_KEY', message: 'Código de equipo ya existe' };
  }

  // Database operation
  try {
    const result = await this.dataSource.query('INSERT INTO equipos ...');
    return result;
  } catch (error) {
    throw { code: 'DATABASE_ERROR', message: error.message };
  }
}
```

### Controller Error Handling

```typescript
// Controller catches and formats errors
@Post()
async crearEquipo(@Body() body: any, @Res() res: Response) {
  try {
    const result = await this.equiposService.crearEquipo(body);
    return sendCreated(res, result.id_equipo);
  } catch (error) {
    // Map service exceptions to HTTP responses
    if (error.code === 'DUPLICATE_KEY') {
      return sendError(res, 409, error.code, error.message);
    }
    if (error.code === 'VALIDATION_ERROR') {
      return sendError(res, 400, error.code, error.message);
    }
    // Unknown error
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}
```

---

## Pagination

### Pagination Parameters

| Parameter | Type   | Default | Description              |
| --------- | ------ | ------- | ------------------------ |
| `page`    | number | 1       | Current page (1-indexed) |
| `limit`   | number | 10      | Items per page (max 100) |

### Pagination Implementation

```typescript
async listarEquipos(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  // Count total items
  const countResult = await this.dataSource.query(
    'SELECT COUNT(*) as total FROM equipos WHERE estado != $1',
    ['ELIMINADO']
  );
  const total = parseInt(countResult[0].total);

  // Get paginated items
  const equipos = await this.dataSource.query(
    `SELECT * FROM equipos
     WHERE estado != $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    ['ELIMINADO', limit, offset]
  );

  return { data: equipos, total };
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

---

## Validation

### Input Validation

```typescript
// Use class-validator for DTOs
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class EquipoCreateDTO {
  @IsString()
  codigo_equipo: string;

  @IsString()
  @IsIn(['EQUIPOS_MENORES', 'VEHICULOS_LIVIANOS', 'VEHICULOS_PESADOS', 'MAQUINARIA_PESADA'])
  tipo_equipo: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsOptional()
  @IsNumber()
  anio_fabricacion?: number;

  @IsString()
  @IsIn(['PROPIOS', 'TERCEROS'])
  tipo_propiedad: 'PROPIOS' | 'TERCEROS';
}
```

### Validation Pipe

```typescript
// Apply validation globally
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true, // Auto-transform types
  })
);
```

---

## Testing Patterns

### Service Unit Tests

```typescript
// backend/src/services/equipos.service.spec.ts

describe('EquiposService', () => {
  let service: EquiposService;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    };

    const mockRequest = {
      tenantContext: { dataSource: mockDataSource },
    };

    service = new EquiposService(mockRequest as any);
  });

  it('should list equipment', async () => {
    mockDataSource.query.mockResolvedValueOnce([{ total: 2 }]); // Count query
    mockDataSource.query.mockResolvedValueOnce([
      /* mock data */
    ]); // Select query

    const result = await service.listarEquipos({ page: 1, limit: 10 });

    expect(result.total).toBe(2);
    expect(mockDataSource.query).toHaveBeenCalledTimes(2);
  });
});
```

---

## Best Practices Summary

### DO ✅

1. Always use standard response format (`{ success, data, pagination/error }`)
2. Always transform to snake_case DTOs before returning
3. Always use request-scoped services for tenant context
4. Always validate permissions in controllers
5. Always use parameterized queries ($1, $2, $3)
6. Always implement pagination for list endpoints
7. Always throw meaningful error codes
8. Always log errors to audit trail

### DON'T ❌

1. Don't return raw TypeORM entities
2. Don't mix camelCase and snake_case in responses
3. Don't skip DTOs
4. Don't use global singleton services (breaks multi-tenancy)
5. Don't concatenate SQL strings (SQL injection risk)
6. Don't return different response shapes from same endpoint
7. Don't forget error handling (always try/catch)
8. Don't expose internal error details to client

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Core architectural principles
- [MULTITENANCY.md](./MULTITENANCY.md) - Tenant context and database isolation
- [USER-MANAGEMENT.md](./USER-MANAGEMENT.md) - Role-based permissions

---

## Version History

- **v1.0.0** (2026-01-17): Initial API patterns documentation

---

**Consistency in API design prevents bugs and accelerates development.**
