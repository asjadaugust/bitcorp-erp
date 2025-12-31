import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SigCategory {
  QUALITY = 'Quality',
  ENVIRONMENT = 'Environment',
  SAFETY = 'Safety'
}

@Entity('documento_sig', { schema: 'public' })
export class SigDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_number' })
  documentNumber: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'document_type', nullable: true })
  documentType: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: '1.0' })
  version: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ name: 'effective_date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
