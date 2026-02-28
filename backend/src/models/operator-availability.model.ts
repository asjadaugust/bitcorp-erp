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

@Entity('disponibilidad_trabajador', { schema: 'rrhh' })
export class OperatorAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  trabajadorId!: number;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: Date;

  @Column({ name: 'disponible', type: 'boolean', default: true })
  disponible!: boolean;

  @Column({ name: 'motivo', type: 'varchar', length: 255, nullable: true })
  motivo?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
