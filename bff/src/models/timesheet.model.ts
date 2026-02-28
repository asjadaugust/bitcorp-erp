import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trabajador } from './trabajador.model';
import { User } from './user.model';

export type EstadoTareo = 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';

@Entity('tareo', { schema: 'rrhh' })
export class Timesheet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'trabajador_id', type: 'integer' })
  trabajadorId!: number;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'periodo', type: 'varchar', length: 7 })
  periodo!: string; // Format: 'YYYY-MM' (e.g., '2024-01')

  @Column({ name: 'total_dias_trabajados', type: 'integer', default: 0 })
  totalDiasTrabajados!: number;

  @Column({ name: 'total_horas', type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalHoras!: number;

  @Column({ name: 'monto_calculado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoCalculado?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'BORRADOR' })
  estado!: EstadoTareo;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creador?: User;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  aprobadoPor?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador?: User;

  @Column({ name: 'aprobado_en', type: 'timestamp', nullable: true })
  aprobadoEn?: Date;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
