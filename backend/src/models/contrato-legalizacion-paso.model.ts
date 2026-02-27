import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from './contract.model';

/**
 * PRD P-001 §4.3.3 — Notarial Legalization Steps
 *
 *   1 = ENVIO_PROVEEDOR      — Send 2 copies to provider for notarial signature
 *   2 = ENVIO_CENTRAL         — Send to Lima central office for legal rep signature
 *   3 = ARCHIVADO             — Archive: 1 copy to provider, 1 to project
 *   4 = COMPLETADO            — Legalization fully complete
 */
export type TipoPasoLegalizacion = 'ENVIO_PROVEEDOR' | 'ENVIO_CENTRAL' | 'ARCHIVADO' | 'COMPLETADO';

export const LEGALIZACION_PASO_LABELS: Record<TipoPasoLegalizacion, string> = {
  ENVIO_PROVEEDOR: 'Envío al Proveedor para firma notarial',
  ENVIO_CENTRAL: 'Envío a Oficina Central (Lima)',
  ARCHIVADO: 'Archivado de documentos',
  COMPLETADO: 'Legalización completada',
};

export const LEGALIZACION_PASOS: { numero: number; tipo: TipoPasoLegalizacion }[] = [
  { numero: 1, tipo: 'ENVIO_PROVEEDOR' },
  { numero: 2, tipo: 'ENVIO_CENTRAL' },
  { numero: 3, tipo: 'ARCHIVADO' },
  { numero: 4, tipo: 'COMPLETADO' },
];

@Entity('contrato_legalizacion_paso', { schema: 'equipo' })
export class ContratoLegalizacionPaso {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contrato_id', type: 'integer' })
  contratoId!: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'numero_paso', type: 'integer' })
  numeroPaso!: number;

  @Column({ name: 'tipo_paso', type: 'varchar', length: 40 })
  tipoPaso!: TipoPasoLegalizacion;

  @Column({ name: 'completado', type: 'boolean', default: false })
  completado!: boolean;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado?: Date;

  @Column({ name: 'completado_por', type: 'integer', nullable: true })
  completadoPor?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
