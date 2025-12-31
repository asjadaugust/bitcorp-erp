import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChecklistTemplate, ChecklistItem, ChecklistType } from './checklist-template.model';

export enum ChecklistStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  WARNING = 'warning',
  FAILED = 'failed',
}

export interface ChecklistPhoto {
  url: string;
  description?: string;
  timestamp: string;
}

@Entity('equipment_checklists')
export class EquipmentChecklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  template_id?: string;

  @ManyToOne(() => ChecklistTemplate)
  @JoinColumn({ name: 'template_id' })
  template?: ChecklistTemplate;

  @Column({ type: 'uuid' })
  equipment_id!: string;

  @Column({ type: 'uuid', nullable: true })
  operator_id?: string;

  @Column({ type: 'uuid', nullable: true })
  daily_report_id?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  checklist_date!: Date;

  @Column({ type: 'varchar', length: 50 })
  checklist_type!: ChecklistType;

  @Column({ type: 'jsonb', default: [] })
  items!: ChecklistItem[];

  @Column({
    type: 'varchar',
    length: 20,
    enum: ChecklistStatus,
    default: ChecklistStatus.PENDING,
  })
  overall_status!: ChecklistStatus;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ type: 'jsonb', default: [] })
  photos!: ChecklistPhoto[];

  @Column({ type: 'uuid', nullable: true })
  signed_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature_url?: string;

  @Column({ type: 'uuid' })
  company_id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // Virtual property to calculate completion percentage
  get completion_percentage(): number {
    if (!this.items || this.items.length === 0) return 0;
    const answered = this.items.filter(item => item.response).length;
    return Math.round((answered / this.items.length) * 100);
  }

  // Virtual property to check if checklist is complete
  get is_complete(): boolean {
    if (!this.items || this.items.length === 0) return false;
    return this.items.every(item => !item.required || item.response);
  }

  // Calculate status based on items
  calculateStatus(): ChecklistStatus {
    if (!this.items || this.items.length === 0) return ChecklistStatus.PENDING;

    const hasFailedRequired = this.items.some(
      item => item.required && item.response === 'not_ok'
    );
    
    const hasFailedOptional = this.items.some(
      item => !item.required && item.response === 'not_ok'
    );

    if (hasFailedRequired) return ChecklistStatus.FAILED;
    if (hasFailedOptional) return ChecklistStatus.WARNING;
    if (this.is_complete) return ChecklistStatus.PASSED;
    
    return ChecklistStatus.PENDING;
  }
}
