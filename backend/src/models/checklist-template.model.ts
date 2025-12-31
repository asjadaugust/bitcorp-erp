import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { EquipmentChecklist } from './equipment-checklist.model';

export enum ChecklistType {
  PRE_USO = 'pre_uso',
  INSPECCION = 'inspeccion',
  INGRESO = 'ingreso',
}

export enum ChecklistItemType {
  OK_NOT_OK = 'ok_not_ok',
  TEXT = 'text',
  NUMERIC = 'numeric',
  PHOTO_REQUIRED = 'photo_required',
}

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  type: ChecklistItemType;
  required: boolean;
  order: number;
  unit?: string; // For numeric types
  response?: string; // Filled during inspection
  notes?: string; // Operator notes
  photo_url?: string; // If photo required
}

@Entity('equipment_checklist_templates')
export class ChecklistTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: ChecklistType,
  })
  checklist_type!: ChecklistType;

  @Column({ type: 'uuid', nullable: true })
  equipment_category_id?: string;

  @Column({ type: 'varchar', length: 255 })
  template_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  items!: ChecklistItem[];

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'uuid' })
  company_id!: string;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @OneToMany(() => EquipmentChecklist, (checklist) => checklist.template)
  checklists?: EquipmentChecklist[];
}
