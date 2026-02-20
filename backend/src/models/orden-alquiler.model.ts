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

import { Provider } from './provider.model';
import { SolicitudEquipo } from './solicitud-equipo.model';
import { Project } from './project.model';
import { Equipment } from './equipment.model';

export type EstadoOrden = 'BORRADOR' | 'ENVIADO' | 'CONFIRMADO' | 'CANCELADO';
export type TipoTarifaOrden = 'HORA' | 'DIA' | 'MES';
export type MonedaOrden = 'PEN' | 'USD';

@Entity('orden_alquiler', { schema: 'equipo' })
@Index('idx_orden_alquiler_proveedor', ['proveedorId'])
@Index('idx_orden_alquiler_estado', ['estado'])
@Index('idx_orden_alquiler_fecha', ['fechaOrden'])
@Index('idx_orden_alquiler_solicitud', ['solicitudEquipoId'])
export class OrdenAlquiler {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ name: 'solicitud_equipo_id', type: 'integer', nullable: true })
  solicitudEquipoId?: number;

  @ManyToOne(() => SolicitudEquipo, { nullable: true })
  @JoinColumn({ name: 'solicitud_equipo_id' })
  solicitudEquipo?: SolicitudEquipo;

  @Column({ name: 'proveedor_id', type: 'integer' })
  proveedorId!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Provider;

  @Column({ name: 'equipo_id', type: 'integer', nullable: true })
  equipoId?: number;

  @ManyToOne(() => Equipment, { nullable: true })
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: Project;

  @Column({ name: 'descripcion_equipo', type: 'varchar', length: 255 })
  descripcionEquipo!: string;

  @Column({ name: 'fecha_orden', type: 'date' })
  fechaOrden!: Date;

  @Column({ name: 'fecha_inicio_estimada', type: 'date', nullable: true })
  fechaInicioEstimada?: Date;

  @Column({ name: 'fecha_fin_estimada', type: 'date', nullable: true })
  fechaFinEstimada?: Date;

  @Column({ name: 'tarifa_acordada', type: 'numeric', precision: 12, scale: 2 })
  tarifaAcordada!: number;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 10, default: 'HORA' })
  tipoTarifa!: TipoTarifaOrden;

  @Column({ name: 'moneda', type: 'varchar', length: 5, default: 'PEN' })
  moneda!: MonedaOrden;

  @Column({ name: 'tipo_cambio', type: 'numeric', precision: 8, scale: 4, nullable: true })
  tipoCambio?: number;

  @Column({ name: 'horas_incluidas', type: 'numeric', precision: 8, scale: 2, nullable: true })
  horasIncluidas?: number;

  @Column({ name: 'penalidad_exceso', type: 'numeric', precision: 10, scale: 2, nullable: true })
  penalidadExceso?: number;

  @Column({ name: 'condiciones_especiales', type: 'text', nullable: true })
  condicionesEspeciales?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'BORRADOR' })
  estado!: EstadoOrden;

  @Column({ name: 'enviado_a', type: 'varchar', length: 255, nullable: true })
  enviadoA?: string;

  @Column({ name: 'fecha_envio', type: 'timestamp with time zone', nullable: true })
  fechaEnvio?: Date;

  @Column({ name: 'confirmado_por', type: 'varchar', length: 255, nullable: true })
  confirmadoPor?: string;

  @Column({ name: 'fecha_confirmacion', type: 'timestamp with time zone', nullable: true })
  fechaConfirmacion?: Date;

  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion?: string;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
