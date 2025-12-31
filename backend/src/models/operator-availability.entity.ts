import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Operator } from './operator.entity';
import { Project } from './project.model';

@Entity('operator_availability')
export class OperatorAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'operator_id' })
  operator_id!: number;

  @Column({ name: 'project_id', nullable: true })
  project_id?: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 20 })
  status!: string; // 'available', 'assigned', 'unavailable', 'on_leave'

  @Column({ type: 'time', nullable: true })
  available_from?: string;

  @Column({ type: 'time', nullable: true })
  available_until?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at?: Date;

  // Relations
  @ManyToOne(() => Operator, operator => operator.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator?: Operator;

  @ManyToOne(() => Project, project => project.id)
  @JoinColumn({ name: 'project_id' })
  project?: Project;
}
