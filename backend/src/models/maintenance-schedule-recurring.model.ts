import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';
import { Project } from './project.model';
import { User } from './user.model';

/**
 * Recurring Maintenance Schedule Entity
 * Maps to equipo.maintenance_schedules table
 *
 * This entity represents RECURRING maintenance schedules (e.g., "change oil every 250 hours").
 * For one-time maintenance work orders, use MaintenanceSchedule (programa_mantenimiento).
 */

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'predictive'
  | 'calibration'
  | 'inspection';
export type IntervalType = 'hours' | 'days' | 'weeks' | 'months' | 'kilometers';
export type ScheduleStatus = 'active' | 'inactive' | 'suspended' | 'completed';

@Entity('maintenance_schedules', { schema: 'equipo' })
export class MaintenanceScheduleRecurring {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'equipment_id', type: 'integer' })
  equipmentId!: number;

  @ManyToOne(() => Equipment, { nullable: false })
  @JoinColumn({ name: 'equipment_id' })
  equipment?: Equipment;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'maintenance_type', type: 'varchar', length: 50, default: 'preventive' })
  maintenanceType!: MaintenanceType;

  @Column({ name: 'interval_type', type: 'varchar', length: 20, default: 'hours' })
  intervalType!: IntervalType;

  @Column({ name: 'interval_value', type: 'integer' })
  intervalValue!: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: ScheduleStatus;

  @Column({ name: 'auto_generate_tasks', type: 'boolean', default: true })
  autoGenerateTasks!: boolean;

  @Column({ name: 'last_completed_date', type: 'timestamp', nullable: true })
  lastCompletedDate?: Date;

  @Column({ name: 'last_completed_hours', type: 'integer', nullable: true })
  lastCompletedHours?: number;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: Date;

  @Column({ name: 'next_due_hours', type: 'integer', nullable: true })
  nextDueHours?: number;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdById?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
