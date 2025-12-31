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
import { User } from './user.model';
import { Project } from './project.model';

@Entity('programa_mantenimiento', { schema: 'equipo' })
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'equipment_id', type: 'uuid' })
  equipmentId!: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;

  @Column({ name: 'maintenance_type', length: 50 })
  maintenanceType!: string; // 'preventive' | 'corrective' | 'predictive'

  @Column({ name: 'interval_type', length: 20 })
  intervalType!: string; // 'hours' | 'days' | 'weeks' | 'months'

  @Column({ name: 'interval_value', type: 'integer' })
  intervalValue!: number;

  @Column({ name: 'last_completed_date', type: 'timestamp', nullable: true })
  lastCompletedDate?: Date;

  @Column({ name: 'last_completed_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  lastCompletedHours?: number;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: Date;

  @Column({ name: 'next_due_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  nextDueHours?: number;

  @Column({ length: 20, default: 'active' })
  status!: string; // 'active' | 'paused' | 'completed' | 'cancelled'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'auto_generate_tasks', default: true })
  autoGenerateTasks!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
