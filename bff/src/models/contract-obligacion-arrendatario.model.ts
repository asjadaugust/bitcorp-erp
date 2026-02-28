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

export type TipoObligacionArrendatario =
  | 'GUARDIANIA'
  | 'SENALIZACION_SEGURIDAD'
  | 'PAGOS_OPORTUNOS'
  | 'NO_TRASLADO_SIN_AUTORIZACION';

export type EstadoObligacionArrendatario = 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';

/** Labels per Cláusula 8 of CORP-GEM-F-001 */
export const OBLIGACION_ARRENDATARIO_LABELS: Record<TipoObligacionArrendatario, string> = {
  GUARDIANIA: 'Guardianía y custodia del equipo en zona de trabajo (§8.1)',
  SENALIZACION_SEGURIDAD: 'Señalizaciones de seguridad en área de trabajo (§8.2)',
  PAGOS_OPORTUNOS: 'Cumplir con los pagos previstos en Cláusula Quinta (§8.3)',
  NO_TRASLADO_SIN_AUTORIZACION: 'No trasladar equipo sin autorización del arrendador (§8.4)',
};

@Entity('contrato_obligacion_arrendatario', { schema: 'equipo' })
export class ContractObligacionArrendatario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contrato_id', type: 'integer' })
  contratoId!: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'tipo_obligacion', type: 'varchar', length: 50 })
  tipoObligacion!: TipoObligacionArrendatario;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: EstadoObligacionArrendatario;

  @Column({ name: 'fecha_compromiso', type: 'date', nullable: true })
  fechaCompromiso?: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
