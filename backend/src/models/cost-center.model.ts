import { 
  Entity, 
  Column, 
  ManyToOne, 
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('centro_costo', { schema: 'administracion' })
export class CentroCosto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  @Index('idx_centro_costo_codigo')
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  @Index('idx_centro_costo_project')
  projectId?: number;

  @Column({ name: 'presupuesto', type: 'decimal', precision: 15, scale: 2, nullable: true })
  presupuesto?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Backward compatibility alias
export { CentroCosto as CostCenter };
