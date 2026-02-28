import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EstadoActa = 'BORRADOR' | 'PENDIENTE' | 'FIRMADO' | 'ANULADO';
export type TipoActa = 'DEVOLUCION' | 'DESMOBILIZACION' | 'TRANSFERENCIA';
export type CondicionEquipo = 'BUENO' | 'REGULAR' | 'MALO' | 'CON_OBSERVACIONES';

@Entity('acta_devolucion', { schema: 'equipo' })
@Index('idx_acta_devolucion_equipo', ['equipoId'])
@Index('idx_acta_devolucion_estado', ['estado'])
@Index('idx_acta_devolucion_fecha', ['fechaDevolucion'])
export class ActaDevolucion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @Column({ name: 'contrato_id', type: 'integer', nullable: true })
  contratoId?: number;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @Column({ name: 'fecha_devolucion', type: 'date' })
  fechaDevolucion!: Date;

  @Column({ name: 'tipo', type: 'varchar', length: 30, default: 'DEVOLUCION' })
  tipo!: TipoActa;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'BORRADOR' })
  estado!: EstadoActa;

  @Column({ name: 'condicion_equipo', type: 'varchar', length: 20, default: 'BUENO' })
  condicionEquipo!: CondicionEquipo;

  @Column({
    name: 'horometro_devolucion',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  horometroDevolucion?: number;

  @Column({
    name: 'kilometraje_devolucion',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  kilometrajeDevolucion?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'observaciones_fisicas', type: 'text', nullable: true })
  observacionesFisicas?: string;

  @Column({ name: 'recibido_por', type: 'integer', nullable: true })
  recibidoPor?: number;

  @Column({ name: 'entregado_por', type: 'integer', nullable: true })
  entregadoPor?: number;

  @Column({ name: 'firma_recibido', type: 'text', nullable: true })
  firmaRecibido?: string;

  @Column({ name: 'firma_entregado', type: 'text', nullable: true })
  firmaEntregado?: string;

  @Column({ name: 'fecha_firma', type: 'timestamp with time zone', nullable: true })
  fechaFirma?: Date;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
