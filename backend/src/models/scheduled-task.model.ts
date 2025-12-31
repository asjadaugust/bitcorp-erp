import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MaintenanceSchedule } from './maintenance-schedule.model';
import { Equipment } from './equipment.model';
import { User } from './user.model';
import { Project } from './project.model';

@Entity('tarea_programada', { schema: 'equipo' })
export class ScheduledTask {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId?: number;

  @ManyToOne(() => MaintenanceSchedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: MaintenanceSchedule;

  @Column({ name: 'equipment_id' })
  equipmentId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;

  @Column({ name: 'operator_id', nullable: true })
  operatorId?: number;

  @Column({ name: 'task_type', length: 50, default: 'maintenance' })
  taskType!: string; // 'maintenance' | 'assignment' | 'inspection'

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string;

  @Column({ name: 'all_day', type: 'boolean', default: false })
  allDay?: boolean;

  @Column({ name: 'recurrence', length: 50, nullable: true })
  recurrence?: string;

  @Column({ name: 'duration_minutes', type: 'integer', default: 120 })
  durationMinutes!: number;

  @Column({ length: 20, default: 'medium' })
  priority!: string; // 'low' | 'medium' | 'high' | 'urgent'

  @Column({ length: 20, default: 'pending' })
  status!: string; // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'

  @Column({ name: 'completion_date', type: 'timestamp', nullable: true })
  completionDate?: Date;

  @Column({ name: 'completion_notes', type: 'text', nullable: true })
  completionNotes?: string;

  @Column({ name: 'maintenance_record_id', nullable: true })
  maintenanceRecordId?: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assigner?: User;

  @Column({ name: 'project_id', nullable: true })
  projectId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
