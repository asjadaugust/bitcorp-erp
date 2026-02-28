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

@Entity('parte_diario_demora_mecanica', { schema: 'equipo' })
@Unique(['parteDiarioId', 'codigo'])
export class DailyReportMechanicalDelay {
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

  @Column({ name: 'resuelta', type: 'boolean', default: false })
  resuelta!: boolean;

  @Column({ name: 'fecha_resolucion', type: 'date', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'observacion_resolucion', type: 'text', nullable: true })
  observacionResolucion?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
