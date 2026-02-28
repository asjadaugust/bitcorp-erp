import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyReport } from './daily-report-typeorm.model';

@Entity('parte_diario_foto', { schema: 'equipo' })
export class DailyReportPhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parte_diario_id' })
  parteDiarioId!: number;

  @ManyToOne(() => DailyReport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario?: DailyReport;

  @Column()
  filename!: string;

  @Column({ name: 'original_name', nullable: true })
  originalName?: string;

  @Column({ name: 'mime_type', default: 'image/jpeg' })
  mimeType?: string;

  @Column({ nullable: true })
  size?: number;

  @Column({ default: 0 })
  orden?: number;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
