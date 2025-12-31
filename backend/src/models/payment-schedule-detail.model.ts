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

  @Column({ type: 'integer' })
  payment_schedule_id!: number;

  @ManyToOne(() => PaymentSchedule, (schedule) => schedule.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_schedule_id' })
  payment_schedule!: PaymentSchedule;

  @Column({ type: 'integer' })
  accounts_payable_id!: number;

  @ManyToOne(() => AccountsPayable, { eager: true })
  @JoinColumn({ name: 'accounts_payable_id' })
  accounts_payable!: AccountsPayable;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount_to_pay!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
