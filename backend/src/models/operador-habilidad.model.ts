import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Trabajador } from './trabajador.model';

export type NivelHabilidad = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'EXPERTO';

@Entity('operador_habilidad', { schema: 'rrhh' })
export class HabilidadOperador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  @Index('idx_op_hab_trabajador')
  trabajadorId!: number;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'tipo_equipo', type: 'varchar', length: 100 })
  tipoEquipo!: string;

  @Column({ name: 'nivel_habilidad', type: 'varchar', length: 20, default: 'PRINCIPIANTE' })
  nivelHabilidad!: NivelHabilidad;

  @Column({ name: 'anios_experiencia', type: 'decimal', precision: 4, scale: 1, default: 0 })
  aniosExperiencia!: number;

  @Column({ name: 'ultima_verificacion', type: 'date', nullable: true })
  ultimaVerificacion?: Date;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  @Index('idx_op_hab_tenant')
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
