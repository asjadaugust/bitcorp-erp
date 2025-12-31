import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './project.model';
import { User } from './user.model';

export type EstadoValorizacion = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PAGADO';

@Entity('valorizacion_equipo', { schema: 'equipo' })
export class Valorizacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'equipment_id', type: 'integer' })
  @Index('idx_valorizacion_equipo_equipment')
  equipmentId!: number;

  @Column({ name: 'contract_id', type: 'integer', nullable: true })
  @Index('idx_valorizacion_equipo_contract')
  contractId?: number;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  @Index('idx_valorizacion_equipo_project')
  projectId?: number;

  @Column({ name: 'periodo', type: 'varchar', length: 7 })
  @Index('idx_valorizacion_equipo_periodo')
  periodo!: string; // Format: 'YYYY-MM'

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: Date;

  @Column({ name: 'dias_trabajados', type: 'integer', nullable: true })
  diasTrabajados?: number;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horasTrabajadas?: number;

  @Column({ name: 'combustible_consumido', type: 'decimal', precision: 10, scale: 2, nullable: true })
  combustibleConsumido?: number;

  @Column({ name: 'costo_base', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costoBase?: number;

  @Column({ name: 'costo_combustible', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costoCombustible?: number;

  @Column({ name: 'cargos_adicionales', type: 'decimal', precision: 15, scale: 2, nullable: true })
  cargosAdicionales?: number;

  @Column({ name: 'total_valorizado', type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalValorizado?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PENDIENTE' })
  @Index('idx_valorizacion_equipo_estado')
  estado!: EstadoValorizacion;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy?: number;

  @Column({ name: 'approved_by', type: 'integer', nullable: true })
  approvedBy?: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User;
}

// Keep the old class for backward compatibility during migration
export { Valorizacion as Valuation };
