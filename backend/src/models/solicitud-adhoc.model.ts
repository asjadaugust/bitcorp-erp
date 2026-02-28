import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { LogicaAprobacion } from './plantilla-paso.model';
import { EstadoSolicitud } from './solicitud-aprobacion.model';

@Entity('solicitud_adhoc', { schema: 'aprobaciones' })
export class SolicitudAdhoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'usuario_solicitante_id', type: 'integer' })
  usuarioSolicitanteId: number;

  @Column({ name: 'titulo', type: 'varchar', length: 400 })
  titulo: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'aprobadores', type: 'jsonb', default: '[]' })
  aprobadores: number[];

  @Column({ name: 'usuarios_cc', type: 'jsonb', default: '[]' })
  usuariosCc: number[];

  @Column({ name: 'logica_aprobacion', type: 'varchar', length: 30, default: 'ALL_MUST_APPROVE' })
  logicaAprobacion: LogicaAprobacion;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: EstadoSolicitud;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado?: Date;

  @Column({ name: 'archivos_adjuntos', type: 'jsonb', nullable: true })
  archivosAdjuntos?: Record<string, unknown>;
}
