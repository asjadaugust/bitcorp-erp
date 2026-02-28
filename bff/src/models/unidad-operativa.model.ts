import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('unidad_operativa', { schema: 'sistema' })
export class UnidadOperativa {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'ubicacion', type: 'varchar', length: 255, nullable: true })
  ubicacion?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
