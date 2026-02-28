import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { DailyReport } from './daily-report-typeorm.model';

@Entity('parte_diario_otro_evento', { schema: 'equipo' })
@Unique(['parteDiarioId', 'codigo'])
export class DailyReportOtherEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parte_diario_id', type: 'integer' })
  parteDiarioId!: number;

  @ManyToOne(() => DailyReport)
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario?: DailyReport;

  @Column({ type: 'varchar', length: 10 })
  codigo!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
