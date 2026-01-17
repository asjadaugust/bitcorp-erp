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

export type AccountType = 'savings' | 'checking' | 'business';
export type FinancialStatus = 'active' | 'inactive';
export type Currency = 'PEN' | 'USD' | 'EUR';

@Entity('provider_financial_info', { schema: 'proveedores' })
export class ProviderFinancialInfo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'provider_id', type: 'integer' })
  providerId!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  @Column({ name: 'bank_name', type: 'varchar', length: 255 })
  bankName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber!: string;

  @Column({ name: 'cci', type: 'varchar', length: 50, nullable: true })
  cci?: string;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 255, nullable: true })
  accountHolderName?: string;

  @Column({ name: 'account_type', type: 'varchar', length: 50, nullable: true })
  accountType?: AccountType;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'PEN' })
  currency!: Currency;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: FinancialStatus;

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
