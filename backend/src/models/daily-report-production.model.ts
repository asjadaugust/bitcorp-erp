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

@Entity('parte_diario_produccion', { schema: 'equipo' })
@Unique(['parteDiarioId', 'numero'])
export class DailyReportProduction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parte_diario_id', type: 'integer' })
  parteDiarioId!: number;

  @ManyToOne(() => DailyReport)
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario?: DailyReport;

  @Column({ type: 'smallint' })
  numero!: number;

  @Column({ name: 'ubicacion_labores_prog_ini', type: 'varchar', length: 100, nullable: true })
  ubicacionLaboresProgIni?: string;

  @Column({ name: 'ubicacion_labores_prog_fin', type: 'varchar', length: 100, nullable: true })
  ubicacionLaboresProgFin?: string;

  @Column({ name: 'hora_ini', type: 'time', nullable: true })
  horaIni?: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin?: string;

  @Column({ name: 'material_trabajado_descripcion', type: 'text', nullable: true })
  materialTrabajadoDescripcion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  metrado?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  edt?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
