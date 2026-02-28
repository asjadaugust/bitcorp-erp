import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type AccionAuditoria =
  | 'CREATED'
  | 'STEP_APPROVED'
  | 'STEP_REJECTED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'REBASED'
  | 'CANCELLED';

@Entity('auditoria_aprobacion', { schema: 'aprobaciones' })
export class AuditoriaAprobacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'solicitud_id', type: 'integer', nullable: true })
  solicitudId?: number;

  @Column({ name: 'solicitud_adhoc_id', type: 'integer', nullable: true })
  solicitudAdhocId?: number;

  @Column({ name: 'plantilla_version', type: 'integer', nullable: true })
  plantillaVersion?: number;

  @Column({ name: 'accion', type: 'varchar', length: 30 })
  accion: AccionAuditoria;

  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId: number;

  @Column({ name: 'paso_numero', type: 'integer', nullable: true })
  pasoNumero?: number;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario?: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
