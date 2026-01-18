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
import { User } from './user.model';

export type EstadoValorizacion = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'PAGADO';

@Entity('valorizacion_equipo', { schema: 'equipo' })
export class Valorizacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'equipo_id', type: 'integer' })
  @Index('idx_valorizacion_equipo_equipo')
  equipmentId!: number;

  @Column({ name: 'contrato_id', type: 'integer', nullable: true })
  @Index('idx_valorizacion_equipo_contrato')
  contractId?: number;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  @Index('idx_valorizacion_equipo_proyecto')
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

  @Column({
    name: 'combustible_consumido',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  combustibleConsumido?: number;

  @Column({ name: 'costo_base', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costoBase?: number;

  @Column({ name: 'costo_combustible', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costoCombustible?: number;

  @Column({ name: 'cargos_adicionales', type: 'decimal', precision: 15, scale: 2, nullable: true })
  cargosAdicionales?: number;

  @Column({ name: 'total_valorizado', type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalValorizado?: number;

  @Column({ name: 'numero_valorizacion', type: 'varchar', length: 20, nullable: true })
  @Index('idx_valorizacion_equipo_numero')
  numeroValorizacion?: string;

  @Column({ name: 'tipo_cambio', type: 'decimal', precision: 10, scale: 4, nullable: true })
  tipoCambio?: number;

  @Column({ name: 'descuento_porcentaje', type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  descuentoPorcentaje?: number;

  @Column({ name: 'descuento_monto', type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  descuentoMonto?: number;

  @Column({ name: 'igv_porcentaje', type: 'decimal', precision: 5, scale: 2, default: 18.0 })
  igvPorcentaje?: number;

  @Column({ name: 'igv_monto', type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  igvMonto?: number;

  @Column({ name: 'total_con_igv', type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  totalConIgv?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PENDIENTE' })
  @Index('idx_valorizacion_equipo_estado')
  estado!: EstadoValorizacion;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  createdBy?: number;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  approvedBy?: number;

  @Column({ name: 'aprobado_en', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'fecha_pago', type: 'date', nullable: true })
  fechaPago?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por' })
  approver?: User;
}

// Keep the old class for backward compatibility during migration
export { Valorizacion as Valuation };
