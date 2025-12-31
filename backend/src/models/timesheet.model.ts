import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OperatorModel } from './operator.model';
import { Project } from './project.model';
import { User } from './user.model';

@Entity('tareo', { schema: 'rrhh' })
export class Timesheet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'timesheet_code', length: 50, unique: true })
  timesheetCode!: string;

  @Column({ name: 'operator_id' })
  operatorId!: number;

  @ManyToOne(() => OperatorModel)
  @JoinColumn({ name: 'operator_id' })
  operator!: OperatorModel;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: Date;

  @Column({ name: 'total_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHours!: number;

  @Column({ name: 'total_days', type: 'integer', default: 0 })
  totalDays!: number;

  @Column({ name: 'regular_hours', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  regularHours?: number;

  @Column({ name: 'overtime_hours', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  overtimeHours?: number;

  @Column({ length: 20, default: 'draft' })
  status!: string; // 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'

  @Column({ name: 'generated_from_reports', default: true })
  generatedFromReports!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'submitted_by', nullable: true })
  submittedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submitter?: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'rejected_by', nullable: true })
  rejectedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejector?: User;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  // Details can be loaded separately if needed
  // @OneToMany(() => TimesheetDetail, (detail) => detail.timesheet)
  // details?: TimesheetDetail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
