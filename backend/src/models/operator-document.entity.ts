import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Operator } from './operator.entity';

@Entity('operator_personal_documents')
export class OperatorDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'operator_id' })
  operator_id!: number;

  @Column({ type: 'varchar', length: 100 })
  document_type!: string; // 'dni', 'passport', 'license', 'certificate', etc.

  @Column({ type: 'varchar', length: 100 })
  document_number!: string;

  @Column({ type: 'date', nullable: true })
  issue_date?: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_authority?: string;

  @Column({ type: 'text', nullable: true })
  document_url?: string; // Path to scanned document

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
}
