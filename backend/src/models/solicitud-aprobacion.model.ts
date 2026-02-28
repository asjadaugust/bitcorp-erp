import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { PasoSolicitud } from './paso-solicitud.model';
import { ModuleName } from './plantilla-aprobacion.model';

export type EstadoSolicitud = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';

@Entity('solicitud_aprobacion', { schema: 'aprobaciones' })
export class SolicitudAprobacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'plantilla_id', type: 'integer', nullable: true })
  plantillaId?: number;

  @Column({ name: 'plantilla_version', type: 'integer', nullable: true })
  plantillaVersion?: number;

  @Column({ name: 'module_name', type: 'varchar', length: 50 })
  moduleName: ModuleName;

  @Column({ name: 'entity_id', type: 'integer' })
  entityId: number;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @Column({ name: 'usuario_solicitante_id', type: 'integer' })
  usuarioSolicitanteId: number;

  @Column({ name: 'titulo', type: 'varchar', length: 400 })
  titulo: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: EstadoSolicitud;

  @Column({ name: 'paso_actual', type: 'integer', default: 1 })
  pasoActual: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado?: Date;

  @Column({ name: 'completado_por_id', type: 'integer', nullable: true })
  completadoPorId?: number;

  @OneToMany(() => PasoSolicitud, (paso) => paso.solicitud, { eager: false })
  pasos?: PasoSolicitud[];
}
