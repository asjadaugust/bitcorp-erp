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

@Entity('documento_trabajador', { schema: 'rrhh' })
export class OperatorDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  trabajadorId!: number;

  @ManyToOne(() => Trabajador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50 })
  tipoDocumento!: string; // 'DNI', 'LICENCIA', 'CERTIFICADO', etc.

  @Column({ name: 'numero_documento', type: 'varchar', length: 100, nullable: true })
  numeroDocumento?: string;

  @Column({ name: 'fecha_emision', type: 'date', nullable: true })
  fechaEmision?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ name: 'archivo_url', type: 'text', nullable: true })
  archivoUrl?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Backward compatibility
export { OperatorDocument as DocumentoTrabajador };
