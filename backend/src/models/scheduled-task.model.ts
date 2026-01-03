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

  @Column({ name: 'programa_id', nullable: true })
  scheduleId?: number;

  @ManyToOne(() => MaintenanceSchedule, { nullable: true })
  @JoinColumn({ name: 'programa_id' })
  schedule?: MaintenanceSchedule;

  @Column({ name: 'equipo_id' })
  equipmentId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipment!: Equipment;

  @Column({ name: 'trabajador_id', nullable: true })
  operatorId?: number;

  @Column({ name: 'tipo_tarea', length: 50, default: 'maintenance' })
  taskType!: string; // 'maintenance' | 'assignment' | 'inspection'

  @Column({ name: 'titulo', length: 255 })
  title!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  startDate!: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  startTime?: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  endTime?: string;

  @Column({ name: 'todo_el_dia', type: 'boolean', default: false })
  allDay?: boolean;

  @Column({ name: 'recurrencia', length: 50, nullable: true })
  recurrence?: string;

  @Column({ name: 'duracion_minutos', type: 'integer', default: 120 })
  durationMinutes!: number;

  @Column({ name: 'prioridad', length: 20, default: 'medium' })
  priority!: string; // 'low' | 'medium' | 'high' | 'urgent'

  @Column({ name: 'estado', length: 20, default: 'pending' })
  status!: string; // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'

  @Column({ name: 'fecha_completacion', type: 'timestamp', nullable: true })
  completionDate?: Date;

  @Column({ name: 'notas_completacion', type: 'text', nullable: true })
  completionNotes?: string;

  @Column({ name: 'registro_mantenimiento_id', nullable: true })
  maintenanceRecordId?: number;

  @Column({ name: 'creado_por', nullable: true })
  createdBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creator?: User;

  @Column({ name: 'asignado_por', nullable: true })
  assignedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'asignado_por' })
  assigner?: User;

  @Column({ name: 'proyecto_id', nullable: true })
  projectId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  project?: Project;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
