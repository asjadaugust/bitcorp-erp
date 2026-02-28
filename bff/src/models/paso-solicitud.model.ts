import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudAprobacion } from './solicitud-aprobacion.model';

export type EstadoPaso = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OMITIDO';

@Entity('paso_solicitud', { schema: 'aprobaciones' })
export class PasoSolicitud {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'solicitud_id', type: 'integer' })
  solicitudId: number;

  @ManyToOne(() => SolicitudAprobacion, (s) => s.pasos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud?: SolicitudAprobacion;

  @Column({ name: 'paso_numero', type: 'integer' })
  pasoNumero: number;

  @Column({ name: 'aprobador_id', type: 'integer', nullable: true })
  aprobadorId?: number;

  @Column({ name: 'estado_paso', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estadoPaso: EstadoPaso;

  @Column({ name: 'accion_fecha', type: 'timestamp', nullable: true })
  accionFecha?: Date;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario?: string;
}
