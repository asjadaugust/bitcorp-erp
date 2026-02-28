import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Timesheet } from './timesheet.model';
import { Project } from './project.model';

@Entity('detalle_tareo', { schema: 'rrhh' })
export class TimesheetDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tareo_id', type: 'integer' })
  tareoId!: number;

  @ManyToOne(() => Timesheet)
  @JoinColumn({ name: 'tareo_id' })
  tareo?: Timesheet;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: Project;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 5, scale: 2, nullable: true })
  horasTrabajadas?: number;

  @Column({ name: 'tarifa_hora', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tarifaHora?: number;

  @Column({ name: 'monto', type: 'decimal', precision: 12, scale: 2, nullable: true })
  monto?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
