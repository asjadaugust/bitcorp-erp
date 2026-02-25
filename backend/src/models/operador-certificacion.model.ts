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

export type EstadoCertificacion = 'VIGENTE' | 'VENCIDO' | 'POR_VENCER';

@Entity('operador_certificacion', { schema: 'rrhh' })
export class CertificacionOperador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  @Index('idx_op_cert_trabajador')
  trabajadorId!: number;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'nombre_certificacion', type: 'varchar', length: 200 })
  nombreCertificacion!: string;

  @Column({ name: 'numero_certificacion', type: 'varchar', length: 100, nullable: true })
  numeroCertificacion?: string;

  @Column({ name: 'fecha_emision', type: 'date', nullable: true })
  fechaEmision?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ name: 'entidad_emisora', type: 'varchar', length: 200, nullable: true })
  entidadEmisora?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'VIGENTE' })
  estado!: EstadoCertificacion;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  @Index('idx_op_cert_tenant')
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
