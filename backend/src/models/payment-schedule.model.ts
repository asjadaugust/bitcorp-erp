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

  @Column({ type: 'date' })
  schedule_date!: Date;

  @Column({ type: 'date' })
  payment_date!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PaymentScheduleStatus.DRAFT,
  })
  status!: PaymentScheduleStatus;

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

  @OneToMany(() => PaymentScheduleDetail, (detail) => detail.payment_schedule)
  details!: PaymentScheduleDetail[];
}
