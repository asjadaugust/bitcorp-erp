import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentSchedule } from './payment-schedule.model';
import { AccountsPayable } from './accounts-payable.model';

@Entity('detalle_programacion_pago', { schema: 'administracion' })
export class PaymentScheduleDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'programacion_pago_id', type: 'integer' })
  payment_schedule_id!: number;

  @ManyToOne(() => PaymentSchedule, (schedule) => schedule.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programacion_pago_id' })
  payment_schedule!: PaymentSchedule;

  @Column({ name: 'valorizacion_id', type: 'integer', nullable: true })
  valuation_id?: number;

  @Column({ name: 'concepto', type: 'varchar', length: 255, nullable: true })
  concepto?: string;

  @Column({ name: 'monto', type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_to_pay?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
