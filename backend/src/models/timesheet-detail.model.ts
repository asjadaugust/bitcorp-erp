import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Timesheet } from './timesheet.model';
import { DailyReportModel } from './daily-report.model';
import { Equipment } from './equipment.model';

@Entity('detalle_tareo', { schema: 'rrhh' })
export class TimesheetDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'timesheet_id' })
  timesheetId!: number;

  @ManyToOne(() => Timesheet)
  @JoinColumn({ name: 'timesheet_id' })
  timesheet!: Timesheet;

  @Column({ name: 'daily_report_id', nullable: true })
  dailyReportId?: number;

  @ManyToOne(() => DailyReportModel, { nullable: true })
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport?: DailyReportModel;

  @Column({ name: 'work_date', type: 'date' })
  workDate!: Date;

  @Column({ name: 'hours_worked', type: 'decimal', precision: 10, scale: 2 })
  hoursWorked!: number;

  @Column({ name: 'equipment_id', nullable: true })
  equipmentId?: number;

  @ManyToOne(() => Equipment, { nullable: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment?: Equipment;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
