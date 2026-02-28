import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Trabajador } from './trabajador.model';

@Entity('disponibilidad_operador', { schema: 'rrhh' })
@Unique('uq_disp_op_fecha', ['trabajadorId', 'fecha', 'tenantId'])
export class DisponibilidadOperador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  @Index('idx_disp_op_trabajador')
  trabajadorId!: number;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'fecha', type: 'date' })
  @Index('idx_disp_op_fecha')
  fecha!: string;

  @Column({ name: 'disponible', type: 'boolean', default: true })
  disponible!: boolean;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  @Index('idx_disp_op_tenant')
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
