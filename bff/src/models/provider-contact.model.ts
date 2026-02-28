import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.model';

export type ContactType = 'general' | 'commercial' | 'technical' | 'financial' | 'logistics';
export type ContactStatus = 'active' | 'inactive';

@Entity('provider_contacts', { schema: 'proveedores' })
export class ProviderContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'provider_id', type: 'integer' })
  providerId!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  @Column({ name: 'contact_name', type: 'varchar', length: 255 })
  contactName!: string;

  @Column({ name: 'position', type: 'varchar', length: 100, nullable: true })
  position?: string;

  @Column({ name: 'primary_phone', type: 'varchar', length: 20, nullable: true })
  primaryPhone?: string;

  @Column({ name: 'secondary_phone', type: 'varchar', length: 20, nullable: true })
  secondaryPhone?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'secondary_email', type: 'varchar', length: 255, nullable: true })
  secondaryEmail?: string;

  @Column({ name: 'contact_type', type: 'varchar', length: 50, default: 'general' })
  contactType!: ContactType;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: ContactStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'tenant_id', type: 'integer', default: 1 })
  tenantId!: number;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
