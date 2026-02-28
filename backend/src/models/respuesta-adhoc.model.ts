import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudAdhoc } from './solicitud-adhoc.model';

export type RespuestaAdhocValor = 'APROBADO' | 'RECHAZADO';

@Entity('respuesta_adhoc', { schema: 'aprobaciones' })
export class RespuestaAdhoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'solicitud_adhoc_id', type: 'integer' })
  solicitudAdhocId: number;

  @ManyToOne(() => SolicitudAdhoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_adhoc_id' })
  solicitudAdhoc?: SolicitudAdhoc;

  @Column({ name: 'aprobador_id', type: 'integer' })
  aprobadorId: number;

  @Column({ name: 'respuesta', type: 'varchar', length: 20 })
  respuesta: RespuestaAdhocValor;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario?: string;

  @CreateDateColumn({ name: 'fecha_respuesta' })
  fechaRespuesta: Date;
}
