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

export enum AccountsPayableStatus {
  PENDING = 'PENDIENTE',
  PAID = 'PAGADO',
  CANCELLED = 'ANULADO',
  PARTIAL = 'PARCIAL',
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

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ type: 'integer', name: 'proveedor_id' })
  providerId!: number;

  @ManyToOne(() => Provider, { nullable: false, eager: true })
  @JoinColumn({ name: 'proveedor_id' })
  provider!: Provider;

  @Column({ type: 'varchar', length: 50, name: 'numero_factura' })
  documentNumber!: string;

  @Column({ type: 'date', name: 'fecha_emision' })
  issueDate!: Date;

  @Column({ type: 'date', name: 'fecha_vencimiento' })
  dueDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_total' })
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'monto_pagado' })
  amountPaid!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'saldo' })
  balance?: number;

  @Column({ type: 'varchar', length: 3, default: 'PEN', name: 'moneda' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AccountsPayableStatus.PENDING,
    name: 'estado',
  })
  status!: AccountsPayableStatus;

  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  description?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;
}
