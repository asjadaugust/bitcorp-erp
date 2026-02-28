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
import { ProviderDocument } from './provider-document.model';

export type TipoDocumentoRequerido =
  | 'POLIZA_TREC'
  | 'SOAT'
  | 'INSPECCION_TECNICA'
  | 'TARJETA_PROPIEDAD'
  | 'LICENCIA_CONDUCIR';

export type EstadoDocumentoRequerido = 'PENDIENTE' | 'CUMPLIDO' | 'VENCIDO';

@Entity('contrato_documento_requerido', { schema: 'equipo' })
export class ContractRequiredDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contrato_id', type: 'integer' })
  contratoId!: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50 })
  tipoDocumento!: TipoDocumentoRequerido;

  @Column({ name: 'provider_document_id', type: 'integer', nullable: true })
  providerDocumentId?: number | null;

  @ManyToOne(() => ProviderDocument, { nullable: true })
  @JoinColumn({ name: 'provider_document_id' })
  providerDocument?: ProviderDocument;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: EstadoDocumentoRequerido;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
