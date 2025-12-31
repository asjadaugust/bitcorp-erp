import { 
  Entity, 
  Column, 
  ManyToOne, 
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn 
} from 'typeorm';
import { Equipment } from './equipment.model';
// import { Operator } from './operator.model';  // TODO: Convert to TypeORM entity
import { Project } from './project.model';

@Entity('daily_reports')
export class DailyReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'equipment_id', type: 'integer', nullable: true })
  equipment_id?: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment?: Equipment;

  @Column({ name: 'operator_id', type: 'integer', nullable: true })
  operator_id?: number;

  // TODO: Uncomment when Operator is converted to TypeORM entity
  // @ManyToOne(() => Operator)
  // @JoinColumn({ name: 'operator_id' })
  // operator?: Operator;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  project_id?: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'fecha_reporte', type: 'date' })
  fecha_reporte!: Date;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  hora_inicio?: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  hora_fin?: string;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 5, scale: 2, nullable: true })
  horas_trabajadas?: number;

  @Column({ name: 'horometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horometro_inicial?: number;

  @Column({ name: 'horometro_final', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horometro_final?: number;

  @Column({ name: 'odometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometro_inicial?: number;

  @Column({ name: 'odometro_final', type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometro_final?: number;

  @Column({ name: 'combustible_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  combustible_inicial?: number;

  @Column({ name: 'combustible_agregado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  combustible_agregado?: number;

  @Column({ name: 'combustible_final', type: 'decimal', precision: 10, scale: 2, nullable: true })
  combustible_final?: number;

  @Column({ name: 'ubicacion', type: 'varchar', length: 255, nullable: true })
  ubicacion?: string;

  @Column({ name: 'actividad_realizada', type: 'text', nullable: true })
  actividad_realizada?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'pendiente' })
  estado!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
