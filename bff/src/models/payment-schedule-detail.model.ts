import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentSchedule } from './payment-schedule.model';

@Entity('detalle_programacion_pago', { schema: 'administracion' })
export class PaymentScheduleDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'programacion_pago_id', type: 'integer' })
  paymentScheduleId!: number;

  @ManyToOne(() => PaymentSchedule, (schedule) => schedule.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programacion_pago_id' })
  paymentSchedule!: PaymentSchedule;

  @Column({ name: 'valorizacion_id', type: 'integer', nullable: true })
  valuationId?: number;

  @Column({ name: 'concepto', type: 'varchar', length: 255, nullable: true })
  concepto?: string;

  @Column({ name: 'monto', type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountToPay?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
