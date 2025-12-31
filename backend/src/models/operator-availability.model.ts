import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.model';
import { Project } from './project.model';

@Entity('disponibilidad_trabajador', { schema: 'rrhh' })
export class OperatorAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'operator_id' })
  operatorId!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'start_time', type: 'time', default: '08:00:00' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time', default: '17:00:00' })
  endTime!: string;

  @Column({ name: 'availability_type', length: 20, default: 'available' })
  availabilityType!: string; // 'available' | 'unavailable' | 'leave' | 'sick' | 'holiday' | 'partial'

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

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
