import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';
import { Contract } from './contract.model';

export type EstadoPeriodoInoperatividad = 'ACTIVO' | 'RESUELTO' | 'PENALIZADO';

@Entity('periodo_inoperatividad', { schema: 'equipo' })
@Index('idx_periodo_inoperatividad_equipo', ['equipoId'])
@Index('idx_periodo_inoperatividad_estado', ['estado'])
export class PeriodoInoperatividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @Column({ name: 'contrato_id', type: 'integer', nullable: true })
  contratoId?: number;

  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @Column({ name: 'dias_inoperativo', type: 'integer', default: 0 })
  diasInoperativo!: number;

  @Column({ name: 'motivo', type: 'text' })
  motivo!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'ACTIVO' })
  estado!: EstadoPeriodoInoperatividad;

  @Column({ name: 'excede_plazo', type: 'boolean', default: false })
  excedePlazo!: boolean;

  @Column({ name: 'dias_plazo', type: 'integer', default: 5 })
  diasPlazo!: number;

  @Column({ name: 'penalidad_aplicada', type: 'boolean', default: false })
  penalidadAplicada!: boolean;

  @Column({ name: 'monto_penalidad', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoPenalidad?: number;

  @Column({ name: 'observaciones_penalidad', type: 'text', nullable: true })
  observacionesPenalidad?: string;

  @Column({ name: 'resuelto_por', type: 'integer', nullable: true })
  resueltoPor?: number;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
