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
import { Project } from './project.model';
import { CostCenter } from './cost-center.model';

export enum AccountsPayableStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial',
}

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  TICKET = 'ticket',
  OTHER = 'other',
}

@Entity('cuenta_por_pagar', { schema: 'administracion' })
export class AccountsPayable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  provider_id!: number;

  @ManyToOne(() => Provider, { nullable: false, eager: true })
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  @Column({ type: 'uuid', nullable: true })
  project_id?: string;

  @ManyToOne(() => Project, { nullable: true, eager: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ type: 'uuid', nullable: true })
  cost_center_id?: string;

  @ManyToOne(() => CostCenter, { nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  cost_center?: CostCenter;

  @Column({ type: 'varchar', length: 50 })
  document_type!: DocumentType;

  @Column({ type: 'varchar', length: 50 })
  document_number!: string;

  @Column({ type: 'date' })
  issue_date!: Date;

  @Column({ type: 'date' })
  due_date!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: AccountsPayableStatus.PENDING,
  })
  status!: AccountsPayableStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer' })
  tenant_id!: number;

  @Column({ type: 'integer', nullable: true })
  created_by?: number;

  @Column({ type: 'integer', nullable: true })
  updated_by?: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
