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
import { OrdenAlquiler } from './orden-alquiler.model';

export type EstadoCotizacion = 'REGISTRADA' | 'EVALUADA' | 'SELECCIONADA' | 'RECHAZADA';
export type TipoTarifaCotizacion = 'HORA' | 'DIA' | 'MES';
export type MonedaCotizacion = 'PEN' | 'USD';

@Entity('cotizacion_proveedor', { schema: 'equipo' })
@Index('idx_cotizacion_solicitud', ['solicitudEquipoId'])
@Index('idx_cotizacion_proveedor', ['proveedorId'])
@Index('idx_cotizacion_estado', ['estado'])
export class CotizacionProveedor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ name: 'solicitud_equipo_id', type: 'integer' })
  solicitudEquipoId!: number;

  @ManyToOne(() => SolicitudEquipo)
  @JoinColumn({ name: 'solicitud_equipo_id' })
  solicitudEquipo?: SolicitudEquipo;

  @Column({ name: 'proveedor_id', type: 'integer' })
  proveedorId!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Provider;

  @Column({ name: 'descripcion_equipo', type: 'varchar', length: 255, nullable: true })
  descripcionEquipo?: string;

  @Column({ name: 'tarifa_propuesta', type: 'numeric', precision: 12, scale: 2 })
  tarifaPropuesta!: number;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 10, default: 'HORA' })
  tipoTarifa!: TipoTarifaCotizacion;

  @Column({ name: 'moneda', type: 'varchar', length: 5, default: 'PEN' })
  moneda!: MonedaCotizacion;

  @Column({ name: 'horas_incluidas', type: 'numeric', precision: 8, scale: 2, nullable: true })
  horasIncluidas?: number;

  @Column({ name: 'penalidad_exceso', type: 'numeric', precision: 10, scale: 2, nullable: true })
  penalidadExceso?: number;

  @Column({ name: 'plazo_entrega_dias', type: 'integer', nullable: true })
  plazoEntregaDias?: number;

  @Column({ name: 'condiciones_pago', type: 'text', nullable: true })
  condicionesPago?: string;

  @Column({ name: 'condiciones_especiales', type: 'text', nullable: true })
  condicionesEspeciales?: string;

  @Column({ name: 'garantia', type: 'text', nullable: true })
  garantia?: string;

  @Column({ name: 'disponibilidad', type: 'varchar', length: 50, nullable: true })
  disponibilidad?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'puntaje', type: 'integer', nullable: true })
  puntaje?: number;

  @Column({ name: 'motivo_seleccion', type: 'text', nullable: true })
  motivoSeleccion?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'REGISTRADA' })
  estado!: EstadoCotizacion;

  @Column({ name: 'evaluado_por', type: 'integer', nullable: true })
  evaluadoPor?: number;

  @Column({ name: 'fecha_evaluacion', type: 'timestamp', nullable: true })
  fechaEvaluacion?: Date;

  @Column({ name: 'orden_alquiler_id', type: 'integer', nullable: true })
  ordenAlquilerId?: number;

  @ManyToOne(() => OrdenAlquiler, { nullable: true })
  @JoinColumn({ name: 'orden_alquiler_id' })
  ordenAlquiler?: OrdenAlquiler;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
