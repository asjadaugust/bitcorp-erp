> LOCAL CACHE — Primary read source for Claude Code (zero-MCP-call fast path).
> Canonical source: https://bitcorp-erp.atlassian.net/wiki/spaces/BitCorp/pages/66401 (Multi-Tenancy Architecture)
> To refresh: `atlassian-docs refresh multi-tenancy`
> Last synced: 2026-03-05

# BitCorp ERP - Multi-Tenancy Architecture Guide

## Overview

BitCorp ERP uses a **separate database per company** (tenant) architecture for maximum data isolation, security, and scalability. This approach provides complete logical and physical separation of company data while maintaining a central platform management layer.

**Date**: January 17, 2026  
**Status**: Architectural Standard  
**Applies To**: All BitCorp ERP modules

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Database Architecture](#database-architecture)
3. [Central Sistema Database](#central-sistema-database)
4. [Company Database Provisioning](#company-database-provisioning)
5. [Tenant Context Management](#tenant-context-management)
6. [Backend Implementation](#backend-implementation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Cloud Deployment Patterns](#cloud-deployment-patterns)
9. [Migration Strategy](#migration-strategy)
10. [Security & Compliance](#security--compliance)

---

## Architecture Principles

### Core Design Decisions

1. **Database Isolation**: Each company (tenant) has its own PostgreSQL database
2. **Central Platform DB**: One "sistema" database manages platform-level concerns
3. **Cloud-Ready**: Designed for AWS RDS, GCP Cloud SQL, or Azure Database for PostgreSQL
4. **Connection Pooling**: Dynamic data source switching per request
5. **Zero Shared Data**: No business data shared between company databases
6. **Migration Independence**: Each company database can be upgraded independently

### Why Separate Databases?

| Benefit            | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| **Security**       | Complete data isolation - breaches contained to single tenant    |
| **Compliance**     | Easier to meet regulatory requirements per company               |
| **Performance**    | No cross-tenant query contention, easier to optimize             |
| **Scalability**    | Can move large tenants to dedicated database servers             |
| **Backup/Restore** | Independent backup schedules, point-in-time recovery per company |
| **Customization**  | Future: Allow company-specific schema extensions                 |

### Trade-offs vs Shared Schema

| Aspect         | Separate DB (✅ Our Choice)        | Shared Schema (❌ Not Used)       |
| -------------- | ---------------------------------- | --------------------------------- |
| Data Isolation | Perfect                            | Logical only (tenant_id filter)   |
| Database Size  | Many small DBs                     | One large DB                      |
| Migrations     | Run per company                    | Single migration run              |
| Queries        | Simple (no tenant filter)          | Every query needs WHERE tenant_id |
| Risk           | Isolated failures                  | Bug can leak data across tenants  |
| Cost           | Slightly higher (more connections) | Lower (shared resources)          |

**Decision**: Security and isolation are more important than operational simplicity.

---

## Database Architecture

### Database Structure Overview

```
PostgreSQL Cluster
├── bitcorp_sistema              # Central platform database
│   ├── empresas                 # Company registry
│   ├── usuarios_sistema         # Platform administrators (ADMIN_SISTEMA)
│   ├── suscripciones           # Billing/subscription info
│   ├── audit_log               # Platform-level audit trail
│   └── config_global           # Global configuration
│
├── bitcorp_empresa_001          # Company 1 database (e.g., ARAMSA)
│   ├── usuarios                 # Company users
│   ├── proyectos               # Projects
│   ├── equipos                 # Equipment
│   ├── contratos_alquiler      # Rental contracts
│   ├── valorizaciones_equipo   # Monthly valuations
│   └── ... (all business tables)
│
├── bitcorp_empresa_002          # Company 2 database (e.g., COSAPI)
│   └── ... (same schema as empresa_001)
│
└── bitcorp_empresa_XXX          # Company N database
    └── ... (same schema)
```

### Naming Conventions

| Database Type      | Naming Pattern                                        | Examples                                           |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------- |
| Sistema (Central)  | `bitcorp_sistema`                                     | `bitcorp_sistema`                                  |
| Production Company | `bitcorp_empresa_{code}`                              | `bitcorp_empresa_aramsa`, `bitcorp_empresa_cosapi` |
| Development        | `bitcorp_sistema_dev`, `bitcorp_empresa_{code}_dev`   | `bitcorp_empresa_aramsa_dev`                       |
| Testing            | `bitcorp_sistema_test`, `bitcorp_empresa_{code}_test` | `bitcorp_empresa_test001`                          |

**Rules**:

- Database names: lowercase, underscores only (no dashes)
- Company codes: alphanumeric, max 20 characters
- Environment suffixes: `_dev`, `_test`, `_staging`, `_prod` (prod has no suffix)

---

## Central Sistema Database

### Purpose

The `bitcorp_sistema` database is the **single source of truth** for:

- Company registry (who are the tenants?)
- Platform administrators (ADMIN_SISTEMA role)
- Subscription/billing information
- Global configuration
- Cross-company audit logs (company creation, suspension, deletion)

### Schema: bitcorp_sistema

```sql
-- ============================================
-- CENTRAL SISTEMA DATABASE SCHEMA
-- Database: bitcorp_sistema
-- ============================================

-- Company Registry
CREATE TABLE empresas (
  id_empresa SERIAL PRIMARY KEY,
  codigo_empresa VARCHAR(20) UNIQUE NOT NULL,  -- Used in database name
  razon_social VARCHAR(200) NOT NULL,
  ruc VARCHAR(11) UNIQUE,
  database_name VARCHAR(100) UNIQUE NOT NULL,  -- bitcorp_empresa_{codigo_empresa}
  database_host VARCHAR(255),                   -- For future multi-host support
  database_port INTEGER DEFAULT 5432,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO | SUSPENDIDO | ELIMINADO
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_activacion TIMESTAMP,
  fecha_suspension TIMESTAMP,

  -- Contact Info
  contacto_nombre VARCHAR(200),
  contacto_email VARCHAR(200),
  contacto_telefono VARCHAR(20),

  -- Billing
  tipo_suscripcion VARCHAR(50),                 -- TRIAL | BASICO | PROFESIONAL | ENTERPRISE
  fecha_inicio_suscripcion DATE,
  fecha_fin_suscripcion DATE,

  -- Metadata
  config_json JSONB,                            -- Company-specific configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform Administrators (ADMIN_SISTEMA)
CREATE TABLE usuarios_sistema (
  id_usuario SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(200) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'ADMIN_SISTEMA',  -- Future: SOPORTE, AUDITOR
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform Audit Log
CREATE TABLE audit_log_sistema (
  id_log SERIAL PRIMARY KEY,
  id_usuario_sistema INTEGER REFERENCES usuarios_sistema(id_usuario),
  accion VARCHAR(100) NOT NULL,               -- CREAR_EMPRESA, SUSPENDER_EMPRESA, etc.
  id_empresa INTEGER REFERENCES empresas(id_empresa),
  detalles JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Global Configuration
CREATE TABLE config_global (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50),                            -- STRING | INTEGER | BOOLEAN | JSON
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session Management (Optional)
CREATE TABLE sesiones_sistema (
  id_sesion VARCHAR(255) PRIMARY KEY,
  id_usuario_sistema INTEGER REFERENCES usuarios_sistema(id_usuario),
  token_hash VARCHAR(255),
  expira_en TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_empresas_estado ON empresas(estado);
CREATE INDEX idx_empresas_codigo ON empresas(codigo_empresa);
CREATE INDEX idx_usuarios_sistema_email ON usuarios_sistema(email);
CREATE INDEX idx_audit_log_fecha ON audit_log_sistema(created_at);
CREATE INDEX idx_audit_log_empresa ON audit_log_sistema(id_empresa);
```

### Sistema Database Access

**Who Can Access `bitcorp_sistema`?**

- ✅ Platform administrators (ADMIN_SISTEMA role)
- ✅ Backend services (system-level operations)
- ❌ Company users (ADMIN, DIRECTOR, JEFE_EQUIPO, OPERADOR)
- ❌ Frontend directly (always through backend API)

---

## Company Database Provisioning

### Provisioning Workflow

When a new company is onboarded:

```
1. ADMIN_SISTEMA creates company in sistema.empresas
   └─> Generates codigo_empresa (e.g., "aramsa", "cosapi")

2. System creates new PostgreSQL database
   └─> Name: bitcorp_empresa_{codigo_empresa}

3. System runs schema migration
   └─> Execute 001_init_schema.sql on new database

4. System runs seed data (optional)
   └─> Execute 002_seed.sql with company-specific defaults

5. System creates first company ADMIN user
   └─> Insert into {company_db}.usuarios with rol = 'ADMIN'

6. System updates sistema.empresas
   └─> Set estado = 'ACTIVO', fecha_activacion = NOW()

7. ADMIN_SISTEMA sends welcome email
   └─> Login credentials for company ADMIN
```

### Provisioning Implementation

**Backend Service**: `CompanyProvisioningService`

```typescript
// backend/src/services/company-provisioning.service.ts

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompanyProvisioningService {
  constructor(
    private sistemaDataSource: DataSource // Connection to bitcorp_sistema
  ) {}

  /**
   * Create a new company tenant with isolated database
   */
  async provisionarEmpresa(data: {
    codigo_empresa: string;
    razon_social: string;
    ruc?: string;
    contacto_email: string;
    admin_nombre: string;
    admin_email: string;
    admin_username: string;
  }) {
    // 1. Validate company code (alphanumeric, lowercase)
    const codigoLimpio = data.codigo_empresa.toLowerCase().replace(/[^a-z0-9]/g, '');
    const databaseName = `bitcorp_empresa_${codigoLimpio}`;

    // 2. Create empresa record in sistema database
    const empresaResult = await this.sistemaDataSource.query(
      `INSERT INTO empresas 
        (codigo_empresa, razon_social, ruc, database_name, contacto_email, estado)
       VALUES ($1, $2, $3, $4, $5, 'PROVISIONANDO')
       RETURNING id_empresa`,
      [codigoLimpio, data.razon_social, data.ruc, databaseName, data.contacto_email]
    );
    const idEmpresa = empresaResult[0].id_empresa;

    try {
      // 3. Create physical database
      await this.sistemaDataSource.query(
        `CREATE DATABASE ${databaseName} WITH ENCODING 'UTF8' LC_COLLATE='es_PE.UTF-8' LC_CTYPE='es_PE.UTF-8'`
      );

      // 4. Connect to new database and run schema
      const companyDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: databaseName,
      });
      await companyDataSource.initialize();

      // 5. Run schema migration
      const schemaSQL = fs.readFileSync(
        path.join(__dirname, '../../database/001_init_schema.sql'),
        'utf-8'
      );
      await companyDataSource.query(schemaSQL);

      // 6. Create first company ADMIN user
      const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
      await companyDataSource.query(
        `INSERT INTO usuarios 
          (username, email, password_hash, nombre_completo, rol, activo)
         VALUES ($1, $2, $3, $4, 'ADMIN', true)`,
        [data.admin_username, data.admin_email, passwordHash, data.admin_nombre]
      );

      await companyDataSource.destroy();

      // 7. Update empresa status to ACTIVO
      await this.sistemaDataSource.query(
        `UPDATE empresas 
         SET estado = 'ACTIVO', fecha_activacion = NOW() 
         WHERE id_empresa = $1`,
        [idEmpresa]
      );

      // 8. Audit log
      await this.registrarAuditoria({
        accion: 'CREAR_EMPRESA',
        id_empresa: idEmpresa,
        detalles: { codigo_empresa: codigoLimpio, razon_social: data.razon_social },
      });

      return { success: true, id_empresa: idEmpresa, database_name: databaseName };
    } catch (error) {
      // Rollback: Mark empresa as failed
      await this.sistemaDataSource.query(
        `UPDATE empresas SET estado = 'ERROR' WHERE id_empresa = $1`,
        [idEmpresa]
      );
      throw error;
    }
  }

  /**
   * Suspend a company (data remains, access blocked)
   */
  async suspenderEmpresa(idEmpresa: number) {
    await this.sistemaDataSource.query(
      `UPDATE empresas 
       SET estado = 'SUSPENDIDO', fecha_suspension = NOW() 
       WHERE id_empresa = $1`,
      [idEmpresa]
    );

    await this.registrarAuditoria({
      accion: 'SUSPENDER_EMPRESA',
      id_empresa: idEmpresa,
    });
  }

  /**
   * Delete a company (WARNING: Drops database!)
   */
  async eliminarEmpresa(idEmpresa: number) {
    const empresa = await this.sistemaDataSource.query(
      `SELECT database_name FROM empresas WHERE id_empresa = $1`,
      [idEmpresa]
    );

    if (empresa.length === 0) {
      throw new Error('Empresa no encontrada');
    }

    const databaseName = empresa[0].database_name;

    // 1. Terminate all connections to database
    await this.sistemaDataSource.query(
      `SELECT pg_terminate_backend(pid) 
       FROM pg_stat_activity 
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [databaseName]
    );

    // 2. Drop database
    await this.sistemaDataSource.query(`DROP DATABASE ${databaseName}`);

    // 3. Mark empresa as ELIMINADO (soft delete)
    await this.sistemaDataSource.query(
      `UPDATE empresas SET estado = 'ELIMINADO' WHERE id_empresa = $1`,
      [idEmpresa]
    );

    await this.registrarAuditoria({
      accion: 'ELIMINAR_EMPRESA',
      id_empresa: idEmpresa,
      detalles: { database_name: databaseName },
    });
  }

  private async registrarAuditoria(data: any) {
    // Log to audit_log_sistema
    await this.sistemaDataSource.query(
      `INSERT INTO audit_log_sistema (accion, id_empresa, detalles, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [data.accion, data.id_empresa, JSON.stringify(data.detalles || {})]
    );
  }
}
```

---

## Tenant Context Management

### How Tenant Context Works

Every API request must carry **tenant context** to know which company database to use.

**Flow**:

```
1. User logs in → JWT contains user.id_empresa (from company DB)
2. User makes API request → JWT in Authorization header
3. Backend extracts JWT → Gets id_empresa
4. Backend queries bitcorp_sistema.empresas → Gets database_name
5. Backend switches DataSource → Connects to company database
6. Backend executes query → Returns data
```

### Tenant Context Middleware

```typescript
// backend/src/middleware/tenant-context.middleware.ts

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        idEmpresa: number;
        codigoEmpresa: string;
        databaseName: string;
        dataSource: DataSource;
      };
      user?: any;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private sistemaDataSource: DataSource,
    private dataSources: Map<string, DataSource> // Cache of company connections
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant context for public routes
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    // Extract JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Check if ADMIN_SISTEMA (accesses sistema DB)
    if (decoded.rol === 'ADMIN_SISTEMA') {
      req.tenantContext = {
        idEmpresa: null,
        codigoEmpresa: 'sistema',
        databaseName: 'bitcorp_sistema',
        dataSource: this.sistemaDataSource,
      };
      req.user = decoded;
      return next();
    }

    // Regular company user - needs tenant context
    const idEmpresa = decoded.id_empresa;
    if (!idEmpresa) {
      throw new ForbiddenException('Usuario sin empresa asignada');
    }

    // Get company database info
    const empresa = await this.sistemaDataSource.query(
      `SELECT codigo_empresa, database_name, estado, database_host, database_port 
       FROM empresas 
       WHERE id_empresa = $1`,
      [idEmpresa]
    );

    if (empresa.length === 0) {
      throw new ForbiddenException('Empresa no encontrada');
    }

    const empresaData = empresa[0];

    if (empresaData.estado !== 'ACTIVO') {
      throw new ForbiddenException(`Empresa ${empresaData.estado.toLowerCase()}`);
    }

    // Get or create DataSource for this company
    const databaseName = empresaData.database_name;
    let dataSource = this.dataSources.get(databaseName);

    if (!dataSource) {
      dataSource = new DataSource({
        type: 'postgres',
        host: empresaData.database_host || process.env.DB_HOST,
        port: empresaData.database_port || parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: databaseName,
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      });

      await dataSource.initialize();
      this.dataSources.set(databaseName, dataSource);
    }

    // Set tenant context on request
    req.tenantContext = {
      idEmpresa: idEmpresa,
      codigoEmpresa: empresaData.codigo_empresa,
      databaseName: databaseName,
      dataSource: dataSource,
    };

    req.user = decoded;
    next();
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = ['/api/auth/login', '/api/health', '/api/sistema/login'];
    return publicRoutes.some((route) => path.startsWith(route));
  }
}
```

### Using Tenant Context in Services

```typescript
// backend/src/services/equipos.service.ts

import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST }) // Important: Request-scoped
export class EquiposService {
  constructor(@Inject(REQUEST) private request: Request) {}

  async listarEquipos(page: number = 1, limit: number = 10) {
    const { dataSource } = this.request.tenantContext;

    // Query company-specific database
    const equipos = await dataSource.query(
      `SELECT e.*, p.razon_social as proveedor_nombre
       FROM equipos e
       LEFT JOIN proveedores p ON e.id_proveedor = p.id_proveedor
       WHERE e.estado != 'ELIMINADO'
       ORDER BY e.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );

    return equipos;
  }
}
```

---

## Backend Implementation

### Database Configuration

**Environment Variables** (`.env`):

```bash
# Sistema Database (Central Platform)
DB_SISTEMA_HOST=localhost
DB_SISTEMA_PORT=5432
DB_SISTEMA_USER=bitcorp_admin
DB_SISTEMA_PASSWORD=SecurePassword123!
DB_SISTEMA_NAME=bitcorp_sistema

# Company Databases (Dynamic)
DB_HOST=localhost
DB_PORT=5432
DB_USER=bitcorp_app
DB_PASSWORD=SecurePassword123!

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h
```

### TypeORM Configuration

```typescript
// backend/src/config/database.config.ts

import { DataSource, DataSourceOptions } from 'typeorm';

// Sistema Database Configuration
export const sistemaDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_SISTEMA_HOST || 'localhost',
  port: parseInt(process.env.DB_SISTEMA_PORT || '5432'),
  username: process.env.DB_SISTEMA_USER,
  password: process.env.DB_SISTEMA_PASSWORD,
  database: process.env.DB_SISTEMA_NAME || 'bitcorp_sistema',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export const sistemaDataSource = new DataSource(sistemaDataSourceOptions);

// Company Database Configuration Template
export function getCompanyDataSourceOptions(databaseName: string): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  };
}
```

### Module Setup

```typescript
// backend/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sistemaDataSourceOptions } from './config/database.config';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';

@Module({
  imports: [
    // Sistema database connection
    TypeOrmModule.forRoot({
      ...sistemaDataSourceOptions,
      name: 'sistema',
    }),
  ],
  providers: [
    {
      provide: 'DATA_SOURCE_CACHE',
      useValue: new Map(), // Cache for company DataSources
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*'); // Apply to all routes
  }
}
```

---

## Authentication & Authorization

### Login Flow: Company Users

```
1. User submits login (username + password)
   └─> POST /api/auth/login

2. Backend queries bitcorp_sistema.empresas
   └─> Find active companies

3. Backend searches across company databases
   └─> For each ACTIVO empresa, check if user exists
   └─> SELECT * FROM {company_db}.usuarios WHERE username = ?

4. If found, verify password
   └─> bcrypt.compare(password, usuario.password_hash)

5. Generate JWT with company context
   └─> Payload: { id_usuario, id_empresa, rol, codigo_empresa }

6. Return JWT + user info
   └─> { token, usuario: { ... }, empresa: { ... } }
```

### Login Flow: Platform Administrators

```
1. ADMIN_SISTEMA submits login
   └─> POST /api/sistema/login

2. Backend queries bitcorp_sistema.usuarios_sistema
   └─> SELECT * FROM usuarios_sistema WHERE username = ?

3. Verify password
   └─> bcrypt.compare(password, usuario.password_hash)

4. Generate JWT with sistema role
   └─> Payload: { id_usuario, rol: 'ADMIN_SISTEMA' }

5. Return JWT
   └─> { token, usuario: { ... } }
```

### JWT Payload Structure

**Company User JWT**:

```json
{
  "id_usuario": 123,
  "id_empresa": 5,
  "codigo_empresa": "aramsa",
  "username": "jperez",
  "email": "jperez@aramsa.com",
  "rol": "ADMIN",
  "nombre_completo": "Juan Pérez",
  "iat": 1705500000,
  "exp": 1705586400
}
```

**Platform Admin JWT**:

```json
{
  "id_usuario": 1,
  "username": "admin.sistema",
  "email": "admin@bitcorp.com",
  "rol": "ADMIN_SISTEMA",
  "iat": 1705500000,
  "exp": 1705586400
}
```

---

## Cloud Deployment Patterns

### AWS Deployment

**Architecture**:

```
AWS Region (us-east-1)
├── VPC (bitcorp-vpc)
│   ├── Private Subnet (10.0.1.0/24)
│   │   └── RDS PostgreSQL Cluster
│   │       ├── bitcorp_sistema (Master DB)
│   │       ├── bitcorp_empresa_001
│   │       ├── bitcorp_empresa_002
│   │       └── ... (up to N company DBs)
│   │
│   └── Public Subnet (10.0.2.0/24)
│       └── ECS Fargate (Backend API)
│           └── Task Definition (bitcorp-api)
│
├── Application Load Balancer
│   └── HTTPS Listener (*.bitcorp.com)
│
└── S3 Buckets
    ├── bitcorp-backups (DB dumps)
    └── bitcorp-documents (PDFs, contracts)
```

**RDS Configuration**:

- Instance Type: `db.t3.medium` (development), `db.r6g.xlarge` (production)
- Storage: 100GB GP3 (auto-scaling enabled)
- Multi-AZ: Enabled for production
- Automated Backups: 7-day retention
- Performance Insights: Enabled

**Scaling Strategy**:

- **Small tenants (<100 users)**: All in single RDS instance (multiple databases)
- **Large tenants (>100 users)**: Dedicated RDS instance per company
- **Connection Pooling**: PgBouncer in front of RDS (max 100 connections per DB)

### GCP Deployment

**Architecture**:

```
GCP Project (bitcorp-erp-prod)
├── Cloud SQL for PostgreSQL
│   ├── Primary Instance (bitcorp-main)
│   │   ├── bitcorp_sistema
│   │   └── bitcorp_empresa_XXX (multi-tenant DBs)
│   └── Read Replicas (for reporting)
│
├── Cloud Run (Backend API)
│   └── bitcorp-api-service
│       └── Auto-scaling 1-50 instances
│
├── Cloud Load Balancing
│   └── HTTPS Load Balancer
│
└── Cloud Storage
    └── bitcorp-backups (Nearline storage)
```

**Cloud SQL Configuration**:

- Machine Type: `db-custom-4-16384` (4 vCPU, 16GB RAM)
- Storage: 100GB SSD (auto-increase enabled)
- High Availability: Regional (automatic failover)
- Backups: Daily at 3 AM UTC, 7-day retention

### Azure Deployment

**Architecture**:

```
Azure Subscription (bitcorp-production)
├── Azure Database for PostgreSQL
│   └── Flexible Server (bitcorp-postgres)
│       ├── bitcorp_sistema
│       └── bitcorp_empresa_XXX
│
├── Azure Container Apps (Backend API)
│   └── bitcorp-api-app
│       └── Scale 1-30 replicas
│
├── Azure Application Gateway
│   └── HTTPS Listener
│
└── Azure Blob Storage
    └── bitcorp-backups (Cool tier)
```

### Database Connection Management

**Connection Pooling Best Practices**:

```typescript
// Maximum connections per company database
const MAX_CONNECTIONS_PER_DB = 20;

// Connection pool configuration
const poolConfig = {
  min: 2, // Minimum idle connections
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout if no connection available
};

// Clean up unused connections every 5 minutes
setInterval(
  () => {
    for (const [dbName, dataSource] of dataSources.entries()) {
      const lastUsed = lastUsedMap.get(dbName);
      if (Date.now() - lastUsed > 5 * 60 * 1000) {
        // 5 minutes
        dataSource.destroy();
        dataSources.delete(dbName);
      }
    }
  },
  5 * 60 * 1000
);
```

---

## Migration Strategy

### Schema Synchronization

**Challenge**: Multiple company databases need to stay in sync with schema changes.

**Solution**: Migration orchestration script

```bash
#!/bin/bash
# scripts/migrate-all-companies.sh

# 1. Get list of all active companies
EMPRESAS=$(psql -h $DB_HOST -U $DB_USER -d bitcorp_sistema -t -c \
  "SELECT database_name FROM empresas WHERE estado = 'ACTIVO'")

# 2. Run migration on each company database
for DB_NAME in $EMPRESAS; do
  echo "Migrating $DB_NAME..."

  psql -h $DB_HOST -U $DB_USER -d "$DB_NAME" \
    -f database/migrations/003_add_equipos_gps.sql

  if [ $? -eq 0 ]; then
    echo "✓ $DB_NAME migrated successfully"
  else
    echo "✗ $DB_NAME migration failed!"
    exit 1
  fi
done

echo "All companies migrated successfully!"
```

### Migration Workflow

```
1. Developer creates migration file
   └─> database/migrations/003_add_equipos_gps.sql

2. Test migration on dev database
   └─> bitcorp_empresa_test001

3. Run migration on staging
   └─> All staging company databases

4. Schedule production migration
   └─> Low-traffic window (e.g., 2 AM)

5. Run migration script
   └─> Migrate all company databases sequentially

6. Verify each migration
   └─> Check schema, run smoke tests

7. Update sistema.empresas
   └─> Record schema_version in config_json
```

### Rollback Strategy

```sql
-- Always create rollback script alongside migration
-- database/migrations/003_add_equipos_gps_rollback.sql

ALTER TABLE equipos DROP COLUMN IF EXISTS latitud;
ALTER TABLE equipos DROP COLUMN IF EXISTS longitud;
ALTER TABLE equipos DROP COLUMN IF EXISTS ultima_ubicacion;
```

---

## Security & Compliance

### Data Isolation Guarantees

| Aspect                 | Implementation                                          |
| ---------------------- | ------------------------------------------------------- |
| **Physical Isolation** | Separate PostgreSQL databases, no shared tables         |
| **Query Isolation**    | Tenant context middleware ensures correct DB connection |
| **Backup Isolation**   | Each company DB backed up independently                 |
| **Access Control**     | Users can only access their company's database          |
| **Audit Trail**        | All cross-tenant operations logged in sistema DB        |

### Security Checklist

- ✅ All company users JWT must contain `id_empresa`
- ✅ ADMIN_SISTEMA cannot query company databases without explicit role switch
- ✅ Company databases accessible only through application (no direct DB access)
- ✅ SSL/TLS enforced for all database connections
- ✅ Database credentials rotated quarterly
- ✅ Connection strings never exposed to frontend
- ✅ Rate limiting per company (prevent one tenant from overwhelming DB)
- ✅ Automated backup verification (restore test monthly)

### Compliance Considerations

**GDPR / Data Privacy**:

- Right to deletion: Drop entire company database
- Data export: `pg_dump` of company database
- Data residency: Deploy region-specific RDS/Cloud SQL instances

**SOC 2 / ISO 27001**:

- Audit logging: All sistema-level operations logged
- Access reviews: Quarterly review of ADMIN_SISTEMA accounts
- Encryption at rest: Enabled on RDS/Cloud SQL
- Encryption in transit: SSL mode `require`

---

## Best Practices

### DO ✅

1. **Always use tenant context middleware** for authenticated routes
2. **Cache DataSource connections** to avoid connection pool exhaustion
3. **Log all sistema-level operations** (company creation, suspension, deletion)
4. **Validate empresa.estado = 'ACTIVO'** before allowing access
5. **Use request-scoped services** (`@Injectable({ scope: Scope.REQUEST })`)
6. **Test migrations on staging** before production deployment
7. **Monitor connection pool usage** per company database
8. **Set up alerts** for database connection failures

### DON'T ❌

1. **Don't share DataSource connections** across requests
2. **Don't expose company database names** in API responses
3. **Don't allow ADMIN_SISTEMA** to modify company data without audit trail
4. **Don't skip tenant context validation** in services
5. **Don't run migrations** during business hours
6. **Don't use a single connection pool** for all company databases
7. **Don't forget to clean up** unused DataSource connections
8. **Don't store tenant context** in global state

---

## Troubleshooting

### Issue: "Connection pool exhausted"

**Symptoms**: API requests timeout, database errors `ECONNREFUSED`

**Solutions**:

1. Increase `max` connections in pool config
2. Implement connection cleanup (close idle connections)
3. Check for connection leaks (missing `dataSource.destroy()`)
4. Add connection pooler (PgBouncer) between app and database

### Issue: "User logged in but queries return empty results"

**Symptoms**: User authenticated but sees no data

**Diagnosis**:

1. Check JWT payload has `id_empresa`
2. Verify empresa.estado = 'ACTIVO'
3. Check tenant context middleware executed
4. Verify `req.tenantContext.dataSource` points to correct database

**Solution**: Add logging to tenant context middleware to trace database selection

### Issue: "Migration failed on company database"

**Symptoms**: Some company databases updated, others failed

**Recovery**:

1. Identify failed databases: Check migration script output
2. Manually inspect failed DB: Check current schema version
3. Fix migration script: Address SQL errors
4. Re-run migration: Only on failed databases
5. Verify consistency: Compare schema across all company DBs

---

## Related Documentation

- [USER-MANAGEMENT.md](./USER-MANAGEMENT.md) - Role hierarchy and permissions
- [API-PATTERNS.md](./API-PATTERNS.md) - Tenant-aware query patterns
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Core architectural principles
- [.opencode/skill/bitcorp-prd-analyzer/SKILL.md](./.opencode/skill/bitcorp-prd-analyzer/SKILL.md) - Business domain knowledge

---

## Version History

- **v1.0.0** (2026-01-17): Initial multi-tenancy architecture documentation
  - Separate database per company design
  - Central sistema database schema
  - Provisioning workflow and implementation
  - Tenant context middleware
  - Cloud deployment patterns (AWS, GCP, Azure)
  - Migration and security strategies

---

**Architecture is not about perfection — it is about making secure isolation the default path.**
