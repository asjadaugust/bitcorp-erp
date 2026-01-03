import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.model';

export type EstadoProyecto = 'PLANIFICACION' | 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';

@Entity('edt', { schema: 'proyectos' })
export class Proyecto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  @Index('idx_edt_codigo')
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'ubicacion', type: 'varchar', length: 255, nullable: true })
  ubicacion?: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio?: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @Column({ name: 'presupuesto', type: 'decimal', precision: 15, scale: 2, nullable: true })
  presupuesto?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'PLANIFICACION' })
  @Index('idx_edt_estado')
  estado!: EstadoProyecto;

  @Column({ name: 'empresa_id', type: 'integer', nullable: true })
  @Index('idx_edt_company')
  companyId?: number;

  @Column({ name: 'unidad_operativa_id', type: 'integer', nullable: true })
  @Index('idx_edt_unidad_operativa')
  operatingUnitId?: number;

  @Column({ name: 'cliente', type: 'varchar', length: 255, nullable: true })
  cliente?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  createdBy?: number;

  @Column({ name: 'actualizado_por', type: 'integer', nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actualizado_por' })
  updater?: User;

  @ManyToMany(() => User, (user) => user.projects)
  users?: User[];
}

// Backward compatibility alias
export { Proyecto as Project };
