import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChecklistItem } from './checklist-item.model';
import { User } from './user.model';

export type FrecuenciaChecklist = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANTES_USO';

@Entity('checklist_plantilla', { schema: 'equipo' })
export class ChecklistPlantilla {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ name: 'tipo_equipo', type: 'varchar', length: 100, nullable: true })
  tipoEquipo?: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'frecuencia', type: 'varchar', length: 50, nullable: true })
  frecuencia?: FrecuenciaChecklist;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ChecklistItem, (item) => item.plantillaId)
  items?: ChecklistItem[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;
}

// Export with English alias for compatibility
export { ChecklistPlantilla as ChecklistTemplate };
