import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Equipment } from './equipment.model';
import { Project } from './project.model';

@Entity('equipo_edt', { schema: 'equipo' })
export class EquipmentAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'equipment_id', type: 'integer' })
  equipmentId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;

  @Column({ name: 'project_id', type: 'integer' })
  projectId!: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'fecha_asignacion', type: 'date' })
  fechaAsignacion!: Date;

  @Column({ name: 'fecha_liberacion', type: 'date', nullable: true })
  fechaLiberacion?: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
