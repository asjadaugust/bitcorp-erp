import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Company Entity - Multi-Tenancy Support
 *
 * ⚠️ WARNING: This entity references a table that does NOT currently exist in the database.
 * The table `administracion.empresa` needs to be created before this entity can be used.
 *
 * Required Migration:
 *
 * CREATE TABLE administracion.empresa (
 *   id SERIAL PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   subdomain VARCHAR(100) UNIQUE NOT NULL,
 *   status VARCHAR(50) DEFAULT 'active',
 *   settings JSONB DEFAULT '{}',
 *   subscription JSONB DEFAULT '{"plan": "trial", "maxProjects": 1, "maxUsers": 10}',
 *   contact_info JSONB DEFAULT '{}',
 *   billing_info JSONB DEFAULT '{}',
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_empresa_subdomain ON administracion.empresa(subdomain);
 * CREATE INDEX idx_empresa_status ON administracion.empresa(status);
 *
 * Related Tables Also Required:
 * - sistema.user_projects (junction table for user-project assignments)
 * - sistema.usuario.active_project_id (column to track user's active project)
 *
 * Until these tables are created, methods using this entity will return
 * graceful degradation responses (empty data or not implemented errors).
 */
@Entity('empresa', { schema: 'administracion' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  subdomain!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    timezone?: string;
    currency?: string;
    language?: string;
    dateFormat?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  subscription!: {
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    startDate?: Date;
    endDate?: Date;
    maxProjects: number;
    maxUsers: number;
  };

  @Column({ name: 'contact_info', type: 'jsonb', default: {} })
  contactInfo!: {
    email?: string;
    phone?: string;
    address?: string;
  };

  @Column({ name: 'billing_info', type: 'jsonb', default: {} })
  billingInfo!: {
    taxId?: string;
    billingEmail?: string;
    paymentMethod?: string;
  };

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * DTOs for Company Management
 */
export interface CreateCompanyDto {
  name: string;
  subdomain: string;
  settings?: Company['settings'];
  subscription?: Company['subscription'];
  contactInfo?: Company['contactInfo'];
  billingInfo?: Company['billingInfo'];
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {
  status?: Company['status'];
}

/**
 * User-Project Junction Table
 *
 * CREATE TABLE sistema.user_projects (
 *   id SERIAL PRIMARY KEY,
 *   user_id INTEGER NOT NULL REFERENCES sistema.usuario(id) ON DELETE CASCADE,
 *   project_id INTEGER NOT NULL REFERENCES proyectos.edt(id) ON DELETE CASCADE,
 *   role VARCHAR(50) DEFAULT 'user',
 *   is_default BOOLEAN DEFAULT false,
 *   assigned_at TIMESTAMP DEFAULT NOW(),
 *   UNIQUE(user_id, project_id)
 * );
 *
 * CREATE INDEX idx_user_projects_user ON sistema.user_projects(user_id);
 * CREATE INDEX idx_user_projects_project ON sistema.user_projects(project_id);
 */
@Entity('user_projects', { schema: 'sistema' })
export class UserProject {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId!: number;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
