import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentScheduleDetail } from './payment-schedule-detail.model';

export enum PaymentScheduleStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

@Entity('programacion_pago', { schema: 'administracion' })
export class PaymentSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'proveedor_id', type: 'integer' })
  provider_id!: number;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  project_id?: number;

  @Column({ name: 'periodo', type: 'varchar', length: 7 })
  periodo!: string;

  @Column({ name: 'fecha_programada', type: 'date', nullable: true })
  schedule_date?: Date;

  @Column({ name: 'monto_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_amount?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PROGRAMADO' })
  status!: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @OneToMany(() => PaymentScheduleDetail, (detail) => detail.payment_schedule)
  details!: PaymentScheduleDetail[];
}
