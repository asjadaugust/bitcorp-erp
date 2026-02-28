import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';

@Entity('licitaciones') // In public schema as per 001_init_schema.sql
export class Licitacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  @Index('idx_licitaciones_codigo')
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ name: 'entidad_convocante', type: 'varchar', length: 255, nullable: true })
  entidadConvocante?: string;

  @Column({ name: 'monto_referencial', type: 'decimal', precision: 15, scale: 2, nullable: true })
  montoReferencial?: number;

  @Column({ name: 'fecha_convocatoria', type: 'date', nullable: true })
  fechaConvocatoria?: Date;

  @Column({ name: 'fecha_presentacion', type: 'date', nullable: true })
  fechaPresentacion?: Date;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PUBLICADO' })
  @Index('idx_licitaciones_estado')
  estado!: EstadoLicitacion;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Keep old name for backward compatibility
export { Licitacion as Tender };
