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

  @Column({ type: 'integer', name: 'provider_id' })
  provider_id!: number;

  @ManyToOne(() => Provider, { nullable: false, eager: true })
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  @Column({ type: 'varchar', length: 50, name: 'numero_factura' })
  document_number!: string;

  @Column({ type: 'date', name: 'fecha_emision' })
  issue_date!: Date;

  @Column({ type: 'date', name: 'fecha_vencimiento' })
  due_date!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_total' })
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'monto_pagado' })
  amount_paid!: number;

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

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updated_at!: Date;
}
