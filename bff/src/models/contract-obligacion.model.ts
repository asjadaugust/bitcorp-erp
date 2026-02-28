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

export type TipoObligacionArrendador =
  | 'CONDICIONES_OPERATIVAS'
  | 'REPRESENTANTE_FRENTE'
  | 'POLIZA_TREC'
  | 'NORMAS_SEGURIDAD'
  | 'SOAT'
  | 'REPARACION_REEMPLAZO'
  | 'KIT_ANTIDERRAME'
  | 'DOCUMENTOS_VALIDOS'
  | 'REEMPLAZO_OPERADOR';

export type EstadoObligacion = 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';

/** Labels per Cláusula 7 of CORP-GEM-F-001 */
export const OBLIGACION_LABELS: Record<TipoObligacionArrendador, string> = {
  CONDICIONES_OPERATIVAS: 'Equipo en condiciones operativas (§7.1)',
  REPRESENTANTE_FRENTE: 'Representante en frente de trabajo (§7.2)',
  POLIZA_TREC: 'Póliza TREC vigente (§7.3)',
  NORMAS_SEGURIDAD: 'Cumplimiento de normas de seguridad (§7.4)',
  SOAT: 'SOAT vigente (§7.5)',
  REPARACION_REEMPLAZO: 'Reparación/reemplazo en máximo 5 días (§7.6)',
  KIT_ANTIDERRAME: 'Kit anti-derrame y dispositivos de seguridad (§7.7)',
  DOCUMENTOS_VALIDOS: 'Documentos válidos — CITV y licencia operador (§7.8)',
  REEMPLAZO_OPERADOR: 'Reemplazo de operador por renuncia (§7.9)',
};

@Entity('contrato_obligacion', { schema: 'equipo' })
export class ContractObligacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contrato_id', type: 'integer' })
  contratoId!: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'tipo_obligacion', type: 'varchar', length: 50 })
  tipoObligacion!: TipoObligacionArrendador;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: EstadoObligacion;

  @Column({ name: 'fecha_compromiso', type: 'date', nullable: true })
  fechaCompromiso?: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
