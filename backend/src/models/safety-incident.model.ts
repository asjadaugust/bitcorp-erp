import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.model';

export type EstadoIncidente = 'ABIERTO' | 'EN_INVESTIGACION' | 'CERRADO';
export type SeveridadIncidente = 'LEVE' | 'MODERADO' | 'GRAVE' | 'MUY_GRAVE';

@Entity('incidente', { schema: 'sst' })
export class Incidente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'fecha_incidente', type: 'timestamp' })
  @Index('idx_incidente_fecha')
  fechaIncidente!: Date;

  @Column({ name: 'tipo_incidente', type: 'varchar', length: 100, nullable: true })
  @Index('idx_incidente_tipo')
  tipoIncidente?: string;

  @Column({ name: 'severidad', type: 'varchar', length: 50, nullable: true })
  severidad?: SeveridadIncidente;

  @Column({ name: 'ubicacion', type: 'text', nullable: true })
  ubicacion?: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'acciones_tomadas', type: 'text', nullable: true })
  accionesTomadas?: string;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  @Index('idx_incidente_proyecto')
  proyectoId?: number;

  @Column({ name: 'reportado_por', type: 'integer', nullable: true })
  reportadoPor?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'ABIERTO' })
  @Index('idx_incidente_estado')
  estado!: EstadoIncidente;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reportado_por' })
  reportador?: User;
}

// Keep old name for backward compatibility
export { Incidente as SafetyIncident };
