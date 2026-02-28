import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EstadoSolicitud = 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';
export type PrioridadSolicitud = 'BAJA' | 'MEDIA' | 'ALTA';

@Entity('solicitud_equipo', { schema: 'equipo' })
@Index('idx_solicitud_equipo_estado', ['estado'])
@Index('idx_solicitud_equipo_proyecto', ['proyectoId'])
export class SolicitudEquipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @Column({ name: 'tipo_equipo', type: 'varchar', length: 150 })
  tipoEquipo!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'cantidad', type: 'integer', default: 1 })
  cantidad!: number;

  @Column({ name: 'fecha_requerida', type: 'date' })
  fechaRequerida!: Date;

  @Column({ name: 'justificacion', type: 'text', nullable: true })
  justificacion?: string;

  @Column({ name: 'prioridad', type: 'varchar', length: 10, default: 'MEDIA' })
  prioridad!: PrioridadSolicitud;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'BORRADOR' })
  estado!: EstadoSolicitud;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  aprobadoPor?: number;

  @Column({ name: 'fecha_aprobacion', type: 'timestamp with time zone', nullable: true })
  fechaAprobacion?: Date;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'solicitud_aprobacion_id', type: 'integer', nullable: true })
  solicitudAprobacionId?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
