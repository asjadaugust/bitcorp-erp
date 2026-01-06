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

export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
export type EstadoMantenimiento =
  | 'PROGRAMADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'PENDIENTE';

@Entity('programa_mantenimiento', { schema: 'equipo' })
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @Column({ name: 'tipo_mantenimiento', type: 'varchar', length: 50 })
  tipoMantenimiento!: TipoMantenimiento;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'fecha_programada', type: 'date', nullable: true })
  fechaProgramada?: Date;

  @Column({ name: 'fecha_realizada', type: 'date', nullable: true })
  fechaRealizada?: Date;

  @Column({ name: 'costo_estimado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costoEstimado?: number;

  @Column({ name: 'costo_real', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costoReal?: number;

  @Column({ name: 'tecnico_responsable', type: 'varchar', length: 100, nullable: true })
  tecnicoResponsable?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PROGRAMADO' })
  estado!: EstadoMantenimiento;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
